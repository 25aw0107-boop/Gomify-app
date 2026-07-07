import { ThemedText } from '@/components/themed-text';
import { FontAwesome5, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, Platform, Modal, ActivityIndicator, TextInput, KeyboardAvoidingView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAppTheme, type ThemeType } from './tema/ThemeContext';

export default function MyPage() {
  const router = useRouter();
  const { selectedDesign, setTheme } = useAppTheme();

  // 🚪 状態控制：控制自定义 App 登出弹窗的显示/隐藏
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  
  // 📝 状态控制：编辑个人资料的弹窗
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 📩 状态控制：新增 お問合せ & 問題報告 弹窗与提交状态
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [inquiryText, setInquiryText] = useState('');
  const [reportText, setReportText] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // 👤 ✨ 新增：动态用户数据状态
  const [userEmail, setUserEmail] = useState('加载中...');
  const [userLocation, setUserLocation] = useState('未設定');
  const [userIntro, setUserIntro] = useState('よろしくお願いします！'); 
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // 📝 编辑表单的状态
  const [editNickname, setEditNickname] = useState('');
  const [editPrefecture, setEditPrefecture] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editIntroText, setEditIntroText] = useState('');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    design: false,
    display: false,
    about: false,
  });

  // Poäng synkas nu via Supabase
  const [points, setPoints] = useState(10);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const maxPoints = 30;
  const pointsPercent = (points / maxPoints) * 100;

  // 🌍 ✨ 核心：从 profiles 表全量抓取数据 (Inklusive poäng)
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
        .select('nickname, prefecture, city, intro, points')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.warn('读取 Profiles 数据库失败:', profileError.message);
      }

      if (profile && profile.points !== undefined) {
        setPoints(profile.points);
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
      console.error('获取用户信息失败:', err);
      setUserEmail('未ログイン');
      setUserLocation('未設定');
    } finally {
      setIsProfileLoading(false);
    }
  };

  // 🚀 Funktion för att boosta en vara till Top Page (Synkad med Supabase)
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

      const successMessage = 'トップページに优先表示するために5ポイントを使用しました。';
      
      if (Platform.OS === 'web') {
        alert(successMessage);
      } else {
        Alert.alert('成功', successMessage);
      }
      
      setExpandedSections(prev => ({ ...prev, display: false }));

    } catch (error) {
      console.error('Kunde inte boosta varan:', error);
      Alert.alert('エラー', 'エラーが発生しました。もう一度お試しください。');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      return () => { };
    }, [])
  );

  // 💾 保存个人资料
  const saveProfileData = async () => {
    setIsSavingProfile(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData || !authData.user) throw new Error('ユーザーが見つかりません');

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
      console.error('保存失败:', err);
      Alert.alert('エラー', 'プロフィールの更新に失敗しました。');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ✉️ 🚀 新增：将咨询或问题报告保存到 Supabase
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
        Alert.alert('送信完了', successMsg);
      }

      // Återställ fält och stäng modals
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
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('許可が必要', 'ギャラリーにアクセスする权限が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const designModes: Array<{ id: ThemeType; name: string; cost: number; icon: string }> = [
    { id: 'natural', name: 'ナチュラルモード', cost: 0, icon: '🎨' },
    { id: 'night', name: 'ナイトモード', cost: 5, icon: '🌙' },
    { id: 'cute', name: '可愛いモード', cost: 5, icon: '✨' },
    { id: 'cafe', name: 'カフェモード', cost: 5, icon: '☕' }
  ];

  // 🎨 テーマ変更とポイント消費の処理（修正版）
  const spendPoints = async (amount: number, designMode: ThemeType) => {
    // 💡 コストが0（ナチュラルモード）の場合は、DB更新を行わず即時切り替え
    if (amount === 0) {
      setTheme(designMode);
      setExpandedSections(prev => ({ ...prev, design: false }));
      if (Platform.OS === 'web') {
        alert(`ナチュラルモードに変更しました`);
      } else {
        Alert.alert('成功', `ナチュラルモードに変更しました`);
      }
      return;
    }

    if (points >= amount) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData || !authData.user) throw new Error('ユーザーが見つかりません');

        const newPoints = points - amount;

        const { error: dbError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', authData.user.id);

        if (dbError) throw dbError;

        setPoints(newPoints);
        setTheme(designMode);
        setExpandedSections(prev => ({ ...prev, design: false }));
        
        if (Platform.OS === 'web') {
          alert(`成功: テーマを変更しました`);
        } else {
          Alert.alert('成功', `テーマを変更しました`);
        }
      } catch (err) {
        console.error('Kunde inte uppdatera tema-poäng:', err);
        Alert.alert('エラー', '処理に失敗しました。もう一度お試しください。');
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
    <View style={styles.mainWrapper}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarWrapper}>
                <TouchableOpacity style={styles.avatar} onPress={pickImage} activeOpacity={0.7}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                  ) : (
                    <MaterialCommunityIcons name="account-circle" size={48} color="#999" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraIconBadge} onPress={pickImage} activeOpacity={0.8}>
                  <Ionicons name="camera" size={14} color="#5B9E00" />
                </TouchableOpacity>
              </View>

              <View style={styles.userDetails}>
                {isProfileLoading ? (
                  <ActivityIndicator size="small" color="#5B9E00" style={styles.loaderLeft} />
                ) : (
                  <>
                    <ThemedText type="default" style={styles.userName} numberOfLines={1}>
                      {userEmail}
                    </ThemedText>
                    <ThemedText type="default" style={styles.userLocation}>
                      📍 {userLocation}
                    </ThemedText>
                    <ThemedText type="default" style={styles.userIntro} numberOfLines={2}>
                      {userIntro}
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.profileBtn} 
              activeOpacity={0.7}
              onPress={() => setEditProfileModalVisible(true)}
            >
              <ThemedText type="default" style={styles.profileBtnText}>プロフィール設定</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Points Card */}
          <View style={styles.card}>
            <View style={styles.sectionTitle}>
              <ThemedText type="default" style={styles.sectionIcon}>💎</ThemedText>
              <ThemedText type="default" style={styles.sectionLabel}>あなたのポイント</ThemedText>
            </View>
            <View style={styles.pointsInfo}>
              <ThemedText type="defaultSemiBold" style={styles.pointsValue}>{points}/{maxPoints} Pt</ThemedText>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pointsPercent}%` }]} />
                </View>
              </View>
              <ThemedText type="default" style={styles.percentage}>{Math.round(pointsPercent)}%</ThemedText>
            </View>
          </View>

          {/* Use Points Card */}
          <View style={styles.card}>
            <View style={styles.sectionTitle}>
              <ThemedText type="default" style={styles.sectionIcon}>🎁</ThemedText>
              <ThemedText type="default" style={styles.sectionLabel}>ポイントを使う</ThemedText>
            </View>

            {/* Design Section */}
            <View style={styles.expandableContainer}>
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => toggleSection('design')}
                activeOpacity={0.7}
              >
                <View style={styles.expandBtnContent}>
                  <ThemedText type="default" style={styles.sectionIcon}>🎨</ThemedText>
                  <View style={styles.expandBtnText}>
                    <ThemedText type="defaultSemiBold" style={styles.expandBtnLabel}>デザインを変える</ThemedText>
                    <ThemedText type="default" style={styles.expandBtnSubtext}>アプリのデザインをカスタマイズできます</ThemedText>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSections.design ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </View>
              </TouchableOpacity>

              {expandedSections.design && (
                <View style={styles.expandedContent}>
                  {designModes.map((mode) => (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.designOption,
                        selectedDesign === mode.id && styles.designOptionSelected,
                      ]}
                      onPress={() => {
                        // 💡 条件文から points の判定を削除し、spendPoints 内でハンドリングするように修正
                        if (selectedDesign !== mode.id) {
                          spendPoints(mode.cost, mode.id);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <ThemedText type="default" style={styles.designOptionIcon}>{mode.icon}</ThemedText>
                      <ThemedText type="default" style={styles.designOptionName}>{mode.name}</ThemedText>
                      {selectedDesign === mode.id ? (
                        <View style={styles.selectedBadge}>
                          <ThemedText type="default" style={styles.selectedBadgeText}>選択中</ThemedText>
                        </View>
                      ) : mode.cost > 0 ? (
                        <ThemedText type="default" style={styles.designOptionCost}>{mode.cost}P で交換</ThemedText>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Display Section */}
            <View style={styles.expandableContainer}>
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => toggleSection('display')}
                activeOpacity={0.7}
              >
                <View style={styles.expandBtnContent}>
                  <ThemedText type="default" style={styles.sectionIcon}>⭐</ThemedText>
                  <View style={styles.expandBtnText}>
                    <ThemedText type="defaultSemiBold" style={styles.expandBtnLabel}>出品を優先表示にする</ThemedText>
                    <ThemedText type="default" style={styles.expandBtnSubtext}></ThemedText>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSections.display ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </View>
              </TouchableOpacity>

              {expandedSections.display && (
                <View style={styles.expandedContent}>
                  <TouchableOpacity 
                    style={styles.secondaryBtn} 
                    activeOpacity={0.7}
                    onPress={() => boostItemToTopPage('DUMMY_ID')} 
                  >
                    <ThemedText type="defaultSemiBold" style={styles.secondaryBtnText}>リユースページでは、5ポイントを使って出品を優先表示にすることができます。
      优先表示にすると、他のユーザーの一覧で上位に表示されるため、
      より多くの人に見つけてもらいやすくなります。</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Menu Card */}
          <View style={styles.card}>
            {/* Gomifyについて */}
            <View>
              <TouchableOpacity
                style={[styles.menuBtn, styles.menuBtnBorder]}
                activeOpacity={0.6}
                onPress={() => toggleSection('about')}
              >
                <MaterialCommunityIcons name="information" size={20} color="#333" />
                <ThemedText type="default" style={styles.menuLabel}>Gomifyについて</ThemedText>
                <MaterialCommunityIcons name={expandedSections.about ? 'chevron-up' : 'chevron-right'} size={16} color="#999" />
              </TouchableOpacity>
              {expandedSections.about && (
                <View style={styles.menuContent}>
                  <ThemedText type="defaultSemiBold" style={styles.menuContentTitle}>Gomifyについて</ThemedText>
                  <ThemedText type="default" style={styles.menuContentText}>Gomify（ゴミファイ）は、一人暮らしを始めたばかりの方或いは、日本にてゴミの分別法に困っている、ユーザーの皆さまが一番困っている「ゴミ出し」をサポートするアプリです。</ThemedText>
                </View>
              )}
            </View>

            {/* ヘルプ・お問合せ */}
            <View>
              <TouchableOpacity
                style={[styles.menuBtn, styles.menuBtnBorder]}
                activeOpacity={0.6}
                onPress={() => setInquiryModalVisible(true)}
              >
                <MaterialCommunityIcons name="help-circle" size={20} color="#333" />
                <ThemedText type="default" style={styles.menuLabel}>ヘルプ・お問合せ</ThemedText>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#999" />
              </TouchableOpacity>
            </View>

            {/* 問題を報告する */}
            <View>
              <TouchableOpacity
                style={[styles.menuBtn, styles.menuBtnBorder]}
                activeOpacity={0.6}
                onPress={() => setReportModalVisible(true)}
              >
                <MaterialCommunityIcons name="flag" size={20} color="#333" />
                <ThemedText type="default" style={styles.menuLabel}>問題を報告する</ThemedText>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#999" />
              </TouchableOpacity>
            </View>

            {/* ログアウト */}
            <View>
              <TouchableOpacity
                style={styles.menuBtn}
                activeOpacity={0.6}
                onPress={handleLogout}
              >
                <MaterialCommunityIcons name="logout" size={20} color="#D9383A" />
                <ThemedText type="default" style={[styles.menuLabel, { color: '#D9383A', fontWeight: '500' }]}>ログアウト</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* TabBar */}
        <View style={styles.tabBarContainer}>
          <View style={styles.scanBackgroundCircle} />
          <View style={styles.tabBarBackground} />
          <View style={styles.tabBarContent}>
            <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
              <Octicons name="home" size={24} color="#555" />
              <ThemedText style={styles.tabLabel}>ホーム</ThemedText>
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
              <Ionicons name="person-circle-outline" size={26} color="#5B9E00" />
              <ThemedText style={[styles.tabLabel, styles.tabLabelActive]}>マイページ</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 📝 Redigera Profil Modal */}
      <Modal
        transparent={true}
        visible={editProfileModalVisible}
        animationType="fade"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <ThemedText style={styles.modalTitle}>プロフィール設定</ThemedText>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editFormScroll} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.inputLabel}>ニックネーム</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editNickname}
                onChangeText={setEditNickname}
                placeholder="例: イさん"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.inputLabel}>都道府県</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editPrefecture}
                onChangeText={setEditPrefecture}
                placeholder="例: 東京都"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.inputLabel}>市区町村</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="例: 新宿区"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.inputLabel}>自己紹介</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editIntroText}
                onChangeText={setEditIntroText}
                placeholder="例: よろしくお願いします！"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalButtonConfirm, styles.saveButton, isSavingProfile && { opacity: 0.7 }]}
              onPress={saveProfileData}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.modalButtonTextConfirm}>保存する</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ✉️ お問合せ Modal */}
      <Modal
        transparent={true}
        visible={inquiryModalVisible}
        animationType="fade"
        onRequestClose={() => setInquiryModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <ThemedText style={styles.modalTitle}>ヘルプ・お問合せ</ThemedText>
              <TouchableOpacity onPress={() => setInquiryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.editFormScroll}>
              <ThemedText style={styles.menuContentText}>
                Gomifyのご利用でご不明な点や、ご質問がございましたら、以下のフォームよりお気軽にお問い合わせください。
              </ThemedText>
              <ThemedText style={styles.inputLabel}>お問い合わせ内容</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={inquiryText}
                onChangeText={setInquiryText}
                placeholder="質問や相談内容をご自由にご記入ください。"
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
              />
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalButtonConfirm, styles.saveButton, isSubmittingTicket && { opacity: 0.7 }]}
              onPress={() => handleSendTicket('inquiry', inquiryText)}
              disabled={isSubmittingTicket}
            >
              {isSubmittingTicket ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.modalButtonTextConfirm}>送信する</ThemedText>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🚩 問題を報告する Modal */}
      <Modal
        transparent={true}
        visible={reportModalVisible}
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <ThemedText style={styles.modalTitle}>問題を報告する</ThemedText>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.editFormScroll}>
              <ThemedText style={styles.menuContentText}>
                アプリの不具合、バグ、データの誤りなどを発見された場合は、大変お手数ですが詳細をご報告いただけますと幸いです。
              </ThemedText>
              <ThemedText style={styles.inputLabel}>問題の詳細・発生手順</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={reportText}
                onChangeText={setReportText}
                placeholder="どのような問題が発生したか、できるだけ詳しくご記入ください。"
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
              />
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalButtonConfirm, styles.saveButton, { backgroundColor: '#D9383A' }, isSubmittingTicket && { opacity: 0.7 }]}
              onPress={() => handleSendTicket('report', reportText)}
              disabled={isSubmittingTicket}
            >
              {isSubmittingTicket ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.modalButtonTextConfirm}>問題を報告する</ThemedText>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🚪 Logga ut Modal */}
      <Modal
        transparent={true}
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLogoutModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="logout" size={28} color="#D9383A" />
              <ThemedText style={styles.modalTitle}>ログアウト</ThemedText>
            </View>
            <ThemedText style={styles.modalText}>
              ログアウトしてもよろしいですか？
            </ThemedText>
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.modalButtonTextCancel}>いいえ</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: '#D9383A', borderColor: '#D9383A' }]}
                onPress={executeSignOut}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.modalButtonTextConfirm}>はい</ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

// ※ スタイルシート（styles）のコードは省略していませんので、既存のものをそのまま下に続けてください。
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 150 },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  userInfo: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' },
  avatarWrapper: { position: 'relative', width: 56, height: 56 },
  avatar: { width: '100%', height: '100%', borderRadius: 28, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
  cameraIconBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FFFFFF', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
  userDetails: { flex: 1, justifyContent: 'center' },
  userName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  userLocation: { fontSize: 13, color: '#666', fontWeight: '500', marginBottom: 2 },
  userIntro: { fontSize: 12, color: '#888', marginTop: 2 },
  loaderLeft: { alignSelf: 'flex-start', marginTop: 8 },
  profileBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 0.5, borderColor: '#d0d0d0', borderRadius: 8, backgroundColor: '#fff' },
  profileBtnText: { fontSize: 14, color: '#333', textAlign: 'center' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 12, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#e0e0e0' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon: { fontSize: 18 },
  sectionLabel: { fontSize: 14, fontWeight: '500', color: '#333' },
  pointsInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsValue: { fontSize: 20, color: '#333' },
  progressContainer: { flex: 1 },
  progressBar: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4a90e2' },
  percentage: { fontSize: 12, color: '#999' },
  expandableContainer: { marginBottom: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f5f5f5' },
  expandBtn: { paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  expandBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandBtnText: { flex: 1 },
  expandBtnLabel: { fontSize: 14, color: '#333' },
  expandBtnSubtext: { fontSize: 12, color: '#999', marginTop: 2 },
  expandedContent: { backgroundColor: '#f5f5f5', paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 0.5, borderTopColor: '#e0e0e0' },
  designOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 8, marginTop: 8, borderWidth: 0.5, borderColor: '#e0e0e0' },
  designOptionSelected: { borderWidth: 2, borderColor: '#4a90e2', backgroundColor: '#fff' },
  designOptionIcon: { fontSize: 16, marginRight: 8 },
  designOptionName: { flex: 1, fontSize: 14, color: '#333' },
  designOptionCost: { fontSize: 12, color: '#999' },
  selectedBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, backgroundColor: '#e6f0fa' },
  selectedBadgeText: { color: '#4a90e2', fontSize: 12, fontWeight: 'bold' },
  displayText: { fontSize: 13, color: '#666', marginBottom: 8 },
  secondaryBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#d0d0d0', borderRadius: 8, marginTop: 8 },
  secondaryBtnText: { fontSize: 13, color: '#333', textAlign: 'center' },
  menuBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 12 },
  menuBtnBorder: { borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  menuLabel: { flex: 1, fontSize: 14, color: '#333' },
  menuContent: { paddingVertical: 12, paddingHorizontal: 0, backgroundColor: '#f5f5f5', marginTop: -8 },
  menuContentTitle: { fontSize: 13, color: '#333', marginBottom: 8 },
  menuContentText: { fontSize: 13, color: '#666', lineHeight: 20 },
  tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end' },
  tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
  scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
  tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
  tabLabel: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  tabLabelActive: { color: '#5B9E00', fontWeight: 'bold' },
  scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
  scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 2 },
  scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' },
  
  // Modals gemensamma stilar
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center', alignItems: 'center' },
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

  // Redigera Profil Modal specifikt
  editModalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  editFormScroll: { flexGrow: 0, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  textInput: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#333' },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
});