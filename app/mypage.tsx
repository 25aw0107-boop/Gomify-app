import { ThemedText } from '@/components/themed-text';
import { FontAwesome5, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePathname, useRouter, Stack, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, Platform, Modal, ActivityIndicator, TextInput, KeyboardAvoidingView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAppTheme, type ThemeType } from './tema/ThemeContext';

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedDesign, setTheme } = useAppTheme();


const uploadImageToSupabase = async (uri: string) => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) return;
    
    const userId = authData.user.id;

    const response = await fetch(uri);
    const blob = await response.blob();
    

    const fileExt = uri.split('.').pop() || 'jpeg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    console.log("Bilden har sparats i databasen!");

  } catch (error) {
    console.error("エラー:", error);
    Alert.alert("エラー");
  }
};


  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const [themeSuccessVisible, setThemeSuccessVisible] = useState(false);
const [themeName, setThemeName] = useState('');
  const [inquiryText, setInquiryText] = useState('');
  const [reportText, setReportText] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

 
  const [userEmail, setUserEmail] = useState('加载中...');
  const [userLocation, setUserLocation] = useState('未設定');
  const [userIntro, setUserIntro] = useState('よろしくお願いします！'); 
  const [isProfileLoading, setIsProfileLoading] = useState(true);


  const [editNickname, setEditNickname] = useState('');
  const [editPrefecture, setEditPrefecture] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editIntroText, setEditIntroText] = useState('');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    design: false,
    display: false,
    about: false,
  });


  const [points, setPoints] = useState(10);
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(['natural']); 
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const maxPoints = 30;
  const pointsPercent = (points / maxPoints) * 100;

  const isKawaii = selectedDesign === 'cute';
  const isNight = selectedDesign === 'night';
  const isCafe = selectedDesign === 'cafe';

  const cafeTextColor = '#4A3B32'; 
  const cafeAccentColor = '#8fa288'; 
  const cafeBackgroundColor = '#ffffff';
  
  const kawaiiTextColor = '#6B4E3C';
  const kawaiiAccentColor = '#A4C3A2';
  const kawaiiBackgroundColor = '#FCF5F0';
  const kawaiiPeachPink = '#F4A396';

  const getThemeColors = () => {
    return {
      bg: isNight ? '#000000' : isKawaii ? kawaiiBackgroundColor : isCafe ? cafeBackgroundColor : '#F5F5F5',
      cardBg: isNight ? '#1C2432' : isKawaii ? '#FCF6EA' : isCafe ? '#f7f0eb' : '#FFFFFF',
      text: isNight ? '#FFFFFF' : isKawaii ? kawaiiTextColor : isCafe ? cafeTextColor : '#333333',
      subText: isNight ? '#A6C56F' : isKawaii ? '#8B5F65' : isCafe ? '#7A6B58' : '#666666',
      border: isNight ? '#9288da' : isKawaii ? '#E0E0E0' : isCafe ? '#573e19' : '#E0E0E0', borderWidth: isNight ? 5 : 0,
      innerBg: isNight ? '#2A3442' : isKawaii ? '#ffede3' : isCafe ? '#e3d1ca' : '#F5F5F5',
      tabBarBgColor: isNight ? '#1C2432' : isKawaii ? '#E6F0E3' : isCafe ? '#F2EBE3' : '#D1E0C5',
      tabActiveColor: isKawaii ? kawaiiPeachPink : isNight ? '#A6C56F' : isCafe ? cafeAccentColor : '#5B9E00',
      tabInactiveColor: isKawaii ? kawaiiPeachPink : isNight ? '#7A8B9E' : isCafe ? '#B8A89A' : '#555555',
    };
  };
  
  const themeColors = getThemeColors();
  const isHomeActive = pathname === '/dashboard';
  const isCalendarActive = pathname === '/calendar';
  const isScanActive = pathname === '/scan';
  const isReuseActive = pathname.startsWith('/reuse');
  const isMyPageActive = pathname === '/mypage';

 
  const fetchUserData = async () => {
    setIsProfileLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData || !authData.user) {
        throw authError || new Error('No user logged in');
      }

      const currentUser = authData.user;


const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('nickname, prefecture, city, intro, points, unlocked_themes, avatar_url') 
  .eq('id', currentUser.id)
  .single();


if (profile) {

  if (profile.avatar_url) {
    setProfileImage(profile.avatar_url);
  }
}

      if (profile && profile.unlocked_themes) {
        let dbThemes: string[] = [];
        if (Array.isArray(profile.unlocked_themes)) {
          dbThemes = profile.unlocked_themes;
        } else if (typeof profile.unlocked_themes === 'string') {
          try {
            dbThemes = JSON.parse(profile.unlocked_themes);
          } catch (e) {
            dbThemes = [];
          }
        }
        const safeThemes = Array.from(new Set(['natural', ...dbThemes]));
        setUnlockedThemes(safeThemes);
      } else {
        setUnlockedThemes(['natural']);
      }

      let finalDisplayName = '';
      if (profile && profile.nickname) {
        finalDisplayName = profile.nickname;
      } else {
        finalDisplayName = currentUser.email ? currentUser.email.split('@')[0] : '名無しユーザー';
      }
      setUserEmail(finalDisplayName);

      if (profile) {
        const pref = profile.prefecture || '';
        const city = profile.city || '';
        setUserLocation(`${pref} ${city}`.trim() || '未設定');
        setUserIntro(profile.intro || '自己紹介がありません');
        
        setEditNickname(profile.nickname || '');
        setEditPrefecture(profile.prefecture || '');
        setEditCity(profile.city || '');
        setEditIntroText(profile.intro || '');
      } else {
        setUserLocation('未設定');
        setUserIntro('自己紹介がありません');
      }

    } catch (err) {
      console.error('ユーザー情報の取得に失敗しました。', err);
      setUserEmail('未ログイン');
      setUserLocation('未設定');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const boostItemToTopPage = async (itemId: string) => {
    const boostCost = 5;
    if (points < boostCost) {
      Alert.alert('ポイント不足', 'ポイントが足りません');
      return;
    }
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData || !authData.user) throw new Error('ユーザーが見つかりません');

      const newPoints = points - boostCost;
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', authData.user.id);

      if (dbError) throw dbError;
      setPoints(newPoints);

      const successMessage = 'トップページに優先表示するために5ポイントを使用しました。';
      if (Platform.OS === 'web') {
        alert(successMessage);
      } else {
        Alert.alert('成功', successMessage);
      }
      setExpandedSections(prev => ({ ...prev, display: false }));
    } catch (error) {
      console.error('商品の優先表示に失敗しました。:', error);
      Alert.alert('エラー', 'エラーが発生しました。もう一度お試しください。');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      return () => { };
    }, [])
  );


  const saveProfileData = async () => {
    setIsSavingProfile(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData || !authData.user) throw new Error('ユーザー見つかりません');

      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: editNickname.trim(),
          prefecture: editPrefecture.trim(),
          city: editCity.trim(),
          intro: editIntroText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id);

      if (error) throw error;
      await fetchUserData();
      setEditProfileModalVisible(false);
    } catch (err) {
      console.error('保存に失敗しました。:', err);
      Alert.alert('エラー', 'プロフィールの更新に失敗しました。');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendTicket = async (type: 'inquiry' | 'report', content: string) => {
    if (!content.trim()) {
      const emptyMsg = '内容を入力してください。';
      Platform.OS === 'web' ? alert(emptyMsg) : Alert.alert('入力エラー', emptyMsg);
      return;
    }
    setIsSubmittingTicket(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData || !authData.user) throw new Error('ユーザーが見つかりません');

      const { error } = await supabase
        .from('tickets')
        .insert({
          user_id: authData.user.id,
          type: type,
          content: content.trim(),
        });

      if (error) throw error;
      const successMsg = type === 'inquiry' 
        ? 'お問い合わせを受け付けました。ご返信までしばらくお待ちください。' 
        : '不具合報告を送信しました。ご協力ありがとうございました。';

      if (Platform.OS === 'web') {
        alert(successMsg);
      } else {
        Alert.alert('送信が完了しました', successMsg);
      }

      if (type === 'inquiry') {
        setInquiryText('');
        setInquiryModalVisible(false);
      } else {
        setReportText('');
        setReportModalVisible(false);
      }
    } catch (err) {
      console.error('Ticket submission failed:', err);
      const errorMsg = '送信に失敗しました。ネットワーク状況を確認してください。';
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('エラー', errorMsg);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
const pickImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permissionResult.granted === false) {
    Alert.alert('許可が必要', 'ギャラリーにアクセスする権限が必要です');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5, 
  });
  
  if (!result.canceled) {
    const imageUri = result.assets[0].uri;
    
 
    setProfileImage(imageUri); 
    
    await uploadImageToSupabase(imageUri);
  }
};

  const designModes: Array<{ id: ThemeType; name: string; cost: number; icon: string }> = [
    { id: 'natural', name: 'ナチュラルモード', cost: 0, icon: '🎨' },
    { id: 'night', name: 'ナイトモード', cost: 5, icon: '🌙' },
    { id: 'cute', name: '可愛いモード', cost: 5, icon: '✨' },
    { id: 'cafe', name: 'カフェモード', cost: 5, icon: '☕' }
  ];

  const spendPoints = async (amount: number, designMode: ThemeType) => {
    if (unlockedThemes.includes(designMode) || amount === 0) {
      setTheme(designMode);
      setExpandedSections(prev => ({ ...prev, design: false }));
      return;
    }

    if (points >= amount) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData || !authData.user) throw new Error('ユーザーが見つかりません');

        const newPoints = points - amount;
        const newUnlocked = Array.from(new Set([...unlockedThemes, designMode]));

        const { error: dbError } = await supabase
          .from('profiles')
          .update({ 
            points: newPoints,
            unlocked_themes: newUnlocked
          })
          .eq('id', authData.user.id);

        if (dbError) throw dbError;

        setPoints(newPoints);
        setUnlockedThemes(newUnlocked); 
        setTheme(designMode);
        setExpandedSections(prev => ({ ...prev, design: false }));
        
     const modeName =
  designMode === "cute"
    ? "可愛いモード"
    : designMode === "night"
    ? "ナイトモード"
    : designMode === "cafe"
    ? "カフェモード"
    : "ナチュラルモード";

setThemeName(modeName);
setThemeSuccessVisible(true);
      } catch (err) {
        console.error('JSONBへの保存に失敗しました。:', err);
        Alert.alert('エラー', '処理に失敗しました。');
      }
    } else {
      if (Platform.OS === 'web') {
        alert('ポイント不足: ポイントが足りません');
      } else {
        Alert.alert('ポイント不足', 'ポイントが足りません');
      }
    }
  };

  const executeSignOut = async () => {
    setLogoutModalVisible(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    } finally {
      router.replace('/');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setLogoutModalVisible(true);
    } else {
      Alert.alert('ログアウト', 'ログアウトしてもよろしいですか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', style: 'destructive', onPress: executeSignOut }
      ]);
    }
  };


  return (
    <View style={[styles.mainWrapper, { backgroundColor: themeColors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        
        <Modal
  transparent
  visible={themeSuccessVisible}
  animationType="fade"
  onRequestClose={() => setThemeSuccessVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.themeModal}>

      <View style={styles.themeIcon}>
        <Ionicons
          name="checkmark-circle"
          size={60}
          color="#5B9E00"
        />
      </View>

      <ThemedText style={styles.themeTitle}>
        着せ替え完了！
      </ThemedText>

      <ThemedText style={styles.themeText}>
        {themeName} に変更しました✨
      </ThemedText>

      <TouchableOpacity
        style={styles.themeButton}
        onPress={() => setThemeSuccessVisible(false)}
      >
        <ThemedText style={styles.themeButtonText}>
          OK
        </ThemedText>
      </TouchableOpacity>

    </View>
  </View>
</Modal>
          <View style={[styles.header, { backgroundColor: themeColors.cardBg, borderBottomColor: themeColors.border }]}>
            <View style={styles.userInfo}>
              <View style={styles.avatarWrapper}>
                <TouchableOpacity style={[styles.avatar, { backgroundColor: themeColors.innerBg }]} onPress={pickImage} activeOpacity={0.7}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                  ) : (
                    <MaterialCommunityIcons name="account-circle" size={48} color={themeColors.subText} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cameraIconBadge, { borderColor: themeColors.border }]} onPress={pickImage} activeOpacity={0.8}>
                  <Ionicons name="camera" size={14} color="#5B9E00" />
                </TouchableOpacity>
              </View>

              <View style={styles.userDetails}>
                {isProfileLoading ? (
                  <ActivityIndicator size="small" color="#5B9E00" style={styles.loaderLeft} />
                ) : (
                  <>
                    <ThemedText type="default" style={[styles.userName, { color: themeColors.text }]} numberOfLines={1}>
                      {userEmail}
                    </ThemedText>
                    <ThemedText type="default" style={[styles.userLocation, { color: themeColors.subText }]}>
                      📍 {userLocation}
                    </ThemedText>
                    <ThemedText type="default" style={[styles.userIntro, { color: themeColors.subText }]} numberOfLines={2}>
                      {userIntro}
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.profileBtn, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]} 
              activeOpacity={0.7}
              onPress={() => setEditProfileModalVisible(true)}
            >
              <ThemedText type="default" style={[styles.profileBtnText, { color: themeColors.text }]}>プロフィール設定</ThemedText>
            </TouchableOpacity>
          </View>

       
          <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
            <View style={styles.sectionTitle}>
              <ThemedText type="default" style={styles.sectionIcon}>💎</ThemedText>
              <ThemedText type="default" style={[styles.sectionLabel, { color: themeColors.text }]}>あなたのポイント</ThemedText>
            </View>
            <View style={styles.pointsInfo}>
              <ThemedText type="defaultSemiBold" style={[styles.pointsValue, { color: themeColors.text }]}>{points}/{maxPoints} Pt</ThemedText>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: themeColors.innerBg }]}>
                  <View style={[styles.progressFill, { width: `${pointsPercent}%` }]} />
                </View>
              </View>
              <ThemedText type="default" style={[styles.percentage, { color: themeColors.subText }]}>{Math.round(pointsPercent)}%</ThemedText>
            </View>
          </View>

         
          <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
            <View style={styles.sectionTitle}>
              <ThemedText type="default" style={styles.sectionIcon}>🎁</ThemedText>
              <ThemedText type="default" style={[styles.sectionLabel, { color: themeColors.text }]}>ポイントを使う</ThemedText>
            </View>

          
            <View style={[styles.expandableContainer, { backgroundColor: themeColors.innerBg }]}>
              <TouchableOpacity
                style={[styles.expandBtn, { backgroundColor: themeColors.innerBg }]}
                onPress={() => toggleSection('design')}
                activeOpacity={0.7}
              >
                <View style={styles.expandBtnContent}>
                  <ThemedText type="default" style={styles.sectionIcon}>🎨</ThemedText>
                  <View style={styles.expandBtnText}>
                    <ThemedText type="defaultSemiBold" style={[styles.expandBtnLabel, { color: themeColors.text }]}>デザインを変える</ThemedText>
                    <ThemedText type="default" style={[styles.expandBtnSubtext, { color: themeColors.subText }]}>アプリのデザインをカスタマイズできます</ThemedText>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSections.design ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={themeColors.subText}
                  />
                </View>
              </TouchableOpacity>

              {expandedSections.design && (
                <View style={[styles.expandedContent, { backgroundColor: themeColors.innerBg, borderTopColor: themeColors.border }]}>
                  {designModes.map((mode) => {
                    const isUnlocked = unlockedThemes.includes(mode.id) || mode.cost === 0;

const getThemePreviewStyle = (theme: ThemeType) => {
  switch (theme) {
    case "natural":
      return {
        backgroundColor: "#EAF5E5",
        borderColor: "#A6C56F",
      };

    case "cute":
      return {
        backgroundColor: "#FFF2F6",
        borderColor: "#F4A396",
      };

    case "night":
      return {
        backgroundColor: "#1F2430",
        borderColor: "#9288DA",
      };

    case "cafe":
      return {
        backgroundColor: "#F7EFE7",
        borderColor: "#B68B6A",
      };

    default:
      return {
        backgroundColor: "#FFFFFF",
        borderColor: "#DDD",
      };
  }
};


                    return (
                      <TouchableOpacity
                        key={mode.id}
                       style={[
    styles.designOption,
    getThemePreviewStyle(mode.id),
    selectedDesign === mode.id && styles.designOptionSelected,
]}
                        onPress={() => {
                          if (selectedDesign === mode.id) return;
                          if (isUnlocked) {
                            setTheme(mode.id);
                            setExpandedSections(prev => ({ ...prev, design: false }));
                          } else {
                            spendPoints(mode.cost, mode.id);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <ThemedText type="default" style={styles.designOptionIcon}>{mode.icon}</ThemedText>
<ThemedText
  type="default"
  style={[
    styles.designOptionName,
    {
      color: mode.id === "night" ? "#FFFFFF" : "#333333",
    },
  ]}
>
  {mode.name}
</ThemedText>
                        
                        {selectedDesign === mode.id ? (
                          <View style={styles.selectedBadge}>
                            <ThemedText type="default" style={styles.selectedBadgeText}>選択中</ThemedText>
                          </View>
                        ) : isUnlocked ? (
                          <ThemedText type="default" style={[styles.designOptionCost, { color: themeColors.subText }]}>着せ替える</ThemedText>
                        ) : (
                          <ThemedText type="default" style={[styles.designOptionCost, { color: themeColors.subText }]}>{mode.cost}P で交換</ThemedText>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

     
            <View style={[styles.expandableContainer, { backgroundColor: themeColors.innerBg }]}>
              <TouchableOpacity
                style={[styles.expandBtn, { backgroundColor: themeColors.innerBg }]}
                onPress={() => toggleSection('display')}
                activeOpacity={0.7}
              >
                <View style={styles.expandBtnContent}>
                  <ThemedText type="default" style={styles.sectionIcon}>⭐</ThemedText>
                  <View style={styles.expandBtnText}>
                    <ThemedText type="defaultSemiBold" style={[styles.expandBtnLabel, { color: themeColors.text }]}>出品を優先表示にする</ThemedText>
                    <ThemedText type="default" style={[styles.expandBtnSubtext, { color: themeColors.subText }]}></ThemedText>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSections.display ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={themeColors.subText}
                  />
                </View>
              </TouchableOpacity>

              {expandedSections.display && (
                <View style={[styles.expandedContent, { backgroundColor: themeColors.innerBg, borderTopColor: themeColors.border }]}>
                  <TouchableOpacity 
                    style={[styles.secondaryBtn, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]} 
                    activeOpacity={0.7}
                    onPress={() => boostItemToTopPage('DUMMY_ID')} 
                  >
                    <ThemedText type="defaultSemiBold" style={[styles.secondaryBtnText, { color: themeColors.text }]}>リユースページでは、5ポイントを使って出品を優先表示にすることができます。</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

     
          <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
            <View>
              <TouchableOpacity
                style={[styles.menuBtn, styles.menuBtnBorder, { borderBottomColor: themeColors.border }]}
                activeOpacity={0.6}
                onPress={() => toggleSection('about')}
              >
                <MaterialCommunityIcons name="information" size={20} color={themeColors.text} />
                <ThemedText type="default" style={[styles.menuLabel, { color: themeColors.text }]}>Gomifyについて</ThemedText>
                <MaterialCommunityIcons name={expandedSections.about ? 'chevron-up' : 'chevron-right'} size={16} color={themeColors.subText} />
              </TouchableOpacity>
              {expandedSections.about && (
                <View style={[styles.menuContent, { backgroundColor: themeColors.innerBg }]}>
                  <ThemedText type="defaultSemiBold" style={[styles.menuContentTitle, { color: themeColors.text }]}>Gomifyについて</ThemedText>
                  <ThemedText type="default" style={[styles.menuContentText, { color: themeColors.subText }]}>Gomify（ゴミファイ）は、一人暮らしを始めた方や、日本のゴミ分別に慣れていない方のためのアプリです。快適でエコな生活をサポートします。{"\n"}
                    主な機能：
ゴミカレンダー：ゴミ出しの日が一目で分かります。
スキャン機能：カメラで物をスキャンするだけで正しい捨て方を案内します。
{"\n"}検索機能：キーワードから簡単に分別方法を検索できます。
リユース：不要な物を写真で投稿し、近所のユーザーとチャットでやり取りできます。

私たちはリユースと自然環境を大切にしています。{"\n"}ぜひGomifyで楽しくエコな暮らしを始めましょう。</ThemedText>
                </View>
              )}
            </View>

            <View>
              <TouchableOpacity
                style={[styles.menuBtn, styles.menuBtnBorder, { borderBottomColor: themeColors.border }]}
                activeOpacity={0.6}
                onPress={() => setInquiryModalVisible(true)}
              >
                <MaterialCommunityIcons name="help-circle" size={20} color={themeColors.text} />
                <ThemedText type="default" style={[styles.menuLabel, { color: themeColors.text }]}>ヘルプ・お問合せ</ThemedText>
                <MaterialCommunityIcons name="chevron-right" size={16} color={themeColors.subText} />
              </TouchableOpacity>
            </View>

            <View>
              <TouchableOpacity
                style={[styles.menuBtn, styles.menuBtnBorder, { borderBottomColor: themeColors.border }]}
                activeOpacity={0.6}
                onPress={() => setReportModalVisible(true)}
              >
                <MaterialCommunityIcons name="flag" size={20} color={themeColors.text} />
                <ThemedText type="default" style={[styles.menuLabel, { color: themeColors.text }]}>問題を報告する</ThemedText>
                <MaterialCommunityIcons name="chevron-right" size={16} color={themeColors.subText} />
              </TouchableOpacity>
            </View>

            <View>
              <TouchableOpacity style={styles.menuBtn} activeOpacity={0.6} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={20} color="#D9383A" />
                <ThemedText type="default" style={[styles.menuLabel, { color: '#D9383A', fontWeight: '500' }]}>ログアウト</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* TAB BAR */}
        <View style={styles.tabBarContainer}>
          <View style={[styles.tabBarBackground, { backgroundColor: themeColors.tabBarBgColor }]} />
          <View style={styles.tabBarContent}>
            <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
              <View style={[styles.tabIconCircle, isHomeActive && styles.tabIconCircleActive]}>
                <Octicons name="home" size={24} color={isHomeActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor} />
              </View>
              <ThemedText style={[styles.tabLabel, { color: isHomeActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor }]}>ホーム</ThemedText>
            </Pressable>

            <Pressable style={styles.tabItem} onPress={() => router.push('/calendar')}>
              <View style={[styles.tabIconCircle, isCalendarActive && styles.tabIconCircleActive]}>
                <FontAwesome5 name="calendar-alt" size={22} color={isCalendarActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor} />
              </View>
              <ThemedText style={[styles.tabLabel, { color: isCalendarActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor }]}>ゴミカレンダー</ThemedText>
            </Pressable>

            <View style={styles.scanWrapper}>
              <Pressable style={[styles.scanButton, isScanActive && styles.tabIconCircleActive]} onPress={() => router.push('/scan')}>
                <Ionicons name="scan-outline" size={26} color={isScanActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor} />
              </Pressable>
              <ThemedText style={[styles.scanLabel, { color: isScanActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor }]}>ゴミスキャン</ThemedText>
            </View>

            <Pressable style={styles.tabItem} onPress={() => router.push('/reuse')}>
              <View style={[styles.tabIconCircle, isReuseActive && styles.tabIconCircleActive]}>
                <Ionicons name="refresh-circle-outline" size={26} color={isReuseActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor} />
              </View>
              <ThemedText style={[styles.tabLabel, { color: isReuseActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor }]}>リユース</ThemedText>
            </Pressable>

            <Pressable style={styles.myPageItem} onPress={() => router.push('/mypage')}>
              <View style={[styles.tabIconCircle, isMyPageActive && styles.tabIconCircleActiveMyPage]}>
                <Ionicons name="person" size={22} color={isMyPageActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor} />
              </View>
              <ThemedText style={[styles.tabLabel, { color: isMyPageActive ? themeColors.tabActiveColor : themeColors.tabInactiveColor }]}>マイページ</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

   
      <Modal transparent={true} visible={editProfileModalVisible} animationType="fade" onRequestClose={() => setEditProfileModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <ThemedText style={styles.modalTitle}>プロフィール設定</ThemedText>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.editFormScroll} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.inputLabel}>ニックネーム</ThemedText>
              <TextInput style={styles.textInput} value={editNickname} onChangeText={setEditNickname} placeholder="例: イさん" placeholderTextColor="#999" />
              <ThemedText style={styles.inputLabel}>都道府県</ThemedText>
              <TextInput style={styles.textInput} value={editPrefecture} onChangeText={setEditPrefecture} placeholder="例: 東京都" placeholderTextColor="#999" />
              <ThemedText style={styles.inputLabel}>市区町村</ThemedText>
              <TextInput style={styles.textInput} value={editCity} onChangeText={setEditCity} placeholder="例: 新宿区" placeholderTextColor="#999" />
              <ThemedText style={styles.inputLabel}>自己紹介</ThemedText>
              <TextInput style={[styles.textInput, styles.textArea]} value={editIntroText} onChangeText={setEditIntroText} placeholder="例: よろしくお願いします！" placeholderTextColor="#999" multiline numberOfLines={3} />
            </ScrollView>
            <TouchableOpacity style={[styles.modalButtonConfirm, styles.saveButton, isSavingProfile && { opacity: 0.7 }]} onPress={saveProfileData} disabled={isSavingProfile}>
              {isSavingProfile ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.modalButtonTextConfirm}>保存する</ThemedText>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

  
      <Modal transparent={true} visible={inquiryModalVisible} animationType="fade" onRequestClose={() => setInquiryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.supportModalContent}>
            <View style={styles.editModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="email-outline" size={22} color="#5B9E00" />
                <ThemedText style={styles.modalTitle}>ヘルプ・お問合せ</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setInquiryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.supportModalDescription}>
              ご不明な点やご要望がございましたら、下記にご記入の上送信してください。
            </ThemedText>
            <TextInput 
              style={styles.supportTextArea} 
              value={inquiryText} 
              onChangeText={setInquiryText} 
              placeholder="お問い合わせ内容をご記入ください。" 
              placeholderTextColor="#999" 
              multiline 
              numberOfLines={5} 
            />
            <TouchableOpacity 
              style={[styles.supportSubmitButton, isSubmittingTicket && { opacity: 0.7 }]} 
              onPress={() => handleSendTicket('inquiry', inquiryText)} 
              disabled={isSubmittingTicket}
              activeOpacity={0.8}
            >
              {isSubmittingTicket ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.supportSubmitButtonText}>送信する</ThemedText>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

     
      <Modal transparent={true} visible={reportModalVisible} animationType="fade" onRequestClose={() => setReportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.supportModalContent}>
            <View style={styles.editModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#D9383A" />
                <ThemedText style={styles.modalTitle}>問題を報告する</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.supportModalDescription}>
              アプリの不具合や問題点を見つけられた場合は、こちらから詳細をご報告ください。
            </ThemedText>
            <TextInput 
              style={styles.supportTextArea} 
              value={reportText} 
              onChangeText={setReportText} 
              placeholder="不具合や問題点をご報告ください。" 
              placeholderTextColor="#999" 
              multiline 
              numberOfLines={5} 
            />
            <TouchableOpacity 
              style={[styles.supportSubmitButton, { backgroundColor: '#D9383A', shadowColor: '#D9383A' }, isSubmittingTicket && { opacity: 0.7 }]} 
              onPress={() => handleSendTicket('report', reportText)} 
              disabled={isSubmittingTicket}
              activeOpacity={0.8}
            >
              {isSubmittingTicket ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.supportSubmitButtonText}>報告する</ThemedText>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={logoutModalVisible} animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconContainer}>
              <MaterialCommunityIcons name="logout" size={32} color="#D9383A" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.logoutModalTitle}>ログアウト</ThemedText>
            <ThemedText type="default" style={styles.logoutModalText}>本当にログアウトしてもよろしいですか？</ThemedText>
            
            <View style={styles.logoutButtonGroup}>
              <TouchableOpacity 
                style={styles.logoutButtonCancel} 
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <ThemedText type="defaultSemiBold" style={styles.logoutButtonTextCancel}>キャンセル</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutButtonConfirm} 
                onPress={executeSignOut}
                activeOpacity={0.7}
              >
                <ThemedText type="defaultSemiBold" style={styles.logoutButtonTextConfirm}>ログアウト</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}


const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 150 },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 0.5 },
  userInfo: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' },
  avatarWrapper: { position: 'relative', width: 56, height: 56 },
  avatar: { width: '100%', height: '100%', borderRadius: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
  cameraIconBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FFFFFF', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
  userDetails: { flex: 1, justifyContent: 'center' },
  userName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  userLocation: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  userIntro: { fontSize: 12, marginTop: 2 },
  loaderLeft: { alignSelf: 'flex-start', marginTop: 8 },
  profileBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 0.5, borderRadius: 8 },
  profileBtnText: { fontSize: 14, textAlign: 'center' },
  card: { marginHorizontal: 12, marginVertical: 12, borderRadius: 12, padding: 16, borderWidth: 0.5 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon: { fontSize: 18 },
  sectionLabel: { fontSize: 14, fontWeight: '500' },
  pointsInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsValue: { fontSize: 20 },
  progressContainer: { flex: 1 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4a90e2' },
  percentage: { fontSize: 12 },
  expandableContainer: { marginBottom: 8, borderRadius: 8, overflow: 'hidden' },
  expandBtn: { paddingVertical: 12, paddingHorizontal: 12 },
  expandBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandBtnText: { flex: 1 },
  expandBtnLabel: { fontSize: 14 },
  expandBtnSubtext: { fontSize: 12, marginTop: 2 },
  expandedContent: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 0.5 },
  designOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginTop: 8, borderWidth: 0.5 },
  designOptionSelected: { borderWidth: 2, borderColor: '#4a90e2' },
  designOptionIcon: { fontSize: 16, marginRight: 8 },
  designOptionName: { flex: 1, fontSize: 14 },
  designOptionCost: { fontSize: 12 },
  selectedBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, backgroundColor: '#e6f0fa' },
  selectedBadgeText: { color: '#4a90e2', fontSize: 12, fontWeight: 'bold' },
  displayText: { fontSize: 13, marginBottom: 8 },
  secondaryBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8, marginTop: 8 },
  secondaryBtnText: { fontSize: 13, textAlign: 'center', fontWeight: '400' },
  menuBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 12 },
  menuBtnBorder: { borderBottomWidth: 0.5 },
  menuLabel: { flex: 1, fontSize: 14 },
  menuContent: { paddingVertical: 12, paddingHorizontal: 0, marginTop: -8 },
  menuContentTitle: { fontSize: 13, marginBottom: 8, marginLeft: 10, fontWeight: '600' },
  menuContentText: { fontSize: 13, lineHeight: 20, margin: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center', alignItems: 'center', marginTop: -130 },
  modalContent: { width: 310, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333333' },
  modalText: { fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButtonGroup: { flexDirection: 'row', gap: 12, width: '100%' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalButtonCancel: { backgroundColor: '#FFFFFF', borderColor: '#E0E0E0' },
  modalButtonConfirm: { backgroundColor: '#5B9E00', borderColor: '#5B9E00' },
  modalButtonTextCancel: { fontSize: 14, color: '#666666', fontWeight: '500' },
  modalButtonTextConfirm: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  editModalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  editFormScroll: { flexGrow: 0, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  textInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#333' },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },


  themeModal: {
  width: 300,
  backgroundColor: "#fff",
  borderRadius: 24,
  padding: 25,
  alignItems: "center",
},

themeIcon: {
  marginBottom: 12,
},

themeTitle: {
  fontSize: 22,
  fontWeight: "700",
  color: "#333",
  marginBottom: 10,
},

themeText: {
  fontSize: 15,
  color: "#666",
  textAlign: "center",
  marginBottom: 22,
},

themeButton: {
  backgroundColor: "#5B9E00",
  paddingHorizontal: 45,
  paddingVertical: 13,
  borderRadius: 30,
},

themeButtonText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
},

  supportModalContent: { 
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 16, 
    elevation: 10 
  },
  supportModalDescription: { 
    fontSize: 13, 
    color: '#666666', 
    lineHeight: 18, 
    marginBottom: 16 
  },
  supportTextArea: { 
    height: 120, 
    textAlignVertical: 'top', 
    borderColor: '#E2E8F0', 
    borderWidth: 1,
    borderRadius: 10, 
    backgroundColor: '#FAFAFA', 
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 20
  },
  supportSubmitButton: { 
    backgroundColor: '#5B9E00', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#5B9E00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  supportSubmitButtonText: { 
    fontSize: 15, 
    color: '#FFFFFF', 
    fontWeight: '600' 
  },

  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 95,
    justifyContent: 'flex-end',
  },
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 1,
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 5,
    height: 95,
    zIndex: 2,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    height: 80,
    position: 'relative',
    paddingTop: 12,
  },
  myPageItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    height: 80,
    position: 'relative',
    paddingTop: 12,
  },
  scanWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    height: 80,
    position: 'relative',
    paddingTop: 12,
  },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transform: [{ translateY: 4 }],
  },
  tabIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transform: [{ translateY: 4 }],
  },
  tabIconCircleActiveMyPage: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    transform: [{ translateY: -22 }],
  },
  tabIconCircleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ translateY: -38 }],
  },
  tabLabel: {
    fontSize: 9,
    color: '#555',
    fontWeight: '600',
    textAlign: 'center',
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
  },
  scanLabel: {
    fontSize: 9,
    color: '#555',
    fontWeight: '700',
    textAlign: 'center',
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
  },
  scanBackgroundCircle: { display: 'none' },

  logoutModalContent: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  logoutIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 8,
  },
  logoutModalText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12, 
  },
  logoutButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D9383A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D9383A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonTextCancel: {
    fontSize: 15,
    color: '#4B5563',
  },
  logoutButtonTextConfirm: {
    fontSize: 15,
    color: '#FFFFFF',
  },
});