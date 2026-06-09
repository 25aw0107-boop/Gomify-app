import { ThemedText } from '@/components/themed-text';
import { FontAwesome5, Ionicons, Octicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';


interface ScanResult {
  itemName: string;
  category: string;
  day: string;
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
        Alert.alert(
          "カメラへのアクセス許可が必要です", 
          "ゴミをスキャンするには、設定からカメラの使用を許可してください。"
        );
        return;
      }
    }

    setSearchResult(null);
    setIsScannerOpen(true);
  };

  const handleCaptureAndAnalyze = async () => {
    if (cameraRef.current && !isScanning) {
      try {
        setIsScanning(true);
        
        const options = { quality: 0.5, skipProcessing: true };
        const photo = await cameraRef.current.takePictureAsync(options);
        console.log('Bild fångad för analys:', photo.uri);

  
        setTimeout(() => {
          setIsScanning(false);
          setIsScannerOpen(false);
          
          setScanResult({
            itemName: "ペットボトル",
            category: "資源ゴミ",
            day: "毎週水曜日",
            instructions: "中を軽くすすぎ、ラベルとキャップを外して資源ゴミの回収箱に出してください。"
          });
        }, 2000);

      } catch (error) {
        console.error("スキャンに失敗しました:", error);
        setIsScanning(false);
        Alert.alert("エラー", "スキャン中に問題が発生しました。");
      }
    }
  };


  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setScanResult(null);

    const query = searchQuery.toLowerCase().trim();


    if (query === '財布' || query === 'wallet' || query === 'plånbok') {
      setSearchResult({
        itemName: "財布（革・布製）",
        category: "燃やすゴミ",
        day: "毎週火曜日・金曜日",
        instructions: "金属の留め具やチャックなどのパーツを取り外せる場合は、できるだけ分解して「小さな金属類」に出してください。本体は燃やすゴミとして処分できます。"
      });
    } else if (query === 'ペットボトル' || query === 'flaska') {
      setSearchResult({
        itemName: "ペットボトル",
        category: "資源ゴミ",
        day: "毎週水曜日",
        instructions: "中を軽くすすぎ、ラベルとキャップを外して資源ゴミの回収箱に出してください。"
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

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* HEADERN */}
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={() => router.push('/dashboard')}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </Pressable>
          
          <View style={styles.headerRow}>
            <View style={styles.headerItem}>
              <Ionicons name="scan-outline" size={24} color="#000" />
              <ThemedText style={styles.headerText}>スキャン</ThemedText>
            </View>
            <View style={styles.headerItem}>
              <Ionicons name="search-outline" size={24} color="#000" />
              <ThemedText style={styles.headerText}>検索</ThemedText>
            </View>
          </View>
        </View>

    
        <View style={styles.card}>
          <View style={styles.introRow}>
            <Image 
              source={require('@/assets/images/korehagomi.png')} 
              style={styles.introImage}
            />
            <View style={styles.introTextContainer}>
              <ThemedText style={styles.introTitle}>これは何ゴミ？</ThemedText>
              <ThemedText style={styles.introDescription}>
                Gomifyですぐ解決。{"\n"}
                スキャンまたは検索で、{"\n"}
                正しい分別方法を確認できます。
              </ThemedText>
            </View>
          </View>
        </View>

    
        <View style={styles.card}>
          {!scanResult ? (
            <>
              <ThemedText style={styles.sectionTitle}>スキャンして調べる</ThemedText>
              
              <View style={styles.scanActionRow}>
                <ThemedText style={styles.scanInstruction}>
                  カメラでアイテムを読み取ると、ゴミの種類や捨て方をすぐに確認できます
                </ThemedText>
                
                <Pressable style={styles.bigScanButton} onPress={startScanner}>
                  <Ionicons name="camera-outline" size={32} color="#fff" />
                  <ThemedText style={styles.bigScanButtonText}>スキャン開始</ThemedText>
                </Pressable>
              </View>

              <View style={styles.stepContainer}>
                <View style={styles.stepItem}>
                  <View style={styles.stepIconCircle}>
                    <Ionicons name="camera" size={16} color="#000" />
                  </View>
                  <ThemedText style={styles.stepText}>写真を撮る</ThemedText>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#76C800" style={styles.stepArrow} />
                <View style={styles.stepItem}>
                  <View style={styles.stepIconCircle}>
                    <Ionicons name="search" size={16} color="#000" />
                  </View>
                  <ThemedText style={styles.stepText}>AIが{"\n"}アイテムを判別</ThemedText>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#76C800" style={styles.stepArrow} />
                <View style={styles.stepItem}>
                  <View style={styles.stepIconCircle}>
                    <Ionicons name="checkmark-circle" size={16} color="#000" />
                  </View>
                  <ThemedText style={styles.stepText}>分別方法を{"\n"}確認</ThemedText>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeaderRow}>
                <Ionicons name="checkmark-circle" size={24} color="#76C800" />
                <ThemedText style={styles.resultMainTitle}>スキャン結果</ThemedText>
              </View>

              <View style={styles.resultInfoBox}>
                <ThemedText style={styles.resultLabel}>品目</ThemedText>
                <ThemedText style={styles.resultValueText}>{scanResult.itemName}</ThemedText>
                
                <View style={styles.resultDivider} />

                <ThemedText style={styles.resultLabel}>分別カテゴリー</ThemedText>
                <ThemedText style={styles.resultValueTextBadge}>{scanResult.category}</ThemedText>
                
                <View style={styles.resultDivider} />

                <ThemedText style={styles.resultLabel}>収集日</ThemedText>
                <ThemedText style={styles.resultDayText}>{scanResult.day}</ThemedText>

                <View style={styles.resultDivider} />

                <ThemedText style={styles.resultLabel}>正しい捨て方</ThemedText>
                <ThemedText style={styles.resultInstructionText}>{scanResult.instructions}</ThemedText>
              </View>

              <Pressable style={styles.rescanButton} onPress={startScanner}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <ThemedText style={styles.rescanButtonText}>もう一度スキャンする</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

   
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitleCenter}>検索して調べる</ThemedText>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="何ゴミか検索（例：財布、ペットボトル）" 
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
                <ThemedText style={styles.resultLabel}>品目</ThemedText>
                <ThemedText style={styles.resultValueText}>{searchResult.itemName}</ThemedText>
                
                <View style={styles.resultDivider} />

                <ThemedText style={styles.resultLabel}>分別カテゴリー</ThemedText>
                <ThemedText style={styles.resultValueTextBadge}>{searchResult.category}</ThemedText>
                
                <View style={styles.resultDivider} />

                <ThemedText style={styles.resultLabel}>収集日</ThemedText>
                <ThemedText style={styles.resultDayText}>{searchResult.day}</ThemedText>

                <View style={styles.resultDivider} />

                <ThemedText style={styles.resultLabel}>正しい捨て方</ThemedText>
                <ThemedText style={styles.resultInstructionText}>{searchResult.instructions}</ThemedText>
              </View>
            </View>
          )}

   
          {searchResult === 'NOT_FOUND' && (
            <View style={styles.notFoundContainer}>
              <Ionicons name="alert-circle-outline" size={28} color="#D9383A" />
              <ThemedText style={styles.notFoundText}>見つかりませんでした</ThemedText>
              <ThemedText style={styles.notFoundSubText}>キーワードを変えてもう一度お試しください。</ThemedText>
            </View>
          )}
        </View>

      </ScrollView>

      <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <CameraView style={StyleSheet.absoluteFillObject} ref={cameraRef}>
            <View style={styles.overlayContainer}>
              <Pressable style={styles.closeButton} onPress={() => setIsScannerOpen(false)}>
                <Ionicons name="close-circle" size={44} color="#FFF" />
              </Pressable>

              <ThemedText style={styles.scannerInstructionText}>枠内にゴミを写してください</ThemedText>

              <View style={styles.scannerTargetBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                {isScanning && (
                  <View style={styles.spinnerOverlay}>
                    <ActivityIndicator size="large" color="#76C800" />
                    <ThemedText style={styles.spinnerText}>AIが分析中...</ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.actionButtonContainer}>
                <Pressable 
                  style={[styles.captureActionButton, isScanning && styles.disabledCaptureButton]} 
                  onPress={handleCaptureAndAnalyze}
                  disabled={isScanning}
                >
                  <View style={styles.innerCaptureCircle} />
                </Pressable>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

  
      <View style={styles.tabBarContainer}>
        <View style={styles.scanBackgroundCircle} />
        <View style={styles.tabBarBackground} />
        
        <View style={styles.tabBarContent}>
          <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
            <Octicons name="home" size={24} color="#555" />
            <ThemedText style={styles.tabLabel}>ホーム</ThemedText>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={() => router.push('/calender')}>
            <FontAwesome5 name="calendar-alt" size={22} color="#555" />
            <ThemedText style={styles.tabLabel}>ゴミカレンダー</ThemedText>
          </Pressable>

          <View style={styles.scanWrapper}>
            <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
              <Ionicons name="scan-outline" size={26} color="#5B9E00" />
            </Pressable>
            <ThemedText style={[styles.scanLabel, styles.tabLabelActive]}>ゴミスキャン</ThemedText>
          </View>

          <Pressable style={styles.tabItem} onPress={() => router.push('/modal')}>
            <Ionicons name="refresh-circle-outline" size={26} color="#555" />
            <ThemedText style={styles.tabLabel}>リユース</ThemedText>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={() => router.push('/mypage')}>
            <Ionicons name="person" size={22} color="#555" />
            <ThemedText style={styles.tabLabel}>マイページ</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  gradientBackground: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  headerContainer: { paddingTop: 54, height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingHorizontal: 24, marginBottom: 24 },
  backButton: { position: 'absolute', left: 16, top: 46, padding: 10, zIndex: 10 },
  headerRow: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  headerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, marginHorizontal: 24, marginBottom: 24, padding: 18, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.20, shadowRadius: 6, elevation: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  introImage: { width: 110, height: 110, resizeMode: 'contain' },
  introTextContainer: { flex: 1 },
  introTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  introDescription: { fontSize: 14, margin:7, color: '#333', lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  sectionTitleCenter: { fontSize: 18, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 16 },
  scanActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  scanInstruction: { maxWidth: '60%', fontSize: 13, color: '#333', lineHeight: 18, flex: 2 },
  bigScanButton: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#76C800', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5, elevation:5, marginRight: 15, marginTop: -20 },
  bigScanButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  stepContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  stepItem: { alignItems: 'center', width: 85 },
  stepIconCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#76C800', justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: '#FFF' },
  stepText: { fontSize: 12, color: '#333', textAlign: 'center', lineHeight: 13, height: 26 },
  stepArrow: { marginBottom: 34, color: '#333', marginHorizontal: 2 },
  

  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#EFEFEF', height: 48, paddingLeft: 12, overflow: 'hidden' },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: '#000' },
  searchButton: { backgroundColor: '#76C800', height: '100%', paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  searchButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  

  notFoundContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 10, gap: 4 },
  notFoundText: { fontSize: 16, fontWeight: 'bold', color: '#D9383A' },
  notFoundSubText: { fontSize: 12, color: '#666', textAlign: 'center' },

  tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end', zIndex: 100 },
  tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
  scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
  tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
  tabLabel: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  tabLabelActive: { color: '#5B9E00', fontWeight: 'bold' },
  scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
  scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 2 },
  scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#000' },
  overlayContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 50 },
  closeButton: { position: 'absolute', top: 50, right: 25, zIndex: 20 },
  scannerInstructionText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 80 },
  scannerTargetBox: { width: 260, height: 260, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#76C800' },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 10 },
  spinnerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  spinnerText: { color: '#FFF', marginTop: 10, fontWeight: 'bold' },
  actionButtonContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  captureActionButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  disabledCaptureButton: { borderColor: '#999' },
  innerCaptureCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF' },

  resultContainer: { paddingVertical: 4 },
  resultHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  resultMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  resultInfoBox: { backgroundColor: '#F9FBF7', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E6EFE0', marginBottom: 18 },
  resultLabel: { fontSize: 11, color: '#666', fontWeight: '600', marginBottom: 2 },
  resultValueText: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  resultValueTextBadge: { fontSize: 14, fontWeight: 'bold', color: '#5B9E00', marginBottom: 8 },
  resultDayText: { fontSize: 15, fontWeight: 'bold', color: '#E06A00', marginBottom: 8 },
  resultInstructionText: { fontSize: 13, color: '#333', lineHeight: 18 },
  resultDivider: { height: 1, backgroundColor: '#ECECEC', marginVertical: 6 },
  rescanButton: { backgroundColor: '#76C800', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 22, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  rescanButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});