// import { ThemedText } from '@/components/themed-text';
// import { FontAwesome5, Ionicons, Octicons } from '@expo/vector-icons';
// import { CameraView, useCameraPermissions } from 'expo-camera';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Tabs, useRouter } from 'expo-router';
// import { useRef, useState } from 'react';
// import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
// // ဗဟို Database ကို ချိတ်ဆက်ခြင်း
// import { TOKYO_GARBAGE_DATABASE } from '@/constants/garbageData';

// interface ScanResult {
//   itemName: string;
//   category: string;
//   day: string;
//   instructions: string;
// }

// export default function ScanScreen() {
//   const router = useRouter();
//   const cameraRef = useRef<any>(null);

//   const [permission, requestPermission] = useCameraPermissions();
//   const [isScannerOpen, setIsScannerOpen] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);

//   const [scanResult, setScanResult] = useState<ScanResult | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResult, setSearchResult] = useState<ScanResult | null | 'NOT_FOUND'>(null);

//   // Shinjuku ရဲ့ အမှိုက်စည်းကမ်းများကို ယူသုံးခြင်း
//   const userWardRules = TOKYO_GARBAGE_DATABASE.find(w => w.ward_id === "TYO-01")?.garbage_rules || [];

//   const startScanner = async () => {
//     if (!permission || !permission.granted) {
//       const status = await requestPermission();
//       if (!status.granted) {
//         Alert.alert(
//           "ካሜရာ መድረሻ ፈቃድ ያስፈልጋል", 
//           "ゴミをスキャンするには、設定からカメラの使用を許可してください。"
//         );
//         return;
//       }
//     }
//     setSearchResult(null);
//     setIsScannerOpen(true);
//   };

//   const handleCaptureAndAnalyze = async () => {
//     if (cameraRef.current && !isScanning) {
//       try {
//         setIsScanning(true);
//         const options = { quality: 0.5, skipProcessing: true };
//         const photo = await cameraRef.current.takePictureAsync(options);
//         console.log('Fångad för analys:', photo?.uri);

//         setTimeout(() => {
//           setIsScanning(false);
//           setIsScannerOpen(false);
          
//           // Database ထဲမှ ပလတ်စတစ်ရေသန့်ပုလင်း (item_001) ကို ရှာပြီး ပြပေးခြင်း
//           const petBottle = userWardRules.find(r => r.item_id === "item_001");
//           if (petBottle) {
//             setScanResult({
//               itemName: petBottle.name_mm + ` (${petBottle.name_jp})`,
//               category: petBottle.category_mm,
//               day: petBottle.day_info_mm + "နေ့ (" + petBottle.day_info_jp + ")",
//               instructions: petBottle.instructions_mm
//             });
//           }
//         }, 2000);
//       } catch (error) {
//         console.error("スキャンに失敗しました:", error);
//         setIsScanning(false);
//         Alert.alert("エラー", "スキャン中に問題が発生しました。");
//       }
//     }
//   };

//   const handleSearch = () => {
//     if (!searchQuery.trim()) return;
//     setScanResult(null);
//     const query = searchQuery.toLowerCase().trim();

//     // Database ထဲမှာ အသုံးပြုသူ ရိုက်ရှာတဲ့စာလုံး ပါဝင်မှု ရှိ/မရှိ ရှာဖွေခြင်း
//     const foundItem = userWardRules.find(rule => 
//       rule.name_mm.toLowerCase().includes(query) || 
//       rule.name_jp.toLowerCase().includes(query) || 
//       rule.name_en.toLowerCase().includes(query)
//     );

//     if (foundItem) {
//       setSearchResult({
//         itemName: foundItem.name_mm + ` (${foundItem.name_jp})`,
//         category: foundItem.category_mm,
//         day: foundItem.day_info_mm + "နေ့ (" + foundItem.day_info_jp + ")",
//         instructions: foundItem.instructions_mm
//       });
//     } else {
//       setSearchResult('NOT_FOUND');
//     }
//   };

//   return (
//     <View style={styles.mainWrapper}>
//       <Tabs.Screen options={{ headerShown: false }} />

//       <LinearGradient
//         colors={['#DCE8D3', '#FFFFFF']}
//         style={styles.gradientBackground}
//         start={{ x: 0.5, y: 0 }}
//         end={{ x: 0.5, y: 0.42 }}
//       />

//       <ScrollView 
//         style={styles.scrollContainer}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* HEADER */}
//         <View style={styles.headerContainer}>
//           <Pressable style={styles.backButton} onPress={() => router.push('/dashboard')}>
//             <Ionicons name="chevron-back" size={28} color="#000" />
//           </Pressable>
//           <View style={styles.headerRow}>
//             <View style={styles.headerItem}>
//               <Ionicons name="scan-outline" size={24} color="#000" />
//               <ThemedText style={styles.headerText}>စကင်ဖတ်ရန်</ThemedText>
//             </View>
//           </View>
//         </View>

//         {/* INTRO CARD */}
//         <View style={styles.card}>
//           <View style={styles.introRow}>
//             <Image 
//               source={require('@/assets/images/korehagomi.png')} 
//               style={styles.introImage}
//             />
//             <View style={styles.introTextContainer}>
//               <ThemedText style={styles.introTitle}>ဒါက ဘာအမှိုက်လဲ?</ThemedText>
//               <ThemedText style={styles.introDescription}>
//                 Gomify ဖြင့် အလွယ်တကူ စစ်ဆေးပါ။{"\n"}
//                 မှန်ကန်စွာ စွန့်ပစ်နိုင်မည့် နည်းလမ်းကို{"\n"}
//                 ချက်ချင်း သိရှိနိုင်ပါသည်။
//               </ThemedText>
//             </View>
//           </View>
//         </View>

//         {/* SCAN SECTION */}
//         <View style={styles.card}>
//           {!scanResult ? (
//             <>
//               <ThemedText style={styles.sectionTitle}>ဓာတ်ပုံရိုက်ပြီး စစ်ဆေးရန်</ThemedText>
//               <View style={styles.scanActionRow}>
//                 <ThemedText style={styles.scanInstruction}>
//                   အမှိုက် သို့မဟုတ် ပစ္စည်းကို ကင်မရာဖြင့် ဓာတ်ပုံရိုက်ရုံဖြင့် ၎င်း၏အမျိုးအစားနှင့် ပစ်ရမည့်နေ့ကို စစ်ဆေးနိုင်ပါသည်။
//                 </ThemedText>
//                 <Pressable style={styles.bigScanButton} onPress={startScanner}>
//                   <Ionicons name="camera-outline" size={32} color="#fff" />
//                   <ThemedText style={styles.bigScanButtonText}>စကင်ဖတ်မည်</ThemedText>
//                 </Pressable>
//               </View>
//             </>
//           ) : (
//             <View style={styles.resultContainer}>
//               <View style={styles.resultHeaderRow}>
//                 <Ionicons name="checkmark-circle" size={24} color="#76C800" />
//                 <ThemedText style={styles.resultMainTitle}>စကင်ဖတ်မှု ရလဒ်</ThemedText>
//               </View>

//               <View style={styles.resultInfoBox}>
//                 <ThemedText style={styles.resultLabel}>ပစ္စည်းအမည်</ThemedText>
//                 <ThemedText style={styles.resultValueText}>{scanResult.itemName}</ThemedText>
//                 <View style={styles.resultDivider} />
//                 <ThemedText style={styles.resultLabel}>အမှိုက်အမျိုးအစား</ThemedText>
//                 <ThemedText style={styles.resultValueTextBadge}>{scanResult.category}</ThemedText>
//                 <View style={styles.resultDivider} />
//                 <ThemedText style={styles.resultLabel}>အမှိုက်သိမ်းသည့်နေ့</ThemedText>
//                 <ThemedText style={styles.resultDayText}>{scanResult.day}</ThemedText>
//                 <View style={styles.resultDivider} />
//                 <ThemedText style={styles.resultLabel}>စွန့်ပစ်ရန် လမ်းညွှန်ချက်</ThemedText>
//                 <ThemedText style={styles.resultInstructionText}>{scanResult.instructions}</ThemedText>
//               </View>

//               <Pressable style={styles.rescanButton} onPress={startScanner}>
//                 <Ionicons name="refresh" size={18} color="#fff" />
//                 <ThemedText style={styles.rescanButtonText}>ထပ်မံ စကင်ဖတ်မည်</ThemedText>
//               </Pressable>
//             </View>
//           )}
//         </View>

//         {/* SEARCH SECTION */}
//         <View style={styles.card}>
//           <ThemedText style={styles.sectionTitleCenter}>ရှာဖွေပြီး စစ်ဆေးရန်</ThemedText>
//           <View style={styles.searchBarContainer}>
//             <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
//             <TextInput 
//               style={styles.searchInput} 
//               placeholder="အမှိုက်အမည်ဖြင့် ရှာဖွေပါ (ဥပမာ- ရေသန့်ပုလင်း)" 
//               placeholderTextColor="#999"
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//               onSubmitEditing={handleSearch}
//             />
//             <Pressable style={styles.searchButton} onPress={handleSearch}>
//               <ThemedText style={styles.searchButtonText}>ရှာမည်</ThemedText>
//             </Pressable>
//           </View>

//           {searchResult && searchResult !== 'NOT_FOUND' && (
//             <View style={[styles.resultContainer, { marginTop: 20 }]}>
//               <View style={styles.resultHeaderRow}>
//                 <Ionicons name="search" size={22} color="#76C800" />
//                 <ThemedText style={styles.resultMainTitle}>ရှာဖွေမှု ရလဒ်</ThemedText>
//               </View>
//               <View style={styles.resultInfoBox}>
//                 <ThemedText style={styles.resultLabel}>ပစ္စည်းအမည်</ThemedText>
//                 <ThemedText style={styles.resultValueText}>{searchResult.itemName}</ThemedText>
//                 <View style={styles.resultDivider} />
//                 <ThemedText style={styles.resultLabel}>အမှိုက်အမျိုးအစား</ThemedText>
//                 <ThemedText style={styles.resultValueTextBadge}>{searchResult.category}</ThemedText>
//                 <View style={styles.resultDivider} />
//                 <ThemedText style={styles.resultLabel}>အမှိုက်သိမ်းသည့်နေ့</ThemedText>
//                 <ThemedText style={styles.resultDayText}>{searchResult.day}</ThemedText>
//                 <View style={styles.resultDivider} />
//                 <ThemedText style={styles.resultLabel}>စွန့်ပစ်ရန် လမ်းညွှန်ချက်</ThemedText>
//                 <ThemedText style={styles.resultInstructionText}>{searchResult.instructions}</ThemedText>
//               </View>
//             </View>
//           )}

//           {searchResult === 'NOT_FOUND' && (
//             <View style={styles.notFoundContainer}>
//               <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
//               <ThemedText style={styles.notFoundText}>ရှာဖွေမှုမတွေ့ရှိပါ။ အခြားစာလုံးဖြင့် ထပ်မံကြိုးစားကြည့်ပါ။</ThemedText>
//             </View>
//           )}
//         </View>
//       </ScrollView>

//       {/* CAMERA SCANNER MODAL */}
//       <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
//         <View style={styles.cameraContainer}>
//           <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject}>
//             <SafeAreaView style={styles.cameraSafeArea}>
//               <View style={styles.cameraHeader}>
//                 <Pressable style={styles.closeCameraButton} onPress={() => setIsScannerOpen(false)}>
//                   <Ionicons name="close" size={28} color="#FFF" />
//                 </Pressable>
//                 <ThemedText style={styles.cameraTitle}>အမှိုက်ကို စကင်ဖတ်ပါ</ThemedText>
//                 <View style={{ width: 40 }} />
//               </View>

//               <View style={styles.scannerTargetArea}>
//                 <View style={[styles.targetCorner, styles.topLeftCorner]} />
//                 <View style={[styles.targetCorner, styles.topRightCorner]} />
//                 <View style={[styles.targetCorner, styles.bottomLeftCorner]} />
//                 <View style={[styles.targetCorner, styles.bottomRightCorner]} />
//               </View>

//               <View style={styles.cameraFooter}>
//                 <Pressable 
//                   style={[styles.captureButton, isScanning && styles.disabledCaptureButton]} 
//                   onPress={handleCaptureAndAnalyze}
//                   disabled={isScanning}
//                 >
//                   {isScanning ? (
//                     <ActivityIndicator size="large" color="#76C800" />
//                   ) : (
//                     <View style={styles.innerCaptureCircle} />
//                   )}
//                 </Pressable>
//               </View>
//             </SafeAreaView>
//           </CameraView>
//         </View>
//       </Modal>

//       {/* FOOTER TAB BAR */}
//       <View style={styles.tabBarContainer}>
//         <View style={styles.scanBackgroundCircle} />
//         <View style={styles.tabBarBackground} />
//         <View style={styles.tabBarContent}>
//           <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}>
//             <Octicons name="home" size={24} color="#555" />
//             <ThemedText style={styles.tabLabelBottom}>ပင်မစာမျက်နှာ</ThemedText>
//           </Pressable>
//           <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}>
//             <FontAwesome5 name="calendar-alt" size={22} color="#555" />
//             <ThemedText style={styles.tabLabelBottom}>ပြက္ခဒိန်</ThemedText>
//           </Pressable>
//           <View style={styles.scanWrapper}>
//             <Pressable style={styles.scanButton}>
//               <Ionicons name="scan-outline" size={26} color="#5B9E00" />
//             </Pressable>
//             <ThemedText style={[styles.scanLabel, { color: '#5B9E00', fontWeight: 'bold' }]}>စကင်ဖတ်ရန်</ThemedText>
//           </View>
//           <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse')}>
//             <Ionicons name="refresh-circle-outline" size={26} color="#555" />
//             <ThemedText style={styles.tabLabelBottom}>ပြန်သုံးရန်</ThemedText>
//           </Pressable>
//           <Pressable style={styles.tabItemBottom} onPress={() => router.push('/mypage')}>
//             <Ionicons name="person" size={22} color="#555" />
//             <ThemedText style={styles.tabLabelBottom}>အကောင့်</ThemedText>
//           </Pressable>
//         </View>
//       </View>
//     </View>
//   );
// }

// import { SafeAreaView } from 'react-native-safe-area-context';

// const styles = StyleSheet.create({
//   mainWrapper: { flex: 1, backgroundColor: '#F8F9FA' },
//   gradientBackground: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
//   scrollContainer: { flex: 1 },
//   scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 120 },
//   headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
//   backButton: { padding: 4, marginRight: 10 },
//   headerRow: { flexDirection: 'row', alignItems: 'center' },
//   headerItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
//   headerText: { fontSize: 18, fontWeight: 'bold', marginLeft: 6, color: '#000' },
//   card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
//   introRow: { flexDirection: 'row', alignItems: 'center' },
//   introImage: { width: 65, height: 65, borderRadius: 12, marginRight: 14 },
//   introTextContainer: { flex: 1 },
//   introTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
//   introDescription: { fontSize: 13, color: '#666', lineHeight: 18 },
//   sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
//   sectionTitleCenter: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12, textAlign: 'center' },
//   scanActionRow: { alignItems: 'center', paddingVertical: 10 },
//   scanInstruction: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },
//   bigScanButton: { backgroundColor: '#76C800', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, shadowColor: '#76C800', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
//   bigScanButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
//   searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 30, paddingLeft: 14, height: 46 },
//   searchIcon: { marginRight: 8 },
//   searchInput: { flex: 1, fontSize: 14, color: '#000', height: '100%' },
//   searchButton: { backgroundColor: '#76C800', height: '100%', paddingHorizontal: 18, justifyContent: 'center', borderTopRightRadius: 30, borderBottomRightRadius: 30 },
//   searchButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
//   notFoundContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, backgroundColor: '#FFF5F5', padding: 12, borderRadius: 12 },
//   notFoundText: { fontSize: 13, color: '#EF4444', marginLeft: 8, fontWeight: '500' },
//   resultContainer: { paddingVertical: 4 },
//   resultHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
//   resultMainTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 6 },
//   resultInfoBox: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E9ECEF' },
//   resultLabel: { fontSize: 11, color: '#868E96', fontWeight: 'bold', marginBottom: 2 },
//   resultValueText: { fontSize: 15, color: '#212529', fontWeight: 'bold', marginBottom: 10 },
//   resultValueTextBadge: { fontSize: 14, color: '#76C800', fontWeight: 'bold', marginBottom: 10 },
//   resultDayText: { fontSize: 14, color: '#FD7E14', fontWeight: 'bold', marginBottom: 10 },
//   resultInstructionText: { fontSize: 13, color: '#495057', lineHeight: 18 },
//   resultDivider: { height: 1, backgroundColor: '#E9ECEF', marginVertical: 8 },
//   rescanButton: { backgroundColor: '#495057', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20, marginTop: 12 },
//   rescanButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
//   cameraContainer: { flex: 1, backgroundColor: '#000' },
//   cameraSafeArea: { flex: 1, justifyContent: 'space-between' },
//   cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
//   closeCameraButton: { padding: 4 },
//   cameraTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
//   scannerTargetArea: { width: 250, height: 250, alignSelf: 'center', position: 'relative' },
//   targetCorner: { position: 'absolute', width: 20, height: 20, borderColor: '#76C800' },
//   topLeftCorner: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
//   topRightCorner: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
//   bottomLeftCorner: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
//   bottomRightCorner: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
//   cameraFooter: { alignItems: 'center', paddingBottom: 30 },
//   captureButton: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
//   disabledCaptureButton: { borderColor: '#999' },
//   innerCaptureCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFF' },
//   tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end' },
//   tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
//   scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
//   tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
//   tabItemBottom: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
//   tabLabelBottom: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
//   scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
//   scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 2 },
//   scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' }
// });

// app/scan.tsx
import { ThemedText } from '@/components/themed-text';
import { TOKYO_GARBAGE_DATABASE } from '@/constants/garbageData';
import { FontAwesome5, Ionicons, Octicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const userWardRules = TOKYO_GARBAGE_DATABASE.find(w => w.ward_id === "TYO-01")?.garbage_rules || [];

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

  const handleCaptureAndAnalyze = async () => {
    if (cameraRef.current && !isScanning) {
      try {
        setIsScanning(true);
        const options = { quality: 0.5, skipProcessing: true };
        const photo = await cameraRef.current.takePictureAsync(options);

        setTimeout(() => {
          setIsScanning(false);
          setIsScannerOpen(false);
          
          const petBottle = userWardRules.find(r => r.item_id === "item_001");
          if (petBottle) {
            setScanResult({
              itemName: petBottle.name_jp,
              category: petBottle.category_jp,
              day: `${petBottle.day_info_jp}曜日`,
              instructions: petBottle.instructions_jp
            });
          }
        }, 2000);
      } catch (error) {
        setIsScanning(false);
        Alert.alert("エラー", "スキャン中に問題が発生しました。");
      }
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setScanResult(null);
    const query = searchQuery.toLowerCase().trim();

    const foundItem = userWardRules.find(rule => 
      rule.name_jp.toLowerCase().includes(query)
    );

    if (foundItem) {
      setSearchResult({
        itemName: foundItem.name_jp,
        category: foundItem.category_jp,
        day: `${foundItem.day_info_jp}曜日`,
        instructions: foundItem.instructions_jp
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

        <View style={styles.card}>
          <View style={styles.introRow}>
            <Image source={require('@/assets/images/korehagomi.png')} style={styles.introImage} />
            <View style={styles.introTextContainer}>
              <ThemedText style={styles.introTitle}>これは何のゴミ？</ThemedText>
              <ThemedText style={styles.introDescription}>
                Gomifyを使って簡単に調べましょう。{"\n"}
                正しい分別方法と収集日が{"\n"}
                すぐに分かります。
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          {!scanResult ? (
            <>
              <ThemedText style={styles.sectionTitle}>カメラでスキャンする</ThemedText>
              <View style={styles.scanActionRow}>
                <ThemedText style={styles.scanInstruction}>
                  捨てるものをカメラで撮影するだけで、自動的にゴミの分別種類と収集日を調べることができます。
                </ThemedText>
                <Pressable style={styles.bigScanButton} onPress={startScanner}>
                  <Ionicons name="camera-outline" size={32} color="#fff" />
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
                <ThemedText style={styles.resultLabel}>収集日</ThemedText>
                <ThemedText style={styles.resultDayText}>{scanResult.day}</ThemedText>
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
                <ThemedText style={styles.resultLabel}>収集日</ThemedText>
                <ThemedText style={styles.resultDayText}>{searchResult.day}</ThemedText>
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
  resultDayText: { fontSize: 14, color: '#FD7E14', fontWeight: 'bold', marginBottom: 10 },
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