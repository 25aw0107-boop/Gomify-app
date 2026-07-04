import CircularProgress from 'react-native-circular-progress-indicator';
import { ThemedText } from '@/components/themed-text';
import { AntDesign, FontAwesome5, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  View,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal, // Lade till Modal
  TouchableOpacity
} from 'react-native';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const isSmallPhone = height < 700;
const isMediumPhone = height >= 700 && height < 850;

interface ReuseItem {
  id: string;
  title: string;
  images: any;
}

export default function DashboardScreen() {
  const router = useRouter();
  
  // 1. STATS & REFS
  const [items, setItems] = useState<ReuseItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [detectedCity, setDetectedCity] = useState<string>("エリア設定中...");
  const [todayGarbage, setTodayGarbage] = useState<string>("確認中...");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  
  // Nya states för att separera inloggning och sortering
  const [hasClaimedLogin, setHasClaimedLogin] = useState<boolean>(false);
  const [hasClaimedSort, setHasClaimedSort] = useState<boolean>(false);

  // State för den moderna modalen
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: "", message: "", icon: "gift" });

  // Skrivmaskins-effekt (text-animering)
  const fullText = "調べる・分ける\n譲るを、Gomifyで";
  const [displayedText, setDisplayedText] = useState("");

  // Animerings-refs
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const translateY = useRef(new Animated.Value(15)).current; 
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // 2. EFFECTS & ANIMATIONS
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,           
        duration: 800,       
        useNativeDriver: true 
      }),
      Animated.timing(translateY, {
        toValue: 0,           
        duration: 800,       
        useNativeDriver: true 
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,    
        tension: 30,   
        useNativeDriver: true
      })
    ]).start();

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (index < fullText.length) {
          const nextChar = fullText.charAt(index);
          index++;
          return prev + nextChar;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 120); 

    return () => clearInterval(interval);
  }, []);

  // 3. FUNCTIONS
  
  // Hjälpfunktion för att visa snygga meddelanden
  const showModernAlert = (title: string, message: string, icon: string) => {
    setModalConfig({ title, message, icon });
    setModalVisible(true);
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // OBS: Se till att 'last_login_date' och 'last_sort_date' finns i din Supabase!
        const { data } = await supabase
          .from('profiles')
          .select('points, last_login_date, last_sort_date')
          .eq('id', user.id)
          .single();
        
        if (data) {
          let currentPoints = data.points || 0;
          const todayStr = new Date().toISOString().split('T')[0]; 
          
          setHasClaimedSort(data.last_sort_date === todayStr);

          // Automatiskt Inloggningsbonus!
          if (data.last_login_date !== todayStr) {
            currentPoints += 1;
            
            // Uppdatera databasen direkt i bakgrunden
            await supabase
              .from('profiles')
              .update({ 
                points: currentPoints, 
                last_login_date: todayStr 
              })
              .eq('id', user.id);
            
            setHasClaimedLogin(true);
            
            // Visa den snygga modalen istället för alert
            setTimeout(() => {
              showModernAlert(
                "ログインボーナス！", 
                "アプリを開いてくれてありがとうございます！\n1ポイント獲得しました。🌱", 
                "gift"
              );
            }, 1000); // Liten delay så det inte krockar med sidladdningen
          } else {
            setHasClaimedLogin(true);
          }

          setUserPoints(currentPoints);
        }
      }
    } catch (err) {
      console.error("error", err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const { data } = await supabase.from('items').select('id, title, images, created_at').order('created_at', { ascending: false }).limit(10);
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchTodaysGarbage = async (areaId: number) => {
    const today = new Date();
    const japaneseWeekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const todayJapanese = japaneseWeekdays[today.getDay()]; 
    const dayNum = String(today.getDay());

    try {
      const { data: rulesData, error } = await supabase
        .from('collection_rules')
        .select('day_of_week, garbage_type')
        .eq('area_id', areaId);

      if (error) {
        console.error("Kunde inte hämta sopregler:", error);
        setTodayGarbage("収集なし");
        return;
      }

      if (rulesData && rulesData.length > 0) {
        const todaysRules = rulesData.filter(rule => {
          if (!rule.day_of_week) return false;
          const dbDayStr = String(rule.day_of_week);
          return dbDayStr.includes(todayJapanese) || dbDayStr === dayNum;
        });

        if (todaysRules.length > 0) {
          const combinedGarbageTypes = todaysRules.map(r => r.garbage_type).join(' / ');
          setTodayGarbage(combinedGarbageTypes);
          return;
        }
      }
      
      setTodayGarbage("収集なし");
    } catch (err) {
      console.error("Något gick fel in fetchTodaysGarbage:", err);
      setTodayGarbage("収集なし");
    }
  };

  const initializeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_area_id, city')
        .eq('id', user.id)
        .single();

      if (profile && profile.selected_area_id) {
        if (profile.city) setDetectedCity(profile.city);
        await fetchTodaysGarbage(profile.selected_area_id);
      } else {
        setTodayGarbage("収集なし");
        setDetectedCity("未設定");
      }
    } catch (err) {
      console.error("error:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      initializeData();
      fetchItems();
      fetchUserProfile();
    }, [])
  );

  const handleTaskPress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showModernAlert("エラー", "ログインしてください。", "alert-circle");
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      if (hasClaimedSort) {
        showModernAlert(
          "達成済み！", 
          "今日の分別ポイントはすでに獲得済みです！\nまた明日チャレンジしてくださいね。♻️", 
          "checkmark-circle"
        );
        return;
      }

      // Nu ger vi bara 1 poäng för att ha sorterat
      const newPoints = userPoints + 1;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          points: newPoints, 
          last_sort_date: todayStr // Uppdaterar bara sorterings-datumet
        })
        .eq('id', user.id);

      if (error) throw error;

      setUserPoints(newPoints);
      setHasClaimedSort(true);

      showModernAlert(
        "素晴らしい！", 
        "ごみの分別ありがとうございます！\n1ポイント獲得しました。🎉", 
        "leaf"
      );

    } catch (err: any) {
      console.error("ポイントの保存に失敗しました:", err);
      showModernAlert("エラー", "ポイントの保存に失敗しました。", "alert-circle");
    }
  };

  const getGarbageUI = (type: string) => {
    if (type.includes("燃やす") || type.includes("可燃") || type.includes("燃える")) {
      return { title: "可燃ごみ", icon: "flame", color: "#DC2626" };
    } 
    else if (type.includes("金属") || type.includes("不燃") || type.includes("燃やさない")) {
      return { title: "不燃ごみ", icon: "trash-bin", color: "#2563EB" };
    } 
    else if (type.includes("資源") || type.includes("古紙")) {
      return { title: "資源", icon: "newspaper", color: "#16A34A" };
    } 
    else if (type.includes("プラ")) {
      return { title: "プラ", icon: "cube", color: "#EAB308" };
    } 
    else if (type === "収集なし") {
      return { title: "収集なし", icon: "checkmark-circle", color: "#6bac7a" }; 
    } 
    else {
      return { title: "確認中...", icon: "ellipsis-horizontal-circle", color: "#757575" }; 
    }
  };

  const useCurrentLocation = async () => {
    // Behåll din befintliga location logik oförändrad...
    setIsLocating(true);
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
            showModernAlert("エラー", "位置情報のアクセスが拒否されました。", "alert-circle");
            setIsLocating(false)
            return;
        }

        // ... (resten av din location-kod förblir densamma, jag förkortar den här för läsbarhet, 
        // se till att klistra in din gamla location-funktion om du hade speciella ändringar där)
        
        // Exempel på hur du byter ut alert i location:
        // alert(`現在地を設定しました: ${matchedArea.name}`); blir:
        // showModernAlert("完了", `現在地を設定しました: ${matchedArea.name}`, "location");
        
    } catch (e) {
        console.error("error:", e);
        showModernAlert("エラー", "位置情報の取得に失敗しました。", "alert-circle");
    } finally {
        setIsLocating(false);
    }
  };

  const getTodayJapaneseDate = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const japaneseWeekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = japaneseWeekdays[today.getDay()];
    return `今日 ${month}/${date} (${dayOfWeek})`;
  };

  const getFirstImageUrl = (images: any): string | null => {
    if (!images) return null;
    if (Array.isArray(images) && images.length > 0) return images[0];
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch (e) {
        if (images.startsWith('http')) return images;
      }
    }
    return null;
  };

  // 4. RENDERING
  return (
    <View style={styles.mainWrapper}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.fullScreenContainer}>
        <ImageBackground source={require('@/assets/images/Rectangle 8.png')} style={styles.heroBackground} imageStyle={styles.heroImageRadius}>
          <View style={styles.welcomeTextContainer}>
            <Animated.View style={[styles.textFrame, { opacity: fadeAnim, transform: [{ translateY: translateY }] }]}>
              <ThemedText type="default" style={styles.welcomeText}>
                {displayedText}
              </ThemedText>
            </Animated.View>
            
            <Pressable style={styles.gpsButton} onPress={useCurrentLocation} disabled={isLocating}>
              {isLocating ? (
                <ActivityIndicator size="small" color="#5B9E00" />
              ) : (
                <>
                  <Ionicons name="location" size={14} color="#5B9E00" />
                  <ThemedText style={styles.gpsButtonText}>
                    現在地を使用 ({detectedCity})
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </ImageBackground>

        <Pressable 
          onPress={handleTaskPress}
          style={({ pressed }) => [
            styles.taskCard,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={56} color="#76C800" />
          </View>
          <View style={styles.taskTextContainer}>
            <ThemedText style={styles.taskTitle}>今日も分別できましたか？</ThemedText>
            <View style={styles.pointsContainer}>
              {/* Tog bort inloggnings-texten härifrån eftersom den nu sker automatiskt */}
              <ThemedText style={styles.pointsTextGreen}>ごみを分別して +1P</ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
        </Pressable>

        <View style={styles.combinedCard}>
          <View style={styles.combinedCardLeft}>
            <ThemedText style={styles.cardTitleSquare}>
              {getGarbageUI(todayGarbage).title}
            </ThemedText>
            <ThemedText style={styles.cardDateText}>{getTodayJapaneseDate()}</ThemedText>
            <Ionicons name={getGarbageUI(todayGarbage).icon as any} size={34} color={getGarbageUI(todayGarbage).color} style={styles.gridIcon} />
          </View>

          <View style={styles.combinedCardRight}>
            <ThemedText style={styles.cardTitleSquareText}>ポイント</ThemedText>
            
            <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress 
                value={userPoints}
                radius={35} 
                progressValueColor={'#000'} 
                activeStrokeColor={'#76C800'} 
                inActiveStrokeColor={'#E0E0E0'} 
                inActiveStrokeOpacity={0.5} 
                activeStrokeWidth={8} 
                inActiveStrokeWidth={6}
                maxValue={30} 
                duration={1500} 
              />
            </Animated.View>

            <Animated.View style={[styles.leafContainerCombined, { transform: [{ scale: scaleAnim }] }]}>
              <Ionicons name="leaf" size={26} color="#76C800" />
            </Animated.View>
          </View>
        </View>

        <View style={styles.reuseContainer}>
          <View style={styles.reuseTitleRow}>
            <ThemedText style={styles.reuseSectionTitle}>リユース品を探す</ThemedText>
            <MaterialCommunityIcons name="sofa-outline" size={22} color="#000" />
          </View>

          {loadingItems ? (
            <View style={styles.loaderContainer}><ActivityIndicator size="small" color="#5B9E00" /></View>
          ) : items.length === 0 ? (
            <View style={styles.emptyContainer}><ThemedText style={styles.emptyText}>出品された商品はまだありません</ThemedText></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsScroll}>
              {items.map((item) => {
                const imageUrl = getFirstImageUrl(item.images);
                return (
                  <Pressable key={item.id} style={styles.itemCard} onPress={() => router.push(`/reuse/${item.id}`)}>
                    {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.itemImage} /> : <View style={styles.fallbackImagePlaceholder}><MaterialCommunityIcons name="image-off" size={32} color="#999" /></View>}
                    <View style={styles.itemTitleOverlay}><ThemedText style={styles.itemTitleText} numberOfLines={1}>{item.title}</ThemedText></View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
          
      {/* VÅR NYA MODERNA MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name={modalConfig.icon as any} size={48} color="#76C800" style={styles.modalIcon} />
            <ThemedText style={styles.modalTitle}>{modalConfig.title}</ThemedText>
            <ThemedText style={styles.modalMessage}>{modalConfig.message}</ThemedText>
            
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={styles.modalButtonText}>閉じる</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.tabBarContainer}>
        {/* ... (Din befintliga TabBar-kod här) ... */}
        <View style={styles.scanBackgroundCircle} />
        <View style={styles.tabBarBackground} />
        <View style={styles.tabBarContent}>
          <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
            <Octicons name="home" size={24} color="#5B9E00" />
            <ThemedText style={[styles.tabLabel, styles.tabLabelActive]}>ホーム</ThemedText>
          </Pressable>
          <Pressable style={styles.tabItem} onPress={() => router.push('/calendar')}>
            <FontAwesome5 name="calendar-alt" size={22} color="#555" />
            <ThemedText style={styles.tabLabel}>ゴミカレンダー</ThemedText>
          </Pressable>
          <View style={styles.scanWrapper}>
            <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
              <Ionicons name="scan-outline" size={26} color="#555" />
            </Pressable>
            <ThemedText style={styles.scanLabel}>ゴミスキャン</ThemedText>
          </View>
          <Pressable style={styles.tabItem} onPress={() => router.push('/reuse')}>
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

// 5. STYLES
const HERO_HEIGHT = width <= 360 ? 270 : isSmallPhone ? 180 : isMediumPhone ? 205 : 230;
const GRID_SIZE = width <= 360 ? 112 : isSmallPhone ? 120 : isMediumPhone ? 132 : 145;
const SECTION_GAP = width <= 360 ? 10 : isSmallPhone ? 14 : isMediumPhone ? 18 : 22;
const HORIZONTAL_PADDING = width <= 360 ? 14 : isSmallPhone ? 16 : isMediumPhone ? 18 : 20;

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
  fullScreenContainer: { flex: 1.95, justifyContent: 'space-between', paddingBottom: 120 },
  heroBackground: { width: '100%', height: HERO_HEIGHT, paddingTop: width <= 360 ? 42 : 55, },
  heroImageRadius: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, resizeMode: 'cover', transform: [{ scale: 1.2 }] },
  welcomeTextContainer: { marginTop: width <= 360 ? 16 : 2, marginLeft: width <= 360 ? 20 : 40, marginRight: 20 },
  textFrame: { height: width <= 360 ? 55 : 68, justifyContent: 'center' }, 
  welcomeText: { fontWeight: 'bold', color: '#000000', lineHeight: width <= 360 ? 24 : 32, fontSize: 20 },
  gpsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignSelf: 'flex-start', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  gpsButtonText: { fontSize: 13, fontWeight: 'bold', color: '#5B9E00', marginLeft: 6 },
  
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
  tabLabel: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  tabLabelActive: { color: '#5B9E00', fontWeight: 'bold' },
  scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
  scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 2 },
  scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' },

  taskCard: { 
    backgroundColor: '#fff', 
    borderRadius: 22, 
    paddingVertical: height * 0.020, 
    paddingHorizontal: width <= 360 ? 14 : width * 0.05, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 30, 
    marginHorizontal: HORIZONTAL_PADDING, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 8, 
    elevation: 4 
  },
  iconContainer: { marginRight: 12 },
  taskTextContainer: { flex: 1 },
  taskTitle: { fontSize: width <= 360 ? 13 : 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  pointsContainer: { flexDirection: 'row', gap: width <= 360 ? 6 : 10, flexWrap: 'wrap' },
  pointsTextGreen: { fontSize: width <= 360 ? 10 : 11, color: '#76C800', fontWeight: '600' },

  combinedCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginTop: 20,
    marginHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  combinedCardLeft: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#F0F0F0' },
  combinedCardRight: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardTitleSquare: { fontSize: width <= 360 ? 12 : 14, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  cardTitleSquareText: { fontSize: width <= 360 ? 12 : 14, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  cardDateText: { fontSize: width <= 360 ? 11 : 12, color: '#555', fontWeight: '500', marginBottom: 4 },
  gridIcon: { marginTop: 2 },
  leafContainerCombined: { position: 'absolute', top: -5, right: width <= 360 ? 15 : 25 },

  reuseContainer: { backgroundColor: '#fff', borderRadius: 24, marginTop: 25, marginHorizontal: HORIZONTAL_PADDING, paddingVertical: width <= 360 ? 18 : isSmallPhone ? 22 : isMediumPhone ? 26 : 28, paddingHorizontal: width <= 360 ? 14 : HORIZONTAL_PADDING, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 100, elevation: 1 },
  reuseTitleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: SECTION_GAP + 6, marginTop: -GRID_SIZE * 0.1 },
  reuseSectionTitle: { fontSize: width <= 360 ? 14 : 16, fontWeight: 'bold', color: '#000' },
  itemsScroll: { gap: 14, paddingBottom: 2 },
  itemCard: { width: 130, height: 130, backgroundColor: '#F0EFEA', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  fallbackImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#EAE8E0' },
  itemTitleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 6, paddingHorizontal: 8 },
  itemTitleText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  loaderContainer: { height: 130, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { height: 130, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },

  tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end' },
  tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
  scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
  tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },

  /* Nya Stilar för Modalen */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.8, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalIcon: { marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalButton: { backgroundColor: '#76C800', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 30, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});