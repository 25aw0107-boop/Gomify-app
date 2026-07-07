// app/scan.tsx
import { ThemedText } from '@/components/themed-text';
import { TOKYO_GARBAGE_DATABASE } from '@/constants/garbageData';
import { FontAwesome5, Ionicons, Octicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 🔑 အစ်ကို့ရဲ့ AI Studio ထဲက API Key အစစ်ကို ဒီထဲမှာ ထည့်ပေးထားပါတယ်ဗျာ
const ai = new GoogleGenerativeAI("AQ.Ab8RN6J_njhp_oNxU-Kkb0f4oI3FXZtbxFwMH872ExluXhJ4Bg" ); 

interface ScanResult {
  itemName: string;
  category: string;
  instructions: string;
}

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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


  const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(
  model: any,
  contents: any,
  retries = 3
) {
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
  // ကင်မရာဖြင့် တကယ့်ပစ္စည်းကို Scan ဖတ်ပြီး AI ဖြင့် ခွဲခြားမည့် စနစ်စစ်စစ်
  const handleCaptureAndAnalyze = async () => {
    if (cameraRef.current && !isScanning) {
      try {
        setIsScanning(true);
        const options = {
  quality: 0.15,
  base64: true,
  skipProcessing: true,
}; // reduce the photo quality to 30% to speed up the upload and analysis
        const photo = await cameraRef.current.takePictureAsync(options);

        if (!photo || !photo.base64) {
          throw new Error("no photo data");
        }

        // Loading ပိတ်မိမနေအောင် 8 စက္ကန့်ကျော်ရင် ပယ်ဖျက်မည့် စနစ် (Timeout)
       //const controller = new AbortController();
        //const timeoutId = setTimeout(() => controller.abort(), 8000);

        const model = ai.getGenerativeModel({model: "gemini-2.5-flash-lite",});
        const prompt = "Identify the main object in this image that is being thrown away as garbage. Reply with ONLY the item name in Japanese (e.g., ペットボトル, フライパン, 雑誌). Do not write any other sentences.";
        
        const imagePart = {
          inlineData: {
            data: photo.base64,
            mimeType: "image/jpeg"
          },
        };

        // AI ထံ ပို့ပြီး အဖြေတောင်းခြင်း
        console.log("Sending request...");
        const result = await generateWithRetry(
  model,
  [prompt, imagePart]
);
        console.log("Response received");
        //clearTimeout(timeoutId);

       const aiResponseText = result.response.text().trim();

        // Database ထဲမှာ ရှာဖွေခြင်း
        const foundItem = TOKYO_GARBAGE_DATABASE.find(item => 
          item.品名.toLowerCase().includes(aiResponseText.toLowerCase()) ||
          aiResponseText.toLowerCase().includes(item.品名.toLowerCase())
        );

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
            instructions: "お住まいの地域のゴミ出しルールをご確認ください。"
          });
        }

      } catch (error: any) {
  console.log("==================");
  console.log(error);
  console.log(error?.message);
  console.log(JSON.stringify(error, null, 2));

  Alert.alert(
    "Error",
    error?.message || JSON.stringify(error)
  );
}
finally {
   setIsScanning(false);
   setIsScannerOpen(false);
}
    }
  };

  // တိုကျို ၂၃ မြို့နယ်လုံးရဲ့ database ထဲမှာ လိုက်ရှာမယ့် Logic
  const handleSearch = () => {
  if (!searchQuery.trim()) return;
  setScanResult(null);
  const query = searchQuery.toLowerCase().trim();

  // TOKYO_GARBAGE_DATABASE ထဲမှာ ရှာဖွေခြင်း
  const foundItem = TOKYO_GARBAGE_DATABASE.find(item => {
    const itemName = item.品名 || "";
    return itemName.toLowerCase().includes(query);
  });

  if (foundItem) {
    setSearchResult({
      itemName: foundItem.品名,
      category: foundItem.分別区分,
      instructions: foundItem.出し方 || "詳細ルールは各自治体へ確認してください。"
    });
  } else {
    setSearchResult('NOT_FOUND');
  }
};

  return (
    <View style={styles.mainWrapper}>
      <Tabs.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={['#DCE8D3', '#FFFFFF']}
        style={styles.gradientBackground}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.42 }}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={() => router.push('/dashboard')}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </Pressable>
          <View style={styles.headerRow}>
            <View style={styles.headerItem}>
              <Ionicons name="scan-outline" size={24} color="#000" />
              <ThemedText style={styles.headerText}>ゴミ識別スキャン</ThemedText>
            </View>
          </View>
        </View>

        {/* INTRO CARD */}
        <View style={styles.card}>
          <View style={styles.introRow}>
            <Image source={require('@/assets/images/korehagomi.png')} style={styles.introImage} />
            <View style={styles.introTextContainer}>
              <ThemedText style={styles.introTitle}>これは何のゴミ？</ThemedText>
              <ThemedText style={styles.introDescription}>
                Gomifyを使って簡単に調べましょう。{"\n"}
                正しい分別方法がすぐに分かります。
              </ThemedText>
            </View>
          </View>
        </View>

        {/* CAMERA SCANNER CARD */}
        <View style={styles.card}>
          {!scanResult ? (
            <>
              <ThemedText style={styles.sectionTitleCenter}>カメラでスキャンする</ThemedText>
              <View style={styles.scanActionRow}>
                <ThemedText style={styles.scanInstruction}>
                  捨てるものをカメラで撮影するだけで、自動的にゴミの分別種類を調べることができます。
                </ThemedText>
                <Pressable style={styles.bigScanButton} onPress={startScanner}>
                  <Ionicons name="camera-outline" size={24} color="#fff" />
                  <ThemedText style={styles.bigScanButtonText}>スキャンを開始</ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeaderRow}>
                <Ionicons name="checkmark-circle" size={24} color="#76C800" />
                <ThemedText style={styles.resultMainTitle}>スキャン結果</ThemedText>
              </View>

              <View style={styles.resultInfoBox}>
                <ThemedText style={styles.resultLabel}>品目名</ThemedText>
                <ThemedText style={styles.resultValueText}>{scanResult.itemName}</ThemedText>
                <View style={styles.resultDivider} />
                <ThemedText style={styles.resultLabel}>分別区分</ThemedText>
                <ThemedText style={styles.resultValueTextBadge}>{scanResult.category}</ThemedText>
                <View style={styles.resultDivider} />
                <ThemedText style={styles.resultLabel}>出し方の注意・手順</ThemedText>
                <ThemedText style={styles.resultInstructionText}>{scanResult.instructions}</ThemedText>
              </View>

              <Pressable style={styles.rescanButton} onPress={startScanner}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <ThemedText style={styles.rescanButtonText}>もう一度スキャンする</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {/* KEYWORD SEARCH CARD */}
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitleCenter}>キーワードで検索する</ThemedText>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="ゴミの名称を入力（例：ペットボトル）" 
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <ThemedText style={styles.searchButtonText}>検索</ThemedText>
            </Pressable>
          </View>

          {searchResult && searchResult !== 'NOT_FOUND' && (
            <View style={[styles.resultContainer, { marginTop: 20 }]}>
              <View style={styles.resultHeaderRow}>
                <Ionicons name="search" size={22} color="#76C800" />
                <ThemedText style={styles.resultMainTitle}>検索結果</ThemedText>
              </View>
              <View style={styles.resultInfoBox}>
                <ThemedText style={styles.resultLabel}>品目名</ThemedText>
                <ThemedText style={styles.resultValueText}>{searchResult.itemName}</ThemedText>
                <View style={styles.resultDivider} />
                <ThemedText style={styles.resultLabel}>分別区分</ThemedText>
                <ThemedText style={styles.resultValueTextBadge}>{searchResult.category}</ThemedText>
                <View style={styles.resultDivider} />
                <ThemedText style={styles.resultLabel}>出し方の注意・手順</ThemedText>
                <ThemedText style={styles.resultInstructionText}>{searchResult.instructions}</ThemedText>
              </View>
            </View>
          )}

          {searchResult === 'NOT_FOUND' && (
            <View style={styles.notFoundContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
              <ThemedText style={styles.notFoundText}>該当するゴミが見つかりませんでした。</ThemedText>
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
                <View style={[styles.targetCorner, styles.topLeftCorner]} />
                <View style={[styles.targetCorner, styles.topRightCorner]} />
                <View style={[styles.targetCorner, styles.bottomLeftCorner]} />
                <View style={[styles.targetCorner, styles.bottomRightCorner]} />
              </View>

              <View style={styles.cameraFooter}>
                <Pressable style={[styles.captureButton, isScanning && styles.disabledCaptureButton]} onPress={handleCaptureAndAnalyze} disabled={isScanning}>
                  {isScanning ? (
                    <ActivityIndicator size="large" color="#76C800" />
                  ) : (
                    <View style={styles.innerCaptureCircle} />
                  )}
                </Pressable>
              </View>
            </SafeAreaView>
          </CameraView>
        </View>
      </Modal>

      {/* FOOTER TAB BAR */}
      <View style={styles.tabBarContainer}>
        <View style={styles.scanBackgroundCircle} />
        <View style={styles.tabBarBackground} />
        <View style={styles.tabBarContent}>
          <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}>
            <Octicons name="home" size={24} color="#555" />
            <ThemedText style={styles.tabLabelBottom}>ホーム</ThemedText>
          </Pressable>
          <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}>
            <FontAwesome5 name="calendar-alt" size={22} color="#555" />
            <ThemedText style={styles.tabLabelBottom}>カレンダー</ThemedText>
          </Pressable>
          <View style={styles.scanWrapper}>
            <Pressable style={styles.scanButton}>
              <Ionicons name="scan-outline" size={26} color="#5B9E00" />
            </Pressable>
            <ThemedText style={[styles.scanLabel, { color: '#5B9E00', fontWeight: 'bold' }]}>スキャン</ThemedText>
          </View>
          <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse')}>
            <Ionicons name="refresh-circle-outline" size={26} color="#555" />
            <ThemedText style={styles.tabLabelBottom}>リユース</ThemedText>
          </Pressable>
          <Pressable style={styles.tabItemBottom} onPress={() => router.push('/mypage')}>
            <Ionicons name="person" size={22} color="#555" />
            <ThemedText style={styles.tabLabelBottom}>マイページ</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F8F9FA' },
  gradientBackground: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 120 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 4, marginRight: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  headerText: { fontSize: 18, fontWeight: 'bold', marginLeft: 6, color: '#000' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  introRow: { flexDirection: 'row', alignItems: 'center' },
  introImage: { width: 65, height: 65, borderRadius: 12, marginRight: 14 },
  introTextContainer: { flex: 1 },
  introTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  introDescription: { fontSize: 13, color: '#666', lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  sectionTitleCenter: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12, textAlign: 'center' },
  scanActionRow: { alignItems: 'center', paddingVertical: 10 },
  scanInstruction: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },
  bigScanButton: { backgroundColor: '#76C800', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, shadowColor: '#76C800', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  bigScanButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 30, paddingLeft: 14, height: 46 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#000', height: '100%' },
  searchButton: { backgroundColor: '#76C800', height: '100%', paddingHorizontal: 18, justifyContent: 'center', borderTopRightRadius: 30, borderBottomRightRadius: 30 },
  searchButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  notFoundContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, backgroundColor: '#FFF5F5', padding: 12, borderRadius: 12 },
  notFoundText: { fontSize: 13, color: '#EF4444', marginLeft: 8, fontWeight: '500' },
  resultContainer: { paddingVertical: 4 },
  resultHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  resultMainTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 6 },
  resultInfoBox: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E9ECEF' },
  resultLabel: { fontSize: 11, color: '#868E96', fontWeight: 'bold', marginBottom: 2 },
  resultValueText: { fontSize: 15, color: '#212529', fontWeight: 'bold', marginBottom: 10 },
  resultValueTextBadge: { fontSize: 14, color: '#76C800', fontWeight: 'bold', marginBottom: 10 },
  resultInstructionText: { fontSize: 13, color: '#495057', lineHeight: 18 },
  resultDivider: { height: 1, backgroundColor: '#E9ECEF', marginVertical: 8 },
  rescanButton: { backgroundColor: '#495057', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20, marginTop: 12 },
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
  tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
  scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
  tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
  tabItemBottom: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
  tabLabelBottom: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
  scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 2 },
  scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' }
});
