import { ThemedText } from '@/components/themed-text';
import { FontAwesome5, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Stack, useFocusEffect } from 'expo-router'; // 💡 引入 useFocusEffect 确保返回时也能刷新
import React, { useState, useCallback } from 'react'; // 💡 引入 React 和 useCallback
import { Alert, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, Platform, Modal, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase'; // 🔐 引入 Supabase 客户端

export default function MyPage() {
  const router = useRouter();

  // 🚪 状态控制：控制自定义 App 登出弹窗的显示/隐藏
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // 👤 ✨ 新增：动态用户数据状态
  const [userEmail, setUserEmail] = useState('加载中...');
  const [userLocation, setUserLocation] = useState('未設定');
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    design: false,
    display: false,
    about: false,
    help: false,
    report: false,
    logout: false
  });

  const [selectedDesign, setSelectedDesign] = useState('natural');
  const [points, setPoints] = useState(10);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const maxPoints = 30;
  const pointsPercent = (points / maxPoints) * 100;

  // 🌍 ✨ 核心：从 profiles 表全量抓取用户名、省份、城市
  const fetchUserData = async () => {
    setIsProfileLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData || !authData.user) {
        throw authError || new Error('No user logged in');
      }

      const currentUser = authData.user;

      // 🎯 核心看这里：直接把 nickname 一起 select 出来！
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('nickname, prefecture, city')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.warn('读取 Profiles 数据库失败:', profileError.message);
      }

      // 🎯 名字渲染逻辑
      let finalDisplayName = '';
      if (profile && profile.nickname) {
        finalDisplayName = profile.nickname; // 👈 此时这里就会直接拿到 “イさん” 或 “何鑫”
      } else {
        finalDisplayName = currentUser.email ? currentUser.email.split('@')[0] : '名無しユーザー';
      }
      setUserEmail(finalDisplayName);

      // 🎯 位置渲染逻辑
      if (profile) {
        const pref = profile.prefecture || '';
        const city = profile.city || '';
        setUserLocation(`${pref} ${city}`.trim() || '未設定');
      } else {
        setUserLocation('未設定');
      }

    } catch (err) {
      console.error('获取用户信息失败:', err);
      setUserEmail('未ログイン');
      setUserLocation('未設定');
    } finally {
      setIsProfileLoading(false);
    }
  };
  // 🔄 使用 useFocusEffect 确保每次切换回“マイページ”时都会自动加载最新数据
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      return () => { };
    }, [])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const designModes = [
    { id: 'natural', name: 'ナチュラルモード', cost: 0, icon: '🎨' },
    { id: 'night', name: 'ナイトモード', cost: 5, icon: '🌙' },
    { id: 'cute', name: '可愛いモード', cost: 5, icon: '✨' },
    { id: 'cafe', name: 'カフェモード', cost: 5, icon: '☕' }
  ];

  const spendPoints = (amount: number, designMode: string) => {
    if (points >= amount) {
      setPoints(points - amount);
      setSelectedDesign(designMode);
      setExpandedSections(prev => ({ ...prev, design: false }));
      if (Platform.OS === 'web') {
        alert(`成功: ${designMode}に変更しました`);
      } else {
        Alert.alert('成功', `${designMode}に変更しました`);
      }
    } else {
      if (Platform.OS === 'web') {
        alert('ポイント不足: ポイントが足りません');
      } else {
        Alert.alert('ポイント不足', 'ポイントが足りません');
      }
    }
  };

  const menuItems = [
    {
      id: 'about',
      icon: 'information' as const,
      label: 'Gomifyについて',
      title: 'Gomifyについて',
      content: 'Gomify（ゴミファイ）は、一人暮らしを始めたばかりの方或いは、日本にてゴミの分別法に困っている、ユーザーの皆さまが一番困っている「ゴミ出し」をサポートするアプリです。'
    },
    {
      id: 'help',
      icon: 'help-circle' as const,
      label: 'ヘルプ・お問合せ',
      title: 'ヘルプ・お問合せ',
      content: 'Gomifyのご利用でご不明な点や、ご質問がございましたら、お気軽にお問い合わせください。'
    },
    {
      id: 'report',
      icon: 'flag' as const,
      label: '問題を報告する',
      title: '問題を報告する',
      content: 'Gomifyをご利用いただきありがとうございます。アプリの不具合、データの問題についてお報告ください。'
    },
    {
      id: 'logout',
      icon: 'logout' as const,
      label: 'ログアウト',
      title: 'ログアウト',
      content: 'ログアウトしますか？'
    }
  ];

  // 🔐 核心登出骨架
  const executeSignOut = async () => {
    setLogoutModalVisible(false); // 关闭弹窗
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    } finally {
      router.replace('/'); // 强切至首页
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // 🌐 Web 端激活自定义 App 样式弹窗
      setLogoutModalVisible(true);
    } else {
      // 📱 手机端依旧保持丝滑的原生震动弹窗
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

              {/* 👤 动态展示 Supabase 提取的用户注册账号与填写的具体位置 */}
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
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.profileBtn} activeOpacity={0.7}>
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
                        if (selectedDesign !== mode.id && points >= mode.cost) {
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
                    <ThemedText type="default" style={styles.expandBtnSubtext}>出品をもっと多くの人に見せできます</ThemedText>
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
                  <ThemedText type="default" style={styles.displayText}>5ポイント解放できます</ThemedText>
                  <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.7}>
                    <ThemedText type="defaultSemiBold" style={styles.secondaryBtnText}>この出品に5ポイント使う</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Menu Card */}
          <View style={styles.card}>
            {menuItems.map((item, idx) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={[
                    styles.menuBtn,
                    idx !== menuItems.length - 1 && styles.menuBtnBorder
                  ]}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (item.id === 'logout') {
                      handleLogout();
                    } else {
                      toggleSection(item.id);
                    }
                  }}
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color={item.id === 'logout' ? '#D9383A' : '#333'} />
                  <ThemedText type="default" style={[styles.menuLabel, item.id === 'logout' && { color: '#D9383A', fontWeight: '500' }]}>
                    {item.label}
                  </ThemedText>
                  {item.id !== 'logout' && (
                    <MaterialCommunityIcons
                      name={expandedSections[item.id] ? 'chevron-up' : 'chevron-right'}
                      size={16}
                      color="#999"
                    />
                  )}
                </TouchableOpacity>

                {item.id !== 'logout' && expandedSections[item.id] && (
                  <View style={styles.menuContent}>
                    <ThemedText type="defaultSemiBold" style={styles.menuContentTitle}>{item.title}</ThemedText>
                    <ThemedText type="default" style={styles.menuContentText}>{item.content}</ThemedText>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 自定义 TabBar 区域 */}
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

      {/* 自定义 App 级 Web 兼容登出弹窗 */}
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
                style={[styles.modalButton, styles.modalButtonConfirm]}
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

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 150,
  },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  userInfo: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' }, // 调整为居中更美观
  avatarWrapper: { position: 'relative', width: 56, height: 56 },
  avatar: { width: '100%', height: '100%', borderRadius: 28, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
  cameraIconBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FFFFFF', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
  userDetails: { flex: 1, justifyContent: 'center' },
  userName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  userLocation: { fontSize: 13, color: '#666', fontWeight: '500' },
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 310,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalButtonCancel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  modalButtonConfirm: {
    backgroundColor: '#D9383A',
    borderColor: '#D9383A',
  },
  modalButtonTextCancel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  modalButtonTextConfirm: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});