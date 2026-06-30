import { ThemedText } from '@/components/themed-text';
import { AntDesign, FontAwesome5, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View, Image, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';

// 动态计算屏幕宽高，确保正方形卡片和整体页面严丝合缝
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cardSize = (screenWidth - 20 * 2 - 14) / 2;

interface ReuseItem {
  id: string;
  title: string;
  images: any;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ReuseItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('items')
        .select('id, title, images, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('リユース品データの取得に失敗しました:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
      return () => { };
    }, [])
  );

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

  return (
    <View style={styles.mainWrapper}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 🎯 核心改动 1：去掉外层 ScrollView，换成全屏居中/两端对齐的 View */}
      <View style={styles.fullScreenContainer}>

        {/* 顶部绿色背景 Banner */}
        <ImageBackground
          source={require('@/assets/images/Rectangle 8.png')}
          style={styles.heroBackground}
          imageStyle={styles.heroImageRadius}
        >
          <View style={styles.welcomeTextContainer}>
            <ThemedText type="default" style={styles.welcomeText}>
              {"こんにちは\n今日もエコ１日を！"}
            </ThemedText>
          </View>
        </ImageBackground>

        {/* 1. 今日も分別できましたか カ片 */}
        <View style={styles.taskCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={40} color="#76C800" />
          </View>
          <View style={styles.taskTextContainer}>
            <ThemedText style={styles.taskTitle}>今日も分別できましたか？</ThemedText>
            <View style={styles.pointsContainer}>
              <ThemedText style={styles.pointsTextGreen}>ログインボーナス +1P</ThemedText>
              <ThemedText style={styles.pointsTextGreen}>ごみを分別して +1P</ThemedText>
            </View>
          </View>
        </View>

        {/* 2. 左右正方形双卡片区域 */}
        <View style={styles.gridContainer}>
          <View style={styles.cardSquare}>
            <ThemedText style={styles.cardTitleSquare}>燃えるゴミの日</ThemedText>
            <ThemedText style={styles.cardDateText}>明日5/16 (木)</ThemedText>
            <Ionicons name="flame" size={34} color="#EF4444" style={styles.gridIcon} />
          </View>

          <View style={styles.cardSquare}>
            <ThemedText style={styles.cardTitleSquareText}>ポイント</ThemedText>
            <View style={styles.progressCircle}>
              <ThemedText style={styles.progressText}>30 P</ThemedText>
            </View>
            <Ionicons name="leaf" size={16} color="#76C800" style={styles.leafIconAbsolute} />
          </View>
        </View>

        {/* 3. リユース品表示セクション */}
        <View style={styles.reuseContainer}>
          <View style={styles.reuseTitleRow}>
            <ThemedText style={styles.reuseSectionTitle}>リユース品を探す</ThemedText>
            <MaterialCommunityIcons name="sofa-outline" size={22} color="#000" />
          </View>

          {loadingItems ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#5B9E00" />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>出品された商品はまだありません</ThemedText>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemsScroll}
            >
              {items.map((item) => {
                const imageUrl = getFirstImageUrl(item.images);
                return (
                  <Pressable
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => router.push(`/reuse/${item.id}`)}
                  >
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.fallbackImagePlaceholder}>
                        <MaterialCommunityIcons name="image-off" size={32} color="#999" />
                      </View>
                    )}

                    <View style={styles.itemTitleOverlay}>
                      <ThemedText style={styles.itemTitleText} numberOfLines={1}>
                        {item.title}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.paginationRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Pressable style={styles.listingButton} onPress={() => router.push('/reuse/create')}>
            <ThemedText style={styles.listingButtonText}>使わないものを出品する</ThemedText>
            <AntDesign name="plus" size={16} color="#000" />
          </Pressable>
        </View>
      </View>

      {/* 固定底部导航 */}
      <View style={styles.tabBarContainer}>
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

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F5F5F5' },

  // 🎯 核心改动 2：利用 justify-content 分配空间，并剔除超出屏幕的边距，配合固定比例完美贴合
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'space-between', // 让元素之间根据剩余屏幕自动分配最完美的间距
    paddingBottom: 110, // 精准避让 TabBar 的高度，防止内容沉入底部栏
  },

  // 通过比率适配高度，防止在短屏幕上压缩过大
  heroBackground: { width: '100%', height: 230, paddingTop: 55, },
  heroImageRadius: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, resizeMode: 'cover' },
  welcomeTextContainer: { marginTop: 12 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#000', lineHeight: 32 },

  // 今日打卡卡片
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -75, // 覆叠在 Hero 边缘
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3
  },
  iconContainer: { marginRight: 12 },
  taskTextContainer: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  pointsContainer: { flexDirection: 'row', gap: 10 },
  pointsTextGreen: { fontSize: 11, color: '#76C800', fontWeight: '600' },

  // 左右并排正方形区域
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    gap: 14
  },
  cardSquare: {
    width: cardSize,
    height: cardSize,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative'
  },
  cardTitleSquare: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  cardTitleSquareText: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  cardDateText: { fontSize: 12, color: '#555', fontWeight: '500', marginBottom: 4 },
  gridIcon: { marginTop: 2 },

  progressCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: '#76C800', alignItems: 'center', justifyContent: 'center' },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  leafIconAbsolute: { position: 'absolute', top: 14, right: 14 },

  // 下方商品画廊自适应卡片
  reuseContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    marginHorizontal: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  reuseTitleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 14 },
  reuseSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },

  itemsScroll: { gap: 14, paddingBottom: 2 },
  // 调整画廊图片尺寸为 130x130 正方形，确保和上方完美对齐、且不撑开屏幕
  itemCard: { width: 130, height: 130, backgroundColor: '#F0EFEA', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  fallbackImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#EAE8E0' },
  itemTitleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 6, paddingHorizontal: 8 },
  itemTitleText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  loaderContainer: { height: 130, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { height: 130, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },

  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E0E0E0' },
  dotActive: { backgroundColor: '#76C800', width: 12 },

  listingButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECECEC', borderRadius: 100, paddingVertical: 12, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  listingButtonText: { fontSize: 14, fontWeight: '600', color: '#000' },

  // TabBar 保持底层固定
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