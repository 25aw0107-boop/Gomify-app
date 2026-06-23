import { ThemedText } from '@/components/themed-text';
import { AntDesign, FontAwesome5, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View, Image, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

// 🎯 修复：字段名必须为数据库中真正的 'id'
interface ReuseItem {
  id: string;
  title: string;
  images: any;
}

export default function DashboardScreen() {
  const router = useRouter();

  // 📦 商品列表的状态管理
  const [items, setItems] = useState<ReuseItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // 🔄 Supabase Live 数据拉取
  const fetchItems = async () => {
    try {
      setLoadingItems(true);

      // 🎯 修复：正式向数据库索要 'id' 字段
      const { data, error } = await supabase
        .from('items')
        .select('id, title, images')
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

  // 🖼️ 配列形式の images から最初の1枚のURLを安全に抽出するヘルパー関数
  const getFirstImageUrl = (images: any): string | null => {
    if (!images) return null;

    // 如果是标准数组
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }

    // 如果被转成了字符串格式
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch (e) {
        if (images.startsWith('http')) {
          return images;
        }
      }
    }
    return null;
  };

  return (
    <View style={styles.mainWrapper}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
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

        <View style={styles.contentBody}>
          <View style={styles.taskCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={44} color="#76C800" />
            </View>
            <View style={styles.taskTextContainer}>
              <ThemedText style={styles.taskTitle}>今日も分別できましたか？</ThemedText>
              <View style={styles.pointsContainer}>
                <ThemedText style={styles.pointsTextGreen}>ログインボーナス +1P</ThemedText>
                <ThemedText style={styles.pointsTextGreen}>ごみを分別して +1P</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.cardLeft}>
              <ThemedText style={styles.cardTitle}>燃えるゴミの日</ThemedText>
              <View style={styles.cardContentColumn}>
                <ThemedText style={styles.cardDateText}>明日5/16 (木)</ThemedText>
                <Ionicons name="flame" size={38} color="#EF4444" />
              </View>
            </View>

            <View style={styles.cardRight}>
              <View style={styles.cardHeaderRow}>
                <ThemedText style={styles.cardTitle}>ポイント</ThemedText>
                <Ionicons name="leaf" size={30} color="#76C800" />
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressCircle}>
                  <ThemedText style={styles.progressText}>30 P</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* 🎯 リユース品表示セクション */}
          <View style={styles.reuseContainer}>
            <View style={styles.reuseTitleRow}>
              <ThemedText style={styles.reuseSectionTitle}>リユース品を探す</ThemedText>
              <MaterialCommunityIcons name="sofa-outline" size={24} color="#000" />
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
                      key={item.id} // 🎯 修复点
                      style={styles.itemCard}
                      onPress={() => router.push(`/reuse/${item.id}`)} // 🎯 修复点
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

                      <View style={styles.heartIcon}>
                        <AntDesign name="heart" size={14} color="#ea9393" />
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
              <AntDesign name="plus" size={18} color="#000" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ボトムタブナビゲーション */}
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
  container: { flex: 1 },
  heroBackground: { width: '100%', height: 220, paddingTop: 60, paddingHorizontal: 24, justifyContent: 'space-between', paddingBottom: 40 },
  heroImageRadius: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, resizeMode: 'cover' },
  welcomeTextContainer: { marginTop: 20, flex: 1, justifyContent: 'center' },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#000', lineHeight: 32 },
  contentBody: { flex: 1, justifyContent: 'space-between', paddingBottom: 110 },
  taskCard: { backgroundColor: '#fff', borderRadius: 30, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginTop: -30, marginHorizontal: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  iconContainer: { marginRight: 12 },
  taskTextContainer: { flex: 1 },
  cardContentColumn: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 8 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  pointsContainer: { flexDirection: 'row', gap: 10 },
  pointsTextGreen: { fontSize: 12, color: '#76C800', fontWeight: '600' },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 24, gap: 14 },
  cardLeft: { flex: 1, height: 140, backgroundColor: '#fff', borderRadius: 24, padding: 17, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, justifyContent: 'flex-start' },
  cardRight: { flex: 1, height: 140, backgroundColor: '#fff', borderRadius: 24, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  cardDateText: { fontSize: 14, color: '#333', fontWeight: '500' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  progressContainer: { alignItems: 'center', justifyContent: 'center' },
  progressCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 5, borderColor: '#76C800', alignItems: 'center', justifyContent: 'center' },
  progressText: { fontSize: 20, fontWeight: 'bold', color: '#000' },

  reuseContainer: { backgroundColor: '#fff', paddingTop: 16, paddingBottom: 20, paddingHorizontal: 24 },
  reuseTitleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16 },
  reuseSectionTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  itemsScroll: { flexDirection: 'row', gap: 12, paddingBottom: 12 },

  itemCard: { width: 160, height: 130, backgroundColor: '#EAE8E0', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  fallbackImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#EAE8E0' },
  itemTitleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 8 },
  itemTitleText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  loaderContainer: { height: 130, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { height: 130, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },

  heartIcon: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 4 },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C4C4C4' },
  dotActive: { backgroundColor: '#555555' },
  listingButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginHorizontal: 12 },
  listingButtonText: { fontSize: 15, fontWeight: '600', color: '#000' },
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