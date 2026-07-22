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
  Modal, 
  TouchableOpacity
} from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { ThemedText } from '@/components/themed-text';
import {  FontAwesome5, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useRouter,  useFocusEffect, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { useAppTheme } from './tema/ThemeContext';
import { buildLocationHintText, findBestAreaMatch, formatAreaLabel } from '@/lib/nearest-area';


const { width, height } = Dimensions.get('window');
const isSmallPhone = height < 700;
const isMediumPhone = height >= 700 && height < 850;

interface ReuseItem {
  id: string;
  title: string;
  images: any;
}


const normalizeAddress = (str: string) => {
  if (!str) return "";
  return str
    .replace(/\s+/g, '') 
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) 
    .replace(/一/g, '1')
    .replace(/二/g, '2')
    .replace(/三/g, '3')
    .replace(/四/g, '4')
    .replace(/五/g, '5')
    .replace(/六/g, '6')
    .replace(/七/g, '7')
    .replace(/八/g, '8')
    .replace(/九/g, '9')
    .replace(/十/g, '10');
};

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, selectedDesign } = useAppTheme(); 
  const pathname = usePathname();
  const isHomeActive = pathname === '/dashboard';
  const isCalendarActive = pathname === '/calendar';
  const isScanActive = pathname === '/scan';
  const isReuseActive = pathname.startsWith('/reuse');
  const isMyPageActive = pathname === '/mypage';


  const [items, setItems] = useState<ReuseItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [detectedCity, setDetectedCity] = useState<string>("エリア設定中...");
  const [todayGarbage, setTodayGarbage] = useState<string>("確認中...");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  
  const [hasClaimedLogin, setHasClaimedLogin] = useState<boolean>(false);
  const [hasClaimedSort, setHasClaimedSort] = useState<boolean>(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: "", message: "", icon: "gift" });

  const fullText = "調べる・分ける\n譲るを、Gomifyで";
  const [displayedText, setDisplayedText] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const translateY = useRef(new Animated.Value(15)).current; 
  const scaleAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 30, useNativeDriver: true })
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


  const showModernAlert = (title: string, message: string, icon: string) => {
    setModalConfig({ title, message, icon });
    setModalVisible(true);
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('points, last_login_date, last_sort_date')
          .eq('id', user.id)
          .single();
        
        if (data) {
          let currentPoints = data.points || 0;
          const todayStr = new Date().toISOString().split('T')[0]; 
          
          setHasClaimedSort(data.last_sort_date === todayStr);

          if (data.last_login_date !== todayStr) {
            currentPoints += 1;
            await supabase.from('profiles').update({ points: currentPoints, last_login_date: todayStr }).eq('id', user.id);
            setHasClaimedLogin(true);
            setTimeout(() => {
              showModernAlert("ログインボーナス！", "アプリを開いてくれてありがとうございます！\n1ポイント獲得しました。🌱", "gift");
            }, 1000); 
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
  setLoadingItems(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingItems(false);
      return;
    }

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .neq("user_id", user.id) 
      .eq("status", "available") 
      .order("priority", { ascending: false }) 
      .order("created_at", { ascending: false }); 

    if (error) throw error;

    setItems(data || []);
  } catch (err) {
    console.error("fetchItems error:", err);
  } finally {
    setLoadingItems(false);
  }
};


  const getWebCurrentPosition = () => {
    return new Promise<{ coords: { latitude: number; longitude: number } }>((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('このブラウザでは位置情報機能がサポートされていません。'));
        return;
      }

    
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };

  const fetchTodaysGarbage = async (areaId: number) => {
    const today = new Date();
    const japaneseWeekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const todayJapanese = japaneseWeekdays[today.getDay()]; 
    const dayNum = String(today.getDay());

    try {
      const { data: rulesData, error } = await supabase.from('collection_rules').select('day_of_week, garbage_type').eq('area_id', areaId);
      if (error) {
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
      setTodayGarbage("収集なし");
    }
  };

 
const initializeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('selected_area_id, city').eq('id', user.id).single();
      
      if (profile && profile.selected_area_id) {
       
        if (profile.city) {
          setDetectedCity(profile.city); 
        }
        await fetchTodaysGarbage(profile.selected_area_id);
      } else {
   
        await useCurrentLocation();
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
        showModernAlert("達成済み！", "今日の分別ポイントはすでに獲得済みです！\nまた明日チャレンジしてくださいね。♻️", "checkmark-circle");
        return;
      }
      const newPoints = userPoints + 1;
      const { error } = await supabase.from('profiles').update({ points: newPoints, last_sort_date: todayStr }).eq('id', user.id);
      if (error) throw error;
      setUserPoints(newPoints);
      setHasClaimedSort(true);
      showModernAlert("素晴らしい！", "ごみの分別ありがとうございます！\n1ポイント獲得しました。🎉", "leaf");
    } catch (err: any) {
      showModernAlert("エラー", "ポイントの保存に失敗しました。", "alert-circle");
    }
  };

  const getGarbageUI = (type: string) => {
    if (type.includes("燃やす") || type.includes("可燃") || type.includes("燃える")) {
      return { title: "燃えるごみ", icon: "flame", color: "#DC2626" };
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
  setIsLocating(true);
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      showModernAlert("エラー", "位置情報のアクセスが拒否されました。", "alert-circle");
      setIsLocating(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    const { latitude, longitude } = location.coords;

    let detailedAddress = "";
    let fullAddressString = ""; 


    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ja`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const province = data.address.province || "";
        const city = data.address.city || data.address.local_admin || "";
        const district = data.address.district || data.address.city_district || "";
        const suburb = data.address.suburb || data.address.borough || "";
        const neighborhood = data.address.neighbourhood || data.address.quarter || "";
        
        detailedAddress = buildLocationHintText([province, city, district, suburb, neighborhood]);
        fullAddressString = `${province}${city}${district}${suburb}${neighborhood}`;
      }
    } catch (apiError) {
      console.warn("ジオコーディングAPIの取得に失敗しました。:", apiError);
    }

    const { data: { user } } = await supabase.auth.getUser();
    

    const [areasResult, profileResult] = await Promise.all([
      supabase.from('areas').select('area_id, area_name_jp, ward_id'),
      user
        ? supabase.from('profiles').select('selected_area_id, city, prefecture, address, building').eq('id', user.id).single()
        : Promise.resolve({ data: null }),
    ]);

    const areasData = areasResult.data || [];
    const profile = profileResult.data;
    const normalizedSearchAddress = normalizeAddress(fullAddressString);
    
    let bestMatch = null;
    let longestMatchLength = 0;


    for (const area of areasData) {
      if (!area.area_name_jp) continue;
      
      const normalizedDbName = normalizeAddress(area.area_name_jp);
      
      if (normalizedSearchAddress.includes(normalizedDbName)) {
        if (normalizedDbName.length > longestMatchLength) {
          longestMatchLength = normalizedDbName.length;
          bestMatch = area;
        }
      }
    }


    if (!bestMatch) {
      const profileHints = profile
        ? buildLocationHintText([profile.prefecture, profile.city, profile.address, profile.building])
        : '';
      
      const { area: matchedArea, score } = findBestAreaMatch(
        [detailedAddress, fullAddressString, profileHints, profile?.city, profile?.prefecture],
        areasData
      );
      
      if (matchedArea && score >= 70) {
        bestMatch = matchedArea;
      }
    }

  
    if (user && bestMatch) {
      const finalAreaName = bestMatch.area_name_jp;

      await supabase.from('profiles').update({
        selected_area_id: bestMatch.area_id,
        city: finalAreaName,
      }).eq('id', user.id);

      setDetectedCity(finalAreaName);
      await fetchTodaysGarbage(bestMatch.area_id);

      
    } else if (user && profile?.selected_area_id) {
      const fallbackAreaName = profile.city || '設定済みのエリア';
      setDetectedCity(fallbackAreaName);
      await fetchTodaysGarbage(profile.selected_area_id);
      showModernAlert("注意", `GPSの住所が曖昧だったため、保存されている住所を使いました。`, "alert-circle");
    } else {

      showModernAlert(
        "注意",
        `エリアが見つかりません。\n\n【取得した住所】\n${normalizedSearchAddress}`,
        "alert-circle"
      );
    }
  } catch (e) {
    console.error("Dashboard GPS Error:", e);
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

  const isKawaii = selectedDesign === 'cute';
  const isNight = selectedDesign === 'night';
  const isCafe = selectedDesign === 'cafe';

  const backgroundImage = isKawaii
    ? require('@/assets/images/kawaiibackground.png')
    : isCafe
      ? require('@/assets/images/cafebackground.png') 
      : isNight
        ? require('@/assets/images/midnightbackground.png')
        : require('@/assets/images/Rectangle 8.png');

  const cafeTextColor = '#4A3B32'; 
  const cafeAccentColor = '#8fa288'; 
  const cafeBackgroundColor = '#F9F6F0';
  
  const kawaiiTextColor = '#6B4E3C';
  const kawaiiAccentColor = '#c3dec1';
  const kawaiiBackgroundColor = '#FCF5F0';
  const kawaiiPeachPink = '#F4A396';

  const mainBackgroundColor = isNight ? '#000000' : isKawaii ? kawaiiBackgroundColor : isCafe ? cafeBackgroundColor : '#F5F5F5';
  const contentBackdropColor = isNight ? '#000000' : isCafe ? cafeBackgroundColor : '#F5F5F5';
  const accentTextColor = isNight ? '#e6e19d' : isKawaii ? kawaiiTextColor : isCafe ? cafeTextColor : theme.colors.text;
  const accentPrimaryColor = isNight ? '#A6C56F' : isKawaii ? kawaiiAccentColor : isCafe ? cafeAccentColor : theme.colors.primary;
  
  const tabBarBgColor = isNight ? '#1C2432' : isKawaii ? '#E6F0E3' : isCafe ? '#F2EBE3' : '#D1E0C5';
  const tabActiveColor = isKawaii ? kawaiiPeachPink : isNight ? '#A6C56F' : isCafe ? cafeAccentColor : '#5B9E00';
  const tabInactiveColor = isKawaii ? kawaiiPeachPink : isNight ? '#7A8B9E' : isCafe ? '#B8A89A' : '#555555';

  
  return (
    <View style={[{ flex: 1 }, { backgroundColor: mainBackgroundColor }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.fullScreenContainer, (isNight || isCafe) && { backgroundColor: contentBackdropColor }]}> 
          
     
          <ImageBackground 
            source={backgroundImage} 
            style={[styles.heroBackground, isKawaii && { backgroundColor: kawaiiBackgroundColor }, isCafe && { backgroundColor: cafeBackgroundColor }, isNight && styles.nightHeroBackground]} 
            imageStyle={[styles.heroImageRadius, isKawaii && styles.kawaiiHeroImageRadius, isCafe && styles.cafeHeroImageRadius]}
          >
            <View style={styles.welcomeTextContainer}>
              <Animated.View style={[styles.textFrame, { opacity: fadeAnim, transform: [{ translateY: translateY }] }]}>
                <ThemedText type="default" style={[styles.welcomeText, isKawaii && { color: kawaiiTextColor }, isCafe && { color: cafeTextColor }, isNight && { color: accentTextColor }]}>
                  {displayedText}
                </ThemedText>
              </Animated.View>
              
              <Pressable 
                style={[styles.gpsButton, (isKawaii || isCafe) && { backgroundColor: 'rgba(255, 255, 255, 0.4)' }, isNight && styles.nightGpsButton]}
                onPress={useCurrentLocation} 
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={accentPrimaryColor} />
                ) : (
                  <>
                    <Ionicons name="location" size={14} color={accentPrimaryColor} />
                    <ThemedText style={[styles.gpsButtonText, { color: accentTextColor }]}>
                      現在地: {detectedCity}
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
              isKawaii && styles.kawaiiTaskCard,
              isCafe && styles.cafeTaskCard,
              isNight && styles.nightTaskCard,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={56} 
                color={accentPrimaryColor} 
              /> 
            </View>
            <View style={styles.taskTextContainer}>
              <ThemedText style={[styles.taskTitle, (isKawaii || isCafe) && { color: accentTextColor }, isNight && { color: accentTextColor }]}>今日も分別できましたか？</ThemedText>
              <View style={styles.pointsContainer}>
                <ThemedText style={[styles.pointsTextGreen, { color: isKawaii ? '#81A77D' : isCafe ? '#A38068' : isNight ? accentTextColor : theme.colors.primary }]}>
                  ごみを分別して +1P
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={(isKawaii || isCafe) ? "#E0D7D3" : "#CCCCCC"} />
          </Pressable>

    
          <View style={[styles.combinedCard, isKawaii && styles.kawaiiCombinedCard, isCafe && styles.cafeCombinedCard, isNight && styles.nightCombinedCard]}>
            

            <View style={[styles.combinedCardLeft, isKawaii && styles.kawaiiCombinedCardLeft, isCafe && styles.cafeCombinedCardLeft, isNight && styles.nightCombinedCardLeft]}>
              <ThemedText style={[styles.cardTitleSquare, (isKawaii || isCafe) && { color: accentTextColor }, isNight && { color: accentTextColor }]}>
                {getGarbageUI(todayGarbage).title}
              </ThemedText>
              <ThemedText style={[styles.cardDateText, (isKawaii || isCafe) && { color: '#8E7B71' }, isNight && { color: accentTextColor }]}>
                {getTodayJapaneseDate()}
              </ThemedText>
              <Ionicons 
                name={getGarbageUI(todayGarbage).icon as any} 
                size={34} 
                color={isKawaii ? kawaiiAccentColor : isCafe ? cafeAccentColor : getGarbageUI(todayGarbage).color} 
                style={styles.gridIcon} 
              />
            </View>

            <View style={[styles.combinedCardRight, isKawaii && styles.kawaiiCombinedCardRight, isCafe && styles.cafeCombinedCardRight, isNight && styles.nightCombinedCardRight]}>
              <ThemedText style={[styles.cardTitleSquareText, (isKawaii || isCafe) && { color: accentTextColor }, isNight && { color: accentTextColor }]}>ポイント</ThemedText>
              
              <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress 
                  value={userPoints}
                  radius={35} 
                  progressValueColor={isNight ? accentTextColor : (isKawaii || isCafe) ? accentTextColor : '#000'} 
                  activeStrokeColor={accentPrimaryColor} 
                  inActiveStrokeColor={isNight ? '#2E3A4D' : (isKawaii || isCafe) ? '#ffffff' : '#bababa'} 
                  inActiveStrokeOpacity={0.6} 
                  activeStrokeWidth={10} 
                  inActiveStrokeWidth={10}
                  maxValue={30} 
                  duration={1500} 
                />
              </Animated.View>

              <Animated.View style={[styles.leafContainerCombined, { transform: [{ scale: scaleAnim }] }]}>
                <Ionicons 
                  name="leaf" 
                  size={24} 
                  color={accentPrimaryColor} 
                />
              </Animated.View>
            </View>
          </View>


          <View style={[styles.reuseContainer, isKawaii && styles.kawaiiReuseContainer, isCafe && styles.cafeReuseContainer, isNight && styles.nightReuseContainer]}>
            <View style={styles.reuseTitleRow}>
              <ThemedText style={[styles.reuseSectionTitle, (isKawaii || isCafe) && { color: accentTextColor }, isNight && { color: accentTextColor }]}>
                リユース品を探す
              </ThemedText>
              <MaterialCommunityIcons 
                name="sofa-outline" 
                size={22} 
                color={accentPrimaryColor} 
              />
            </View>
            
            {loadingItems ? (
              <View style={styles.loaderContainer}><ActivityIndicator size="small" color={accentPrimaryColor} /></View>
            ) : items?.length === 0 ? (
              <View style={styles.emptyContainer}><ThemedText style={[styles.emptyText, (isKawaii || isCafe) && { color: '#8E7B71' }, isNight && { color: accentTextColor }]}>出品された商品はまだありません</ThemedText></View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsScroll}>
                {items?.map((item) => {
                  const imageUrl = getFirstImageUrl(item.images);
                  return (
                    <Pressable key={item.id} style={[styles.itemCard, isCafe && styles.cafeItemCard, isNight && styles.nightItemCard]} onPress={() => router.push(`/reuse/${item.id}`)}>
                      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.itemImage} /> : <View style={[styles.fallbackImagePlaceholder, (isKawaii || isCafe) && { backgroundColor: '#F2EDE9' }, isNight && { backgroundColor: '#2A3442' }]}><MaterialCommunityIcons name="image-off" size={32} color={(isKawaii || isCafe) ? "#C5B8B1" : isNight ? accentTextColor : "#999"} /></View>}
                      <View style={styles.itemTitleOverlay}>
                        <ThemedText style={styles.itemTitleText} numberOfLines={1}>{item.title}</ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

        </View>
      </ScrollView>
          

      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, (isKawaii || isCafe) && { backgroundColor: '#FFFDFB', borderColor: '#F2EDE9', borderWidth: 1 }, isNight && styles.nightModalContent]}>
            <Ionicons name={modalConfig.icon as any} size={48} color={accentPrimaryColor} style={styles.modalIcon} />
            <ThemedText style={[styles.modalTitle, (isKawaii || isCafe) && { color: accentTextColor }, isNight && { color: accentTextColor }]}>{modalConfig.title}</ThemedText>
            <ThemedText style={[styles.modalMessage, (isKawaii || isCafe) && { color: '#8E7B71' }, isNight && { color: accentTextColor }]}>{modalConfig.message}</ThemedText>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: accentPrimaryColor }]} onPress={() => setModalVisible(false)}>
              <ThemedText style={styles.modalButtonText}>閉じる</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBarBackground, { backgroundColor: tabBarBgColor }]} />
        
        <View style={styles.tabBarContent}>

          <Pressable style={styles.homeItem} onPress={() => router.push('/dashboard')}>
            <View style={[styles.tabIconCircle, isHomeActive && styles.tabIconCircleActiveHome]}>
              <Octicons name="home" size={24} color={isHomeActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.tabLabel, { color: isHomeActive ? tabActiveColor : tabInactiveColor, fontWeight: isHomeActive ? 'bold' : '600' }]}>
              ホーム
            </ThemedText>
          </Pressable>


          <Pressable style={styles.tabItem} onPress={() => router.push('/calendar')}>
            <View style={[styles.tabIconCircle, isCalendarActive && styles.tabIconCircleActive]}>
              <FontAwesome5 name="calendar-alt" size={22} color={isCalendarActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.tabLabel, { color: isCalendarActive ? tabActiveColor : tabInactiveColor, fontWeight: isCalendarActive ? 'bold' : '600' }]}>
              ゴミカレンダー
            </ThemedText>
          </Pressable>

          <Pressable style={styles.scanWrapper} onPress={() => router.push('/scan')}>
            <View style={[styles.scanButton, isScanActive && styles.tabIconCircleActive]}>
              <Ionicons name="scan-outline" size={26} color={isScanActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.scanLabel, { color: isScanActive ? tabActiveColor : tabInactiveColor, fontWeight: isScanActive ? 'bold' : '700' }]}>
              ゴミスキャン
            </ThemedText>
          </Pressable>


          <Pressable style={styles.tabItem} onPress={() => router.push('/reuse')}>
            <View style={[styles.tabIconCircle, isReuseActive && styles.tabIconCircleActive]}>
              <Ionicons name="refresh-circle-outline" size={26} color={isReuseActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.tabLabel, { color: isReuseActive ? tabActiveColor : tabInactiveColor, fontWeight: isReuseActive ? 'bold' : '600' }]}>
              リユース
            </ThemedText>
          </Pressable>


          <Pressable style={styles.tabItem} onPress={() => router.push('/mypage')}>
            <View style={[styles.tabIconCircle, isMyPageActive && styles.tabIconCircleActive]}>
              <Ionicons name="person" size={22} color={isMyPageActive ? tabActiveColor : tabInactiveColor} />
            </View>
            <ThemedText style={[styles.tabLabel, { color: isMyPageActive ? tabActiveColor : tabInactiveColor, fontWeight: isMyPageActive ? 'bold' : '600' }]}>
              マイページ
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}


const HERO_HEIGHT = width <= 360 ? 270 : isSmallPhone ? 180 : isMediumPhone ? 205 : 230;
const GRID_SIZE = width <= 360 ? 112 : isSmallPhone ? 120 : isMediumPhone ? 132 : 145;
const SECTION_GAP = width <= 360 ? 10 : isSmallPhone ? 14 : isMediumPhone ? 18 : 22;
const HORIZONTAL_PADDING = width <= 360 ? 14 : isSmallPhone ? 16 : isMediumPhone ? 18 : 20;

const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1.95, justifyContent: 'space-between', paddingBottom: 120 },
  heroBackground: { width: '100%', height: HERO_HEIGHT, paddingTop: width <= 360 ? 42 : 55 },
  heroImageRadius: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, resizeMode: 'cover', transform: [{ scale: 1.2 }] },
  welcomeTextContainer: { marginTop: width <= 360 ? 16 : 2, marginLeft: width <= 360 ? 20 : 40, marginRight: 20 },
  textFrame: { height: width <= 360 ? 55 : 68, justifyContent: 'center' }, 
  welcomeText: { fontWeight: 'bold', color: '#000000', lineHeight: width <= 360 ? 24 : 32, fontSize: 20 },
  gpsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignSelf: 'flex-start', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, borderColor:'#9dd79d', borderWidth: 1 },
  gpsButtonText: { fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  

  tabItem: { 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    flex: 1, 
    height: 80, 
    position: 'relative',
    paddingTop: 12 
  },

  homeItem: { 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    flex: 1, 
    height: 75, 
    position: 'relative',
    paddingTop: 12 
  },
  tabIconCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transform: [{ translateY: 4 }] 
  },
  

  tabIconCircleActiveHome: { 
    backgroundColor: '#FFFFFF', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 3, 
    transform: [{ translateY: -18 }] 
  },


  tabIconCircleActive: { 
    backgroundColor: '#FFFFFF', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 3, 
    transform: [{ translateY: -18 }] 
  },
  tabLabel: { 
    fontSize: 9, 
    color: '#555', 
    fontWeight: '600', 
    textAlign: 'center',
    position: 'absolute', 
    bottom: 4, 
    left: 0,
    right: 0
  },


  scanWrapper: { 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    flex: 1, 
    height: 80, 
    position: 'relative',
    paddingTop: 12
  },
  scanButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transform: [{ translateY: 4 }]
  },
  scanLabel: { 
    fontSize: 9, 
    color: '#555', 
    fontWeight: '700', 
    textAlign: 'center', 
    position: 'absolute', 
    bottom: 4, 
    left: 0, 
    right: 0 
  },

  taskCard: { backgroundColor: '#fff', borderRadius: 22, borderColor:'#9dd79d', borderWidth: 1, paddingVertical: height * 0.020, paddingHorizontal: width <= 360 ? 14 : width * 0.05, flexDirection: 'row', alignItems: 'center', marginTop: 30, marginHorizontal: HORIZONTAL_PADDING, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  iconContainer: { marginRight: 12 },
  taskTextContainer: { flex: 1 },
  taskTitle: { fontSize: width <= 360 ? 13 : 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  pointsContainer: { flexDirection: 'row', gap: width <= 360 ? 6 : 10, flexWrap: 'wrap' },
  pointsTextGreen: { fontSize: width <= 360 ? 10 : 11, fontWeight: '600' },

  combinedCard: { flexDirection: 'row', backgroundColor: '#fff', borderColor:'#9dd79d', borderWidth: 1,  borderRadius: 24, marginTop: 20, marginHorizontal: HORIZONTAL_PADDING, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, alignItems: 'center', justifyContent: 'space-between' },
  combinedCardLeft: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#F0F0F0' },
  combinedCardRight: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardTitleSquare: { fontSize: width <= 360 ? 12 : 14, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  cardTitleSquareText: { fontSize: width <= 360 ? 12 : 14, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  cardDateText: { fontSize: width <= 360 ? 11 : 12, color: '#555', fontWeight: '500', marginBottom: 4 },
  gridIcon: { marginTop: 2 },
  leafContainerCombined: { position: 'absolute', top: -5, right: width <= 360 ? 15 : 25 },

  
  reuseContainer: { backgroundColor: '#fff', borderRadius: 24,borderColor:'#9dd79d', borderWidth: 1, marginTop: 25, marginHorizontal: HORIZONTAL_PADDING, paddingVertical: width <= 360 ? 18 : isSmallPhone ? 22 : isMediumPhone ? 26 : 28, paddingHorizontal: width <= 360 ? 14 : HORIZONTAL_PADDING, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 100, elevation: 1 },
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
  tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, zIndex: 1 },
  scanBackgroundCircle: { display: 'none' },
  tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.8, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalIcon: { marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 30, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },


  kawaiiHeroImageRadius: { opacity: 0.9 },
  kawaiiTaskCard: { backgroundColor: '#F0F4EB', borderColor: '#ffffff', borderWidth: 3, shadowColor: '#ffffff', shadowOpacity: 0.05, shadowRadius: 30, elevation: 10 },
  kawaiiCombinedCard: { backgroundColor: '#FCF6EA', borderColor: '#ffffff', borderWidth: 3, shadowOpacity: 0.03 },
  kawaiiCombinedCardLeft: { borderRightColor: '#F2EDE9' },
  kawaiiCombinedCardRight: { backgroundColor: 'transparent' },
  kawaiiReuseContainer: { backgroundColor: '#fbece8', borderColor: '#ffffff', borderWidth: 3, shadowOpacity: 0.03 },
  kawaiiGpsButton: { backgroundColor:'rgba(92, 92, 92, 0.5)', borderWidth: 1, borderColor: '#ffffff' },



  cafeHeroBackground: { backgroundColor: '#F9F6F0' },
  cafeHeroImageRadius: { opacity: 0.95 },
  cafeTaskCard: { backgroundColor: '#FFFDF9', borderColor: '#EAE1D5', borderWidth: 2, shadowColor: '#D7C4B7', shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  cafeCombinedCard: { backgroundColor: '#FFFDF9', borderColor: '#EAE1D5', borderWidth: 2, shadowOpacity: 0.05 },
  cafeCombinedCardLeft: { borderRightColor: '#EAE1D5' },
  cafeCombinedCardRight: { backgroundColor: 'transparent' },
  cafeReuseContainer: { backgroundColor: '#FFFDF9', borderColor: '#EAE1D5', borderWidth: 2, shadowOpacity: 0.05 },
  cafeItemCard: { backgroundColor: '#F2EDE9' },

  nightHeroBackground: { backgroundColor: '#000000' },
  nightGpsButton: { backgroundColor:'rgba(92, 92, 92, 0.5)', borderWidth: 1, borderColor: '#9288da' },
  nightTaskCard: { backgroundColor: '#1C2432', borderColor: '#9288da', borderWidth: 1.5, shadowColor: '#A6C56F', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  nightCombinedCard: { backgroundColor: '#1C2432', borderColor: '#9288da', borderWidth: 1.2, shadowOpacity: 0.03 },
  nightCombinedCardLeft: { borderRightColor: '#2E3A4D' },
  nightCombinedCardRight: { backgroundColor: 'transparent' },
  nightReuseContainer: { backgroundColor: '#1C2432', borderColor: '#9288da', borderWidth: 1.2, shadowOpacity: 0.03 },
  nightItemCard: { backgroundColor: '#2A3442' },
  nightModalContent: { backgroundColor: '#1C2432', borderColor: '#9288da', borderWidth: 1. },
});