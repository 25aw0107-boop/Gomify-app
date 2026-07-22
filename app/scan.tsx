import 'react-native-url-polyfill/auto';

import { ThemedText } from '@/components/themed-text';
import { TOKYO_GARBAGE_DATABASE } from '@/constants/garbageData';
import { FontAwesome5, Ionicons, Octicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from './tema/ThemeContext';


const ai = new GoogleGenerativeAI("AQ.Ab8RN6J_njhp_oNxU-Kkb0f4oI3FXZtbxFwMH872ExluXhJ4Bg"); 

interface ScanResult {
  itemName: string;
  category: string;
  instructions: string;
}

interface GarbageItem {
  品名: string;
  分別区分: string;
  出し方?: string;
}

export default function ScanScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const cameraRef = useRef<any>(null);

  const { theme, selectedDesign } = useAppTheme();

  const isKawaii = selectedDesign === 'cute';
  const isNight = selectedDesign === 'night';
  const isCafe = selectedDesign === 'cafe';

  const cafeTextColor = '#4A3B32';
  const cafeAccentColor = '#8fa288';
  const cafeBackgroundColor = '#F9F6F0';

  const kawaiiTextColor = '#6B4E3C';
  const kawaiiAccentColor = '#c8e4c5';
  const kawaiiBackgroundColor = '#FCF5F0';
  const kawaiiPeachPink = '#F4A396';

  const nightPurple = '#9288da';

  const mainBackgroundColor = isNight ? '#000000' : isKawaii ? kawaiiBackgroundColor : isCafe ? cafeBackgroundColor : '#F5F5F5';
  const accentTextColor = isNight ? '#E6E19D' : isKawaii ? kawaiiTextColor : isCafe ? cafeTextColor : (theme?.colors?.text || '#000000');
  
  const accentPrimaryColor = isNight ? nightPurple : isKawaii ? kawaiiAccentColor : isCafe ? cafeAccentColor : (theme?.colors?.primary || '#76C800');
  const borderThemeColor = isNight ? nightPurple : isKawaii ? '#F2EDE9' : isCafe ? '#a1896a' : '#E0E0E0';
  
  const tabBarBgColor = isNight ? '#1C2432' : isKawaii ? '#E6F0E3' : isCafe ? '#F2EBE3' : '#D1E0C5';
  const tabActiveColor = isKawaii ? kawaiiPeachPink : isNight ? '#A6C56F' : isCafe ? cafeAccentColor : '#5B9E00';
  const tabInactiveColor = isKawaii ? kawaiiPeachPink : isNight ? '#7A8B9E' : isCafe ? '#B8A89A' : '#555555';
  const isHomeActive = pathname === '/dashboard';
  const isCalendarActive = pathname === '/calendar';
  const isScanActive = pathname === '/scan';
  const isReuseActive = pathname.startsWith('/reuse');
  const isMyPageActive = pathname === '/mypage';

  const gradientColors = isNight
    ? ['#000000', '#111111']
    : isKawaii
      ? ['#E6F0E3', kawaiiBackgroundColor]
      : isCafe
        ? ['#EAE2D6', cafeBackgroundColor]
        : ['#DCE8D3', '#FFFFFF'];

const cardThemedStyle = [
  styles.card,
  {
    backgroundColor: isNight
      ? '#1C2432'
      : isKawaii
      ? '#FFFDFB'
      : isCafe
      ? '#FFFDF9'
      : '#FFFFFF',

    borderWidth: 1.5,

    borderColor: isNight
      ? '#5B6DAA'      
      : isKawaii
      ? '#F3D4CF'      
      : isCafe
      ? '#C7B299'      
      : '#D9E5D2',     

    shadowColor: isNight
      ? '#000'
      : isKawaii
      ? '#E7CFC7'
      : isCafe
      ? '#B79C80'
      : '#B8C9AE',
  },

  isNight && styles.nightCard,
  (isKawaii || isCafe) && styles.warmCard,
];

  const searchBarBackground = isNight ? '#2E3A4D' : (isKawaii || isCafe) ? '#F2EDE9' : '#F1F3F5';
  const resultInfoBackground = isNight ? '#2A3442' : (isKawaii || isCafe) ? '#FFFDFB' : '#F8F9FA';
  const resultInfoBorder = isNight ? nightPurple : (isKawaii || isCafe) ? '#F2EDE9' : '#E9ECEF';
  const searchTextColor = isNight ? '#E6E19D' : accentTextColor;

  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false); 

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<ScanResult | null | 'NOT_FOUND'>(null);

  const startScanner = async () => {
    if (!permission || !permission.granted) {
      const status = await requestPermission();
      if (!status.granted) {
        Alert.alert("カメラの権限が必要です", "ゴミをスキャンするには、カメラの使用を許可してください。");
        return;
      }
    }
    setSearchResult(null);
    setIsScannerOpen(true);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function generateWithRetry(model: any, contents: any, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await model.generateContent(contents);
      } catch (err: any) {
        if (err?.status === 503 && i < retries - 1) {
          console.log(`Retry ${i + 1}...`);
          await delay(2000);
          continue;
        }
        throw err;
      }
    }
  }

  const handleCaptureAndAnalyze = async () => {
    if (cameraRef.current && !isScanning) {
      try {
        setIsScanning(true);
        const options = {
          quality: 0.2,
          base64: true,
        }; 
        
        const photo = await cameraRef.current.takePictureAsync(options);

        if (!photo || !photo.base64) {
          throw new Error("カメラから画像データを取得できませんでした。");
        }

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const prompt = "Identify the main object in this image that is being thrown away as garbage. Reply with ONLY the item name in Japanese (e.g., ペットボトル, フライパン, 雑誌). Do not write any other sentences, punctuation, or quotes.";
        
        const imagePart = {
          inlineData: {
            data: photo.base64,
            mimeType: "image/jpeg"
          },
        };

        console.log("Sending request to Gemini...");
        const result = await generateWithRetry(model, [prompt, imagePart]);
        console.log("Response received");

        const aiResponseText = result.response.text().trim().replace(/["'「」]/g, '');

        if (!aiResponseText) {
          throw new Error("AIから空の応答が返されました。");
        }

        const database = TOKYO_GARBAGE_DATABASE as unknown as GarbageItem[];
        

        const safeAiText = aiResponseText ? aiResponseText.toLowerCase() : "";

        const foundItem = database.find(item => {
          const itemName = item.品名 ? item.品名.toLowerCase() : "";
          
          if (!itemName || !safeAiText) return false; 
          
          return itemName.includes(safeAiText) || safeAiText.includes(itemName);
        });

        if (foundItem) {
          setScanResult({
            itemName: foundItem.品名,
            category: foundItem.分別区分,
            instructions: foundItem.出し方 || "詳細ルールは各自治体へ確認してください。"
          });
        } else {
          setScanResult({
            itemName: aiResponseText,
            category: "可燃/不燃 (要確認)",
            instructions: "お住まいの地域のゴミ収集カレンダーで、詳しい回収日をご確認ください。"
          });
        }

      } catch (error: any) {
        console.error("Scan Error:", error);
        Alert.alert("エラー", error?.message || "画像の解析に失敗しました。");
      } finally {
        setIsScanning(false);
        setIsScannerOpen(false);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setScanResult(null);
    setSearchResult(null); 
    setIsSearching(true); 
    
    const query = searchQuery.toLowerCase().trim();
    const database = TOKYO_GARBAGE_DATABASE as unknown as GarbageItem[];


    const foundItem = database.find(item => {
      const itemName = item.品名 ? item.品名.toLowerCase() : "";
      
      if (!itemName) return false; 
      
      return itemName.includes(query) || query.includes(itemName);
    });

    if (foundItem) {
      setSearchResult({
        itemName: foundItem.品名,
        category: foundItem.分別区分,
        instructions: foundItem.出し方 || "詳細ルールは各自治体へ確認してください。"
      });
      setIsSearching(false);
      return;
    }

    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `The user wants to throw away "${query}" in Tokyo. 
      Reply ONLY in this exact format separated by a pipe (|):
      [Japanese translation of the item]|[Garbage Category like 可燃ごみ / 不燃ごみ / 資源 / 粗大ごみ]|[Detailed Japanese instructions on how to prepare and throw it away]`;

      const result = await generateWithRetry(model, [prompt]);
      const responseText = result.response.text().trim();

      const [aiName, aiCategory, aiInstructions] = responseText.split('|');

      if (aiName && aiCategory) {
        setSearchResult({
          itemName: aiName.trim(),
          category: aiCategory.trim(),
          instructions: aiInstructions ? aiInstructions.trim() : "お住まいの地域のゴミ収集カレンダーで、詳しい回収日をご確認ください。"
        });
      } else {
        setSearchResult('NOT_FOUND');
      }
    } catch (error) {
      console.error("AI Search Error:", error);
      setSearchResult('NOT_FOUND');
    } finally {
      setIsSearching(false); 
    }
  };

  return (
    <View style={[styles.mainWrapper, { backgroundColor: mainBackgroundColor }] }>
      <Tabs.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={gradientColors as [string, string]}
        style={styles.gradientBackground}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.42 }}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={() => router.push('/dashboard')}>
            <Ionicons name="chevron-back" size={28} color={accentTextColor} />
          </Pressable>
          <View style={styles.headerRow}>
            <View style={styles.headerItem}>
              <Ionicons name="scan-outline" size={24} color={accentTextColor} />
              <ThemedText style={[styles.headerText, { color: accentTextColor }]}>ゴミ識別スキャン</ThemedText>
            </View>
          </View>
        </View>

  
        <View style={cardThemedStyle}>
          <View style={styles.introRow}>
            <Image source={require('@/assets/images/korehagomi.png')} style={styles.introImage} />
            <View style={styles.introTextContainer}>
              <ThemedText style={[styles.introTitle, { color: accentTextColor }]}>これは何のゴミ？</ThemedText>
              <ThemedText style={[styles.introDescription, { color: isNight ? accentTextColor : (isKawaii || isCafe) ? '#8E7B71' : '#666' }]}>
                Gomifyを使って簡単に調べましょう。{"\n"}
                正しい分別方法がすぐに分かります。
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={cardThemedStyle}>
          {!scanResult ? (
            <>
              <ThemedText style={[styles.sectionTitleCenter, { color: accentTextColor }]}>カメラでスキャンする</ThemedText>
              <View style={styles.scanActionRow}>
                <ThemedText style={[styles.scanInstruction, { color: isNight ? accentTextColor : (isKawaii || isCafe) ? '#8E7B71' : '#666' }]}>
                  捨てるものをカメラで撮影するだけで、自動的にゴミの分別種類を調べることができます。
                </ThemedText>
                <Pressable style={[styles.bigScanButton, { backgroundColor: accentPrimaryColor, shadowColor: accentPrimaryColor }]} onPress={startScanner}>
                  <Ionicons name="camera-outline" size={24} color={isNight ? '#000000' : '#ffffff'} />
                  <ThemedText style={[styles.bigScanButtonText, { color: isNight ? '#000000' : '#ffffff' }]}>スキャンを開始</ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeaderRow}>
                <Ionicons name="checkmark-circle" size={24} color={accentPrimaryColor} />
                <ThemedText style={[styles.resultMainTitle, { color: accentTextColor }]}>スキャン結果</ThemedText>
              </View>

              <View style={[styles.resultInfoBox, { backgroundColor: resultInfoBackground, borderColor: borderThemeColor }] }>
                <ThemedText style={[styles.resultLabel, { color: isNight ? '#7A8B9E' : '#868E96' }]}>品目名</ThemedText>
                <ThemedText style={[styles.resultValueText, { color: accentTextColor }]}>{scanResult.itemName}</ThemedText>
                <View style={[styles.resultDivider, { backgroundColor: resultInfoBorder }]} />
                <ThemedText style={[styles.resultLabel, { color: isNight ? '#7A8B9E' : '#868E96' }]}>分別区分</ThemedText>
                <ThemedText style={[styles.resultValueTextBadge, { color: accentPrimaryColor }]}>{scanResult.category}</ThemedText>
                <View style={[styles.resultDivider, { backgroundColor: resultInfoBorder }]} />
                <ThemedText style={[styles.resultLabel, { color: isNight ? '#7A8B9E' : '#868E96' }]}>出し方の注意・手順</ThemedText>
                <ThemedText style={[styles.resultInstructionText, { color: isNight ? accentTextColor : '#495057' }]}>{scanResult.instructions}</ThemedText>
              </View>

              <Pressable style={[styles.rescanButton, { backgroundColor: isNight ? '#4A5A6D' : '#495057' }]} onPress={startScanner}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <ThemedText style={styles.rescanButtonText}>もう一度スキャンする</ThemedText>
              </Pressable>
            </View>
          )}
        </View>


        <View style={cardThemedStyle}>
          <ThemedText style={[styles.sectionTitleCenter, { color: accentTextColor }]}>キーワードで検索する</ThemedText>
          <View style={[styles.searchBarContainer, { backgroundColor: searchBarBackground, borderColor: isNight ? nightPurple : borderThemeColor }] }>
            <Ionicons name="search-outline" size={20} color={isNight ? '#7A8B9E' : '#666'} style={styles.searchIcon} />
            <TextInput 
              style={[styles.searchInput, { color: searchTextColor }]} 
              placeholder="ゴミの名称を入力（例：ペットボトル）" 
              placeholderTextColor={isNight ? '#7A8B9E' : '#999'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              editable={!isSearching}
            />
            <Pressable 
              style={[styles.searchButton, { backgroundColor: accentPrimaryColor }]} 
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={isNight ? '#000000' : '#ffffff'} />
              ) : (
                <ThemedText style={[styles.searchButtonText, { color: isNight ? '#000000' : '#ffffff' }]}>検索</ThemedText>
              )}
            </Pressable>
          </View>

          {searchResult && searchResult !== 'NOT_FOUND' && (
            <View style={[styles.resultContainer, { marginTop: 20 }]}>
              <View style={styles.resultHeaderRow}>
                <Ionicons name="search" size={22} color={accentPrimaryColor} />
                <ThemedText style={[styles.resultMainTitle, { color: accentTextColor }]}>検索結果</ThemedText>
              </View>
              <View style={[styles.resultInfoBox, { backgroundColor: resultInfoBackground, borderColor: borderThemeColor }] }>
                <ThemedText style={[styles.resultLabel, { color: isNight ? '#7A8B9E' : '#868E96' }]}>品目名</ThemedText>
                <ThemedText style={[styles.resultValueText, { color: accentTextColor }]}>{searchResult.itemName}</ThemedText>
                <View style={[styles.resultDivider, { backgroundColor: resultInfoBorder }]} />
                <ThemedText style={[styles.resultLabel, { color: isNight ? '#7A8B9E' : '#868E96' }]}>分別区分</ThemedText>
                <ThemedText style={[styles.resultValueTextBadge, { color: accentPrimaryColor }]}>{searchResult.category}</ThemedText>
                <View style={[styles.resultDivider, { backgroundColor: resultInfoBorder }]} />
                <ThemedText style={[styles.resultLabel, { color: isNight ? '#7A8B9E' : '#868E96' }]}>出し方の注意・手順</ThemedText>
                <ThemedText style={[styles.resultInstructionText, { color: isNight ? accentTextColor : '#495057' }]}>{searchResult.instructions}</ThemedText>
              </View>
            </View>
          )}

          {searchResult === 'NOT_FOUND' && (
            <View style={[styles.notFoundContainer, { borderColor: isNight ? nightPurple : borderThemeColor }, isNight && { backgroundColor: '#2A3442' }, isKawaii && { backgroundColor: '#FFF0ED' }, isCafe && { backgroundColor: '#FFF8F1' }]}>
              <Ionicons name="alert-circle-outline" size={24} color={isNight ? '#FCA5A5' : isKawaii ? kawaiiPeachPink : isCafe ? cafeAccentColor : '#EF4444'} />
              <ThemedText style={[styles.notFoundText, { color: isNight ? '#FCA5A5' : isKawaii ? kawaiiPeachPink : isCafe ? cafeAccentColor : '#EF4444' }]}>該当するゴミが見つかりませんでした。</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CAMERA SCANNER MODAL */}
      <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject}>
            <SafeAreaView style={styles.cameraSafeArea}>
              <View style={styles.cameraHeader}>
                <Pressable style={styles.closeCameraButton} onPress={() => setIsScannerOpen(false)}>
                  <Ionicons name="close" size={28} color="#FFF" />
                </Pressable>
                <ThemedText style={styles.cameraTitle}>ゴミを枠内に収めてください</ThemedText>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.scannerTargetArea}>
                <View style={[styles.targetCorner, styles.topLeftCorner, { borderColor: accentPrimaryColor }]} />
                <View style={[styles.targetCorner, styles.topRightCorner, { borderColor: accentPrimaryColor }]} />
                <View style={[styles.targetCorner, styles.bottomLeftCorner, { borderColor: accentPrimaryColor }]} />
                <View style={[styles.targetCorner, styles.bottomRightCorner, { borderColor: accentPrimaryColor }]} />
              </View>

              <View style={styles.cameraFooter}>
                <Pressable style={[styles.captureButton, isScanning && styles.disabledCaptureButton]} onPress={handleCaptureAndAnalyze} disabled={isScanning}>
                  {isScanning ? (
                    <ActivityIndicator size="large" color={accentPrimaryColor} />
                  ) : (
                    <View style={styles.innerCaptureCircle} />
                  )}
                </Pressable>
              </View>
              {isScanning && (
  <View style={styles.scanningOverlay}>
    <ActivityIndicator size="large" color="#FFFFFF" />
    <ThemedText style={styles.scanningText}>
      Scanning...
    </ThemedText>
  </View>
)}
            </SafeAreaView>
          </CameraView>
        </View>
      </Modal>


      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBarBackground, { backgroundColor: tabBarBgColor }]} />
        <View style={styles.tabBarContent}>

          <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}>
            <View style={[styles.tabIconCircle, isHomeActive && styles.tabIconCircleActive]}>
              <Octicons name="home" size={24} color={isHomeActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.tabLabelBottom, { color: isHomeActive ? tabActiveColor : tabInactiveColor, fontWeight: isHomeActive ? 'bold' : '600' }]}>
              ホーム
            </ThemedText>
          </Pressable>


          <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}>
            <View style={[styles.tabIconCircle, isCalendarActive && styles.tabIconCircleActive]}>
              <FontAwesome5 name="calendar-alt" size={22} color={isCalendarActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.tabLabelBottom, { color: isCalendarActive ? tabActiveColor : tabInactiveColor, fontWeight: isCalendarActive ? 'bold' : '600' }]}>
              ゴミカレンダー
            </ThemedText>
          </Pressable>

          <Pressable style={styles.scanWrapper} onPress={() => router.push('/scan')}>
            <View style={[styles.scanButtonTabBar, isScanActive && styles.tabIconCircleActiveScan]}>
              <Ionicons name="scan-outline" size={26} color={isScanActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.scanLabel, { color: isScanActive ? tabActiveColor : tabInactiveColor, fontWeight: isScanActive ? 'bold' : '700' }]}>
              ゴミスキャン
            </ThemedText>
          </Pressable>


          <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse')}>
            <View style={[styles.tabIconCircle, isReuseActive && styles.tabIconCircleActive]}>
              <Ionicons name="refresh-circle-outline" size={26} color={isReuseActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.tabLabelBottom, { color: isReuseActive ? tabActiveColor : tabInactiveColor, fontWeight: isReuseActive ? 'bold' : '600' }]}>
              リユース
            </ThemedText>
          </Pressable>

          <Pressable style={styles.tabItemBottom} onPress={() => router.push('/mypage')}>
            <View style={[styles.tabIconCircle, isMyPageActive && styles.tabIconCircleActive]}>
              <Ionicons name="person" size={22} color={isMyPageActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.tabLabelBottom, { color: isMyPageActive ? tabActiveColor : tabInactiveColor, fontWeight: isMyPageActive ? 'bold' : '600' }]}>
              マイページ
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  gradientBackground: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 120 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20  },
  backButton: { padding: 4, marginRight: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  headerText: { fontSize: 18, fontWeight: 'bold', marginLeft: 6 },
  card: { borderRadius: 20, padding: 28, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  nightCard: { shadowColor: '#000', shadowOpacity: 0.22, elevation: 4 },
  warmCard: { shadowColor: '#C9B9AA', shadowOpacity: 0.12, elevation: 3 },
  introRow: { flexDirection: 'row', alignItems: 'center' },
  introImage: { width: 130, height: 120, marginLeft: -20 },
  introTextContainer: { flex: 1 },
  introTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  introDescription: { fontSize: 13, lineHeight: 18 },
  sectionTitleCenter: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  scanActionRow: { alignItems: 'center', paddingVertical: 10 },
  scanInstruction: { fontSize: 13, textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },
  bigScanButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  bigScanButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },


  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    borderRadius: 30,
    borderWidth: 1.5,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1, 
    minHeight: 48,
    marginRight: 8,
    fontSize: 14,
  },
  searchButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },


  notFoundContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, backgroundColor: '#FFF5F5', padding: 12, borderRadius: 12, borderWidth: 1.5 },
  notFoundText: { fontSize: 13, marginLeft: 8, fontWeight: '500' },
  resultContainer: { paddingVertical: 4 },
  resultHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  resultMainTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 6 },
  resultInfoBox: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, borderWidth: 1.5 },
  resultLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  resultValueText: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  resultValueTextBadge: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  resultInstructionText: { fontSize: 13, lineHeight: 18 },
  resultDivider: { height: 1, backgroundColor: '#E9ECEF', marginVertical: 8 },
  rescanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20, marginTop: 12 },
  rescanButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraSafeArea: { flex: 1, justifyContent: 'space-between' },
  cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  closeCameraButton: { padding: 4 },
  cameraTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  scannerTargetArea: { width: 250, height: 250, alignSelf: 'center', position: 'relative' },
  targetCorner: { position: 'absolute', width: 20, height: 20, borderColor: '#76C800' },
  topLeftCorner: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRightCorner: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeftCorner: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRightCorner: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  cameraFooter: { alignItems: 'center', paddingBottom: 30 },
  captureButton: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  disabledCaptureButton: { borderColor: '#999' },
  innerCaptureCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFF' },


  tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end' },
  tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, zIndex: 1 },
  tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
  tabItemBottom: { alignItems: 'center', justifyContent: 'flex-start', flex: 1, height: 80, position: 'relative', paddingTop: 12 },
  scanWrapper: { alignItems: 'center', justifyContent: 'flex-start', flex: 1, height: 80, position: 'relative', paddingTop: 12 },
  scanButtonTabBar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', transform: [{ translateY: 4 }] },
  tabIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', transform: [{ translateY: 4 }] },
  tabIconCircleActiveScan: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, transform: [{ translateY: -22 }] },
  tabIconCircleActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4, transform: [{ translateY: -38 }] },
  tabLabelBottom: { fontSize: 9, color: '#555', fontWeight: '600', textAlign: 'center', position: 'absolute', bottom: 4, left: 0, right: 0 },
  scanLabel: { fontSize: 9, color: '#555', fontWeight: '700', textAlign: 'center', position: 'absolute', bottom: 4, left: 0, right: 0 },
});