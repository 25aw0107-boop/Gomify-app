import { ThemedText } from '@/components/themed-text'; // ✨ Dashboard နဲ့ လမ်းကြောင်းတူအောင် ညှိလိုက်ပါတယ်
import { FontAwesome5, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function MyPage() {
  const router = useRouter();
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
  
  const maxPoints = 30;
  const pointsPercent = (points / maxPoints) * 100;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
      Alert.alert('成功', `${designMode}に変更しました`);
    } else {
      Alert.alert('ポイント不足', 'ポイントが足りません');
    }
  };

  const menuItems = [
    { 
      id: 'about', 
      icon: 'information', 
      label: 'Gomifyについて', 
      title: 'Gomifyについて', 
      content: 'Gomify（ゴミファイ）は、一人暮らしを始めたばかりの方や、日本にて交わるゴミの分別法に困っている、ユーザーの皆さまが一番困っている「ゴミ出し」をサポートするアプリです。' 
    },
    { 
      id: 'help', 
      icon: 'help-circle', 
      label: 'ヘルプ・お問合せ', 
      title: 'ヘルプ・お問合せ', 
      content: 'Gomifyのご利用でご不明な点や、ご質問がございましたら、お気軽にお問い合わせください。' 
    },
    { 
      id: 'report', 
      icon: 'flag', 
      label: '問題を報告する', 
      title: '問題を報告する', 
      content: 'Gomifyをご利用いただきありがとうございます。アプリの不具合、データの問題についてお報告ください。' 
    },
    { 
      id: 'logout', 
      icon: 'logout', 
      label: 'ログアウト', 
      title: 'ログアウト', 
      content: 'ログアウトしますか？' 
    }
  ];

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしてもよろしいですか？', [
      { text: 'キャンセル', onPress: () => {} },
      { text: 'ログアウト', onPress: () => router.push('/') }
    ]);
  };

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account-circle" size={48} color="#999" />
              </View>
              <View style={styles.userDetails}>
                <ThemedText type="default" style={styles.userName}>ユーザー名</ThemedText>
                <ThemedText type="default" style={styles.userLocation}>📍 東京都 渋谷区</ThemedText>
              </View>
            </View>
            <TouchableOpacity style={styles.profileBtn}>
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
                  <TouchableOpacity style={styles.secondaryBtn}>
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
                  onPress={() => {
                    if (item.id === 'logout') {
                      handleLogout();
                    } else {
                      toggleSection(item.id);
                    }
                  }}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={20} color="#333" />
                  <ThemedText type="default" style={styles.menuLabel}>{item.label}</ThemedText>
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

          {/* Spacer for bottom nav */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Tab Bar */}
        <View style={styles.tabBarContainer}>
          <View style={styles.scanBackgroundCircle} />
          <View style={styles.tabBarBackground} />
          
          <View style={styles.tabBarContent}>
            <Pressable style={styles.tabItem} onPress={() => router.push('/')}>
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

            <Pressable style={styles.tabItem} onPress={() => router.push('/modal')}>
              <MaterialCommunityIcons name="sofa-outline" size={26} color="#555" />
              <ThemedText style={styles.tabLabel}>リユース</ThemedText>
            </Pressable>

            <Pressable style={styles.tabItem} onPress={() => router.push('/mypage')}>
              <Ionicons name="person-circle-outline" size={26} color="#5B9E00" />
              <ThemedText style={[styles.tabLabel, styles.tabLabelActive]}>マイページ</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// Styles are kept identical to yours
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  userInfo: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 4 },
  userLocation: { fontSize: 13, color: '#999' },
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
  menuBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 0, gap: 12 },
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
});