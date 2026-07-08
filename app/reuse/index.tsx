import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, FlatList, Pressable, Image, ActivityIndicator, Modal, RefreshControl, Animated, Dimensions } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialIcons, Octicons, Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';

type TabType = 'discover' | 'favorites' | 'listings' | 'messages';
type ModalMode = 'delete_listing' | 'delete_chatroom';
type FilterType = 'ward' | 'category' | null;

type ChatRoomListItem = {
    id: string;
    itemId: string;
    itemTitle: string;
    itemImage: string | null;
    partnerName: string;
    lastMessage: string;
    lastTime: string;
    unreadCount: number;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 📌 固定配置项
const WARD_OPTIONS = ['千代田区', '中央区', '港区', '新宿区', '文京区', '台东区', '墨田区', '江东区', '品川区', '目黑区', '大田区', '世田谷区', '涩谷区', '中野区', '杉并区', '丰岛区', '北区', '荒川区', '板桥区', '练马区', '足立区', '葛饰区', '江户川区'];
const CATEGORY_OPTIONS = ['家具', '衣物', '漫画图书', 'その他'];

export default function ReuseScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('discover');

    const [isFirstLoading, setIsFirstLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- 🎛️ 筛选状态管理 ---
    const [selectedWard, setSelectedWard] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [currentFilterMenu, setCurrentFilterMenu] = useState<FilterType>(null);

    // --- 🎬 精准定制动画状态 ---
    const overlayOpacity = useRef(new Animated.Value(0)).current; // 背景渐变
    const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current; // 菜单滑出

    // --- 🎛️ ポップアップ（モーダル）状態管理 ---
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('delete_listing');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedTitle, setSelectedTitle] = useState('');

    const [discoverItems, setDiscoverItems] = useState<any[]>([]);
    const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
    const [myListings, setMyListings] = useState<any[]>([]);
    const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [messageItems, setMessageItems] = useState<ChatRoomListItem[]>([]);
    const [globalUnreadCount, setGlobalUnreadCount] = useState<number>(0);

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // --- 🎬 打开筛选菜单动画 ---
    const openFilterMenu = (type: FilterType) => {
        setCurrentFilterMenu(type);
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(sheetTranslateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    };

    // --- 🎬 关闭筛选菜单动画 ---
    const closeFilterMenu = () => {
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(sheetTranslateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start(() => {
            setCurrentFilterMenu(null);
        });
    };

    // --- 🌍 計算：全バッジのグローバル未読メッセージ数 ---
    const checkGlobalUnreadCount = async (userId: string) => {
        try {
            const { count, error } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .neq('sender_id', userId)
                .eq('is_read', false);

            if (!error && count !== null) {
                setGlobalUnreadCount(count);
            }
        } catch (err) {
            console.error('グローバル未読数の取得に失敗しました:', err);
        }
    };

    // --- 🌍 チャット一覧データの読み込み ---
    const loadRealMessageData = async (userId: string) => {
        try {
            const { data: roomsData, error: roomErr } = await supabase
                .from('chat_rooms')
                .select(`
                    id, buyer_id, seller_id, item_id,
                    items!inner ( title, images )
                `)
                .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

            if (roomErr) throw roomErr;

            if (roomsData) {
                const formatted: ChatRoomListItem[] = await Promise.all(
                    roomsData.map(async (room: any) => {
                        const targetUserId = room.buyer_id === userId ? room.seller_id : room.buyer_id;

                        let partnerName = 'ユーザー';
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('nickname')
                            .eq('id', targetUserId)
                            .maybeSingle();
                        if (profile?.nickname) partnerName = profile.nickname;

                        const { data: lastMsgData } = await supabase
                            .from('chat_messages')
                            .select('text, created_at')
                            .eq('room_id', room.id)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        let displayMessage = 'まだメッセージはありません';
                        if (lastMsgData) {
                            if (lastMsgData.text && lastMsgData.text.includes('chat_attachments')) {
                                displayMessage = '[画像]';
                            } else {
                                displayMessage = lastMsgData.text;
                            }
                        }

                        const { count: unreadCountResult } = await supabase
                            .from('chat_messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('room_id', room.id)
                            .neq('sender_id', userId)
                            .eq('is_read', false);

                        return {
                            id: room.id,
                            itemId: room.item_id,
                            itemTitle: room.items?.title || '無題の商品',
                            itemImage: room.items?.images && room.items.images.length > 0 ? room.items.images[0] : null,
                            partnerName,
                            lastMessage: displayMessage,
                            lastTime: lastMsgData ? formatTime(lastMsgData.created_at) : '',
                            unreadCount: unreadCountResult || 0
                        };
                    })
                );

                formatted.sort((a, b) => b.lastTime.localeCompare(a.lastTime));
                setMessageItems(formatted);

                const totalUnread = formatted.reduce((sum, item) => sum + item.unreadCount, 0);
                setGlobalUnreadCount(totalUnread);
            }
        } catch (err) {
            console.error('【メッセージ読み込みエラー】:', err);
        }
    };

    // --- 🌍 データ更新センター ---
    const fetchAllData = async (showGlobalLoader = false) => {
        if (showGlobalLoader) setIsFirstLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUserId(user.id);

            await checkGlobalUnreadCount(user.id);

            const { data: favRecords } = await supabase
                .from('favorites')
                .select('item_id')
                .eq('user_id', user.id);
            const favIdSet = new Set<string>((favRecords || []).map(f => f.item_id));
            setFavoritedIds(favIdSet);

            if (activeTab === 'discover') {
                let query = supabase
                    .from('items')
                    .select('*')
                    .not('user_id', 'eq', user.id)
                    .eq('status', 'available');

                if (selectedWard) {
                    query = query.eq('ward', selectedWard);
                }
                if (selectedCategory) {
                    query = query.eq('category', selectedCategory);
                }

                const { data } = await query
                    .order('priority', { ascending: false })
                    .order('created_at', { ascending: false });

                if (data) setDiscoverItems(data);

            } else if (activeTab === 'favorites') {
                const { data } = await supabase
                    .from('items')
                    .select('*, favorites!inner(*)')
                    .eq('favorites.user_id', user.id)
                    .eq('status', 'available')
                    .order('created_at', { ascending: false });
                if (data) setFavoriteItems(data);

            } else if (activeTab === 'listings') {
                // 出品中列表：拉取该用户的所有物品（包含已上架与已锁定的状态）
                const { data } = await supabase
                    .from('items')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (data) setMyListings(data);

            } else if (activeTab === 'messages') {
                await loadRealMessageData(user.id);
            }
        } catch (error: any) {
            console.error('データの同期に失敗しました:', error);
        } finally {
            setIsFirstLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            let isFocused = true;
            if (isFocused) {
                if (activeTab === 'messages') {
                    fetchAllData(false);
                } else {
                    const hasNoData =
                        (activeTab === 'discover' && discoverItems.length === 0) ||
                        (activeTab === 'favorites' && favoriteItems.length === 0) ||
                        (activeTab === 'listings' && myListings.length === 0);

                    fetchAllData(hasNoData);
                }
            }
            return () => { isFocused = false; };
        }, [activeTab])
    );

    useEffect(() => {
        if (activeTab === 'discover') {
            fetchAllData(false);
        }
    }, [selectedWard, selectedCategory]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchAllData(false);
    };

    const toggleLike = async (itemId: string) => {
        if (!currentUserId) return;
        const isCurrentlyLiked = favoritedIds.has(itemId);
        const nextIds = new Set(favoritedIds);
        if (isCurrentlyLiked) {
            nextIds.delete(itemId);
            if (activeTab === 'favorites') setFavoriteItems(prev => prev.filter(item => item.id !== itemId));
        } else {
            nextIds.add(itemId);
        }
        setFavoritedIds(nextIds);
        try {
            if (isCurrentlyLiked) {
                await supabase.from('favorites').delete().eq('user_id', currentUserId).eq('item_id', itemId);
            } else {
                await supabase.from('favorites').insert({ user_id: currentUserId, item_id: itemId });
            }
        } catch (err) {
            console.error('お気に入り登録エラー:', err);
            fetchAllData(false);
        }
    };

    const openDeleteModal = (id: string, title: string, mode: ModalMode) => {
        setSelectedId(id);
        setSelectedTitle(title);
        setModalMode(mode);
        setIsModalVisible(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedId) return;
        setIsModalVisible(false);

        try {
            if (modalMode === 'delete_listing') {
                const { error } = await supabase.from('items').delete().eq('id', selectedId);
                if (error) throw error;
                setMyListings(prev => prev.filter(item => item.id !== selectedId));
            } else if (modalMode === 'delete_chatroom') {
                const { error: msgDeleteError } = await supabase
                    .from('chat_messages')
                    .delete()
                    .eq('room_id', selectedId);

                if (msgDeleteError) throw msgDeleteError;

                const { error: roomDeleteError } = await supabase
                    .from('chat_rooms')
                    .delete()
                    .eq('id', selectedId);

                if (roomDeleteError) throw roomDeleteError;

                setMessageItems(prev => prev.filter(room => room.id !== selectedId));
                if (currentUserId) await checkGlobalUnreadCount(currentUserId);
            }
        } catch (error: any) {
            console.error('【データ削除エラー】詳細は:', error.message || error);
            alert('削除に失敗しました。');
            if (currentUserId) fetchAllData(false);
        } finally {
            setSelectedId(null);
            setSelectedTitle('');
        }
    };

    const getFilteredData = () => {
        switch (activeTab) {
            case 'discover': return discoverItems;
            case 'favorites': return favoriteItems;
            case 'listings': return myListings;
            case 'messages': return messageItems;
            default: return [];
        }
    };

    // --- 🎨 修改后的商品渲染卡片逻辑 ---
    const renderProductItem = ({ item }: { item: any }) => {
        const isMyRealListing = activeTab === 'listings';
        const hasImage = item.images && item.images.length > 0;
        const imageUrl = hasImage ? item.images[0] : null;
        const itemId = item.id;
        const itemTitle = item.title || '無題の商品';
        const isItemLiked = activeTab === 'favorites' ? true : favoritedIds.has(itemId);

        // ✨ 判断物品是否已被锁定 (状态不为 available 视为锁定/预约中)
        const isLocked = item.status !== 'available';

        return (
            <Pressable style={styles.itemCard} onPress={() => router.push(`/reuse/${itemId}`)}>
                <View style={styles.imageContainer}>
                    {hasImage ? (
                        <Image source={{ uri: imageUrl }} style={styles.productImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}><FontAwesome5 name="box" size={32} color="#aaa" /></View>
                    )}

                    {/* ✨ UI 变更 1：如果物品在“出品中”被锁定，图片上方添加锁定的半透明模糊效果层 */}
                    {isMyRealListing && isLocked && (
                        <View style={styles.lockedImageOverlay}>
                            <Ionicons name="lock-closed" size={20} color="#FFF" />
                            <ThemedText style={styles.lockedOverlayText}>キープ中</ThemedText>
                        </View>
                    )}
                </View>
                <View style={styles.itemInfo}>
                    {/* ✨ UI 变更 2：标题部分。如果是锁定商品，前面增加一个优雅的橙色小标签 */}
                    <View style={styles.titleRow}>
                        {isMyRealListing && isLocked && (
                            <View style={styles.lockedLabelBadge}>
                                <ThemedText style={styles.lockedLabelText}>キープ中</ThemedText>
                            </View>
                        )}
                        <ThemedText style={styles.itemTitle} numberOfLines={1}>{itemTitle}</ThemedText>
                    </View>

                    <ThemedText style={styles.itemDetail}>状態：{item.quality || '未設定'}</ThemedText>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={12} color="#5B9E00" />
                        <ThemedText style={styles.itemWardText}>{item.ward || '未知区域'}</ThemedText>
                        <ThemedText style={styles.itemStationText}> ({item.station || '駅未指定'})</ThemedText>
                    </View>
                </View>
                {!isMyRealListing ? (
                    <Pressable style={styles.rightHeartButton} onPress={() => toggleLike(itemId)}>
                        <Ionicons name={isItemLiked ? "heart" : "heart-outline"} size={26} color={isItemLiked ? "#FFB1B1" : "#C2C2C2"} />
                    </Pressable>
                ) : (
                    <Pressable style={[styles.rightDeleteButton]} onPress={() => openDeleteModal(itemId, itemTitle, 'delete_listing')}>
                        <Feather name="trash-2" size={22} color="#FF4D4F" />
                    </Pressable>
                )}
            </Pressable>
        );
    };

    const renderMessageItem = ({ item }: { item: ChatRoomListItem }) => (
        <View style={styles.messageCardWrapper}>
            <Pressable
                style={styles.messageCard}
                onPress={() => router.push({
                    pathname: `/messages/${item.id}`,
                    params: { itemId: item.itemId }
                })}
            >
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarInnerCircle}>
                        <Ionicons name="person" size={24} color="#A0AEC0" />
                    </View>
                    {item.unreadCount > 0 && <View style={styles.miniDotBadge} />}
                </View>

                <View style={styles.messageContent}>
                    <View style={styles.messageUpperRow}>
                        <ThemedText style={styles.messageUserName} numberOfLines={1}>{item.partnerName}</ThemedText>
                        <ThemedText style={styles.messageTime}>{item.lastTime}</ThemedText>
                    </View>
                    <ThemedText style={[styles.messageText, item.unreadCount > 0 && styles.unreadMessageText]} numberOfLines={1}>
                        {item.lastMessage}
                    </ThemedText>
                </View>

                <View style={styles.messageRightActionSection}>
                    <View style={styles.messageMiniItemImageWrapper}>
                        {item.itemImage ? (
                            <Image source={{ uri: item.itemImage }} style={styles.messageMiniItemImage} />
                        ) : (
                            <FontAwesome5 name="box" size={12} color="#CBD5E0" />
                        )}
                    </View>

                    <Pressable
                        style={styles.inlineRoomDeleteButton}
                        onPress={() => openDeleteModal(item.id, item.partnerName, 'delete_chatroom')}
                        hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                    >
                        <Feather name="trash-2" size={15} color="#FF4D4F" />
                    </Pressable>
                </View>
            </Pressable>
        </View>
    );

    return (
        <View style={styles.mainWrapper}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* 上部タブバー */}
            <View style={styles.topTabBar}>
                {(['discover', 'favorites', 'listings', 'messages'] as TabType[]).map((tab) => {
                    const icons: Record<TabType, any> = {
                        discover: 'search',
                        favorites: 'heart',
                        listings: 'assignment',
                        messages: 'chatbox-ellipses'
                    };
                    const labels: Record<TabType, string> = {
                        discover: '発見',
                        favorites: '気に入り',
                        listings: '出品中',
                        messages: 'メッセージ'
                    };
                    const isMessage = tab === 'messages';
                    const isListings = tab === 'listings';

                    return (
                        <Pressable
                            key={tab}
                            style={[styles.tabItemTop, activeTab === tab && styles.tabItemActiveTop]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <View style={styles.badgeWrapper}>
                                {isListings ? (
                                    <MaterialIcons name="assignment" size={24} color="#000" />
                                ) : (
                                    <Ionicons name={icons[tab]} size={24} color="#000" />
                                )}
                                {isMessage && globalUnreadCount > 0 && (
                                    <View style={styles.badge}><ThemedText style={styles.badgeText}>{globalUnreadCount}</ThemedText></View>
                                )}
                            </View>
                            <ThemedText style={styles.tabLabelTop}>{labels[tab]}</ThemedText>
                        </Pressable>
                    );
                })}
            </View>

            {/* ✨ 两个优雅的高清筛选控制按钮面板 (仅在“发现”大厅展示) */}
            {activeTab === 'discover' && (
                <View style={styles.filterControlRow}>
                    <Pressable
                        style={[styles.filterMenuButton, selectedWard !== null && styles.filterMenuButtonActive]}
                        onPress={() => openFilterMenu('ward')}
                    >
                        <ThemedText style={[styles.filterMenuButtonText, selectedWard !== null && styles.filterMenuButtonTextActive]}>
                            {selectedWard || 'エリア（地域）'}
                        </ThemedText>
                        <Ionicons name="chevron-down" size={14} color={selectedWard ? "#FFF" : "#666"} />
                    </Pressable>

                    <Pressable
                        style={[styles.filterMenuButton, selectedCategory !== null && styles.filterMenuButtonActive]}
                        onPress={() => openFilterMenu('category')}
                    >
                        <ThemedText style={[styles.filterMenuButtonText, selectedCategory !== null && styles.filterMenuButtonTextActive]}>
                            {selectedCategory || 'カテゴリ'}
                        </ThemedText>
                        <Ionicons name="chevron-down" size={14} color={selectedCategory ? "#FFF" : "#666"} />
                    </Pressable>
                </View>
            )}

            {/* ✨ 过滤激活状态的便捷胶囊指示条 */}
            {activeTab === 'discover' && (selectedWard || selectedCategory) && (
                <View style={styles.activeFilterPillsRow}>
                    {selectedWard && (
                        <View style={styles.filterActivePill}>
                            <ThemedText style={styles.filterActivePillText}>{selectedWard}</ThemedText>
                            <Pressable onPress={() => setSelectedWard(null)} style={styles.pillCloseTouch}>
                                <Ionicons name="close-circle" size={16} color="#5B9E00" />
                            </Pressable>
                        </View>
                    )}
                    {selectedCategory && (
                        <View style={styles.filterActivePill}>
                            <ThemedText style={styles.filterActivePillText}>{selectedCategory}</ThemedText>
                            <Pressable onPress={() => setSelectedCategory(null)} style={styles.pillCloseTouch}>
                                <Ionicons name="close-circle" size={16} color="#5B9E00" />
                            </Pressable>
                        </View>
                    )}
                </View>
            )}

            {isFirstLoading ? (
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color="#5B9E00" />
                </View>
            ) : (
                <FlatList
                    data={getFilteredData()}
                    renderItem={activeTab === 'messages' ? renderMessageItem : renderProductItem}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#5B9E00']} tintColor="#5B9E00" />
                    }
                    ListHeaderComponent={
                        activeTab === 'messages' ? (
                            <View style={styles.messageHeaderTitleRow}>
                                <ThemedText style={styles.messageTitleText}>メッセージ</ThemedText>
                                {globalUnreadCount > 0 && (
                                    <View style={styles.messageCountBadge}><ThemedText style={styles.messageCountBadgeText}>{globalUnreadCount}</ThemedText></View>
                                )}
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="file-tray-outline" size={48} color="#999" />
                            <ThemedText style={styles.emptyText}>
                                {activeTab === 'discover' && '条件に一致する商品はありません'}
                                {activeTab === 'favorites' && 'お気に入りに登録された商品はありません'}
                                {activeTab === 'listings' && '現在出品中の商品はありません'}
                                {activeTab === 'messages' && 'メッセージはまだありません'}
                            </ThemedText>
                        </View>
                    }
                />
            )}

            {activeTab !== 'messages' && (
                <Pressable style={styles.centerListingButton} onPress={() => router.push('/reuse/create')}>
                    <MaterialIcons name="add" size={20} color="#444" />
                    <ThemedText style={styles.centerListingButtonText}>出品する</ThemedText>
                </Pressable>
            )}

            {/* ボトムタブバー */}
            <View style={styles.tabBarContainer}>
                <View style={styles.scanBackgroundCircle} />
                <View style={styles.tabBarBackground} />
                <View style={styles.tabBarContent}>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}><Octicons name="home" size={24} color="#555" /><ThemedText style={styles.tabLabelBottom}>ホーム</ThemedText></Pressable>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}><FontAwesome5 name="calendar-alt" size={22} color="#555" /><ThemedText style={styles.tabLabelBottom}>ゴミカレンダー</ThemedText></Pressable>
                    <View style={styles.scanWrapper}><Pressable style={styles.scanButton} onPress={() => router.push('/scan')}><Ionicons name="scan-outline" size={26} color="#555" /></Pressable><ThemedText style={styles.scanLabel}>ゴミスキャン</ThemedText></View>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse')}><Ionicons name="refresh-circle" size={26} color="#5B9E00" /><ThemedText style={[styles.tabLabelBottom, styles.tabLabelBottomActive]}>リユース</ThemedText></Pressable>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/mypage')}><Ionicons name="person" size={22} color="#555" /><ThemedText style={styles.tabLabelBottom}>マイページ</ThemedText></Pressable>
                </View>
            </View>

            {/* ✨ 完全定制化高级滑出菜单（完美修复背景渐变 + 菜单滑出动画） */}
            {currentFilterMenu !== null && (
                <View style={[StyleSheet.absoluteFillObject, styles.filterModalContainer]}>
                    {/* 1. 半透明黑色渐变背景层 */}
                    <Animated.View
                        style={[styles.filterOverlay, { opacity: overlayOpacity }]}
                    >
                        <Pressable style={styles.flexTouchClose} onPress={closeFilterMenu} />
                    </Animated.View>

                    {/* 2. 纯白质感从下往上平滑推入层 */}
                    <Animated.View
                        style={[
                            styles.filterBottomSheet,
                            { transform: [{ translateY: sheetTranslateY }] }
                        ]}
                    >
                        <View style={styles.sheetIndicatorBar} />
                        <View style={styles.sheetHeaderRow}>
                            <ThemedText style={styles.sheetTitleText}>
                                {currentFilterMenu === 'ward' ? 'エリア（地域）で絞り込む' : 'カテゴリで絞り込む'}
                            </ThemedText>
                            <Pressable onPress={closeFilterMenu} style={styles.sheetCloseButtonTouch}>
                                <Ionicons name="close" size={22} color="#999" />
                            </Pressable>
                        </View>

                        {/* 数据选项网格列表 */}
                        <FlatList
                            data={currentFilterMenu === 'ward' ? WARD_OPTIONS : CATEGORY_OPTIONS}
                            keyExtractor={(item) => item}
                            numColumns={currentFilterMenu === 'ward' ? 3 : 2}
                            columnWrapperStyle={styles.sheetGridRow}
                            contentContainerStyle={styles.sheetListContent}
                            renderItem={({ item }) => {
                                const isSelected = currentFilterMenu === 'ward' ? selectedWard === item : selectedCategory === item;
                                return (
                                    <Pressable
                                        style={[styles.gridCapsule, isSelected && styles.gridCapsuleActive]}
                                        onPress={() => {
                                            if (currentFilterMenu === 'ward') {
                                                setSelectedWard(isSelected ? null : item);
                                            } else {
                                                setSelectedCategory(isSelected ? null : item);
                                            }
                                            closeFilterMenu();
                                        }}
                                    >
                                        <ThemedText style={[styles.gridCapsuleText, isSelected && styles.gridCapsuleTextActive]} numberOfLines={1}>
                                            {item}
                                        </ThemedText>
                                    </Pressable>
                                );
                            }}
                        />
                    </Animated.View>
                </View>
            )}

            {/* 警告モーダルポップアップ */}
            <Modal transparent={true} visible={isModalVisible} animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconCircle}><Feather name="alert-triangle" size={28} color="#FF4D4F" /></View>
                        <ThemedText style={styles.modalTitle}>
                            {modalMode === 'delete_listing' ? '出品の削除' : 'チャットの削除'}
                        </ThemedText>
                        <ThemedText style={styles.modalDescription}>
                            {modalMode === 'delete_listing'
                                ? `「${selectedTitle}」の出品を取り消しますか？\nこの操作は取り消せません。`
                                : `「${selectedTitle}」さんとのチャット履歴を削除しますか？\nこの操作は取り消せません。`
                            }
                        </ThemedText>
                        <View style={styles.modalButtonRow}>
                            <Pressable style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setIsModalVisible(false)}><ThemedText style={styles.modalCancelButtonText}>キャンセル</ThemedText></Pressable>
                            <Pressable style={[styles.modalButton, styles.modalDeleteButton]} onPress={handleConfirmDelete}><ThemedText style={styles.modalDeleteButtonText}>削除する</ThemedText></Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// styles 保持原样不变...

const styles = StyleSheet.create({
    // 以下为追加的锁定状态专用高质感 UI 样式
    lockedImageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    lockedOverlayText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    lockedLabelBadge: {
        backgroundColor: '#FFEFE5',
        borderColor: '#FF7A22',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    lockedLabelText: {
        color: '#FF7A22',
        fontSize: 10,
        fontWeight: '600',
    },
    mainWrapper: { flex: 1, backgroundColor: '#F4F5F7' },
    topTabBar: { flexDirection: 'row', backgroundColor: '#D6E4D0', paddingTop: 50, paddingBottom: 10, justifyContent: 'space-around', alignItems: 'center' },
    tabItemTop: { alignItems: 'center', paddingVertical: 6, width: '22%', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabItemActiveTop: { borderBottomColor: '#000000' },
    tabLabelTop: { fontSize: 12, fontWeight: 'bold', color: '#000', marginTop: 4 },
    badgeWrapper: { position: 'relative' },
    badge: { position: 'absolute', top: -4, right: -8, backgroundColor: '#FF3B30', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    // ✨ 高清精致筛选样式
    filterControlRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 12 },
    filterMenuButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
    filterMenuButtonActive: { backgroundColor: '#5B9E00', borderColor: '#5B9E00' },
    filterMenuButtonText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
    filterMenuButtonTextActive: { color: '#FFFFFF' },

    activeFilterPillsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 4, flexWrap: 'wrap', gap: 8, marginTop: 4 },
    filterActivePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF8FF', borderColor: '#BEE3F8', borderWidth: 1, paddingLeft: 12, paddingRight: 6, paddingVertical: 4, borderRadius: 14, gap: 4 },
    filterActivePillText: { fontSize: 12, fontWeight: '600', color: '#2B6CB0' },
    pillCloseTouch: { padding: 2 },

    listContainer: { padding: 16, paddingBottom: 180 },
    itemCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    imageContainer: { position: 'relative' },
    imagePlaceholder: { width: 100, height: 100, backgroundColor: '#EAE6DF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    productImage: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#EAE6DF' },
    itemInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6 },
    itemDetail: { fontSize: 13, color: '#718096', marginBottom: 4 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    itemWardText: { fontSize: 13, fontWeight: '600', color: '#5B9E00', marginLeft: 3 },
    itemStationText: { fontSize: 12, color: '#A0AEC0' },

    rightHeartButton: { padding: 12 },
    rightDeleteButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, marginRight: 4 },
    centerListingButton: { position: 'absolute', bottom: 115, left: 16, right: 16, zIndex: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(235, 233, 222, 0.95)', paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: '#DDD' },
    centerListingButtonText: { fontSize: 15, fontWeight: 'bold', color: '#444', marginLeft: 6 },
    messageHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
    messageTitleText: { fontSize: 28, fontWeight: 'bold' },
    messageCountBadge: { backgroundColor: '#FF3B30', borderRadius: 12, paddingHorizontal: 8, marginLeft: 10 },
    messageCountBadgeText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

    messageCardWrapper: { marginBottom: 12, width: '100%' },
    messageCard: { backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    avatarContainer: { position: 'relative', width: 50, height: 50 },
    avatarInnerCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EDF2F7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    miniDotBadge: { position: 'absolute', top: 0, right: 0, width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#FFF' },
    messageContent: { flex: 1, marginLeft: 14, marginRight: 10, justifyContent: 'center' },
    messageUpperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
    messageUserName: { fontSize: 16, fontWeight: '700', color: '#2D3748', flex: 1, marginRight: 8 },
    messageTime: { fontSize: 11, color: '#A0AEC0', fontWeight: '500' },
    messageText: { fontSize: 13, color: '#718096', lineHeight: 18 },
    unreadMessageText: { fontWeight: '700', color: '#1A202C' },

    messageRightActionSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    messageMiniItemImageWrapper: { width: 44, height: 44, backgroundColor: '#F7FAFC', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
    messageMiniItemImage: { width: 44, height: 44 },
    inlineRoomDeleteButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginLeft: 12, borderWidth: 0.5, borderColor: '#FED7D7' },

    tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end' },
    tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
    scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
    tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
    tabItemBottom: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
    tabLabelBottom: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
    tabLabelBottomActive: { color: '#5B9E00', fontWeight: 'bold' },
    scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
    scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyText: { marginTop: 12, fontSize: 14, color: '#999' },

    // ✨ 高清自定义滑出面板底层系统
    filterModalContainer: { ...StyleSheet.absoluteFillObject, zIndex: 99999, justifyContent: 'flex-end' },
    filterOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    flexTouchClose: { flex: 1 },
    filterBottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_HEIGHT * 0.65, minHeight: SCREEN_HEIGHT * 0.4, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 20 },
    sheetIndicatorBar: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, borderBottomWidth: 0.5, borderColor: '#EDF2F7' },
    sheetTitleText: { fontSize: 16, fontWeight: '700', color: '#1A202C' },
    sheetCloseButtonTouch: { padding: 4 },
    sheetListContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
    sheetGridRow: { justifyContent: 'flex-start', gap: 10, marginBottom: 12 },
    gridCapsule: { flex: 1, backgroundColor: '#F7FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 20, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
    gridCapsuleActive: { backgroundColor: '#5B9E00', borderColor: '#5B9E00' },
    gridCapsuleText: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
    gridCapsuleTextActive: { color: '#FFFFFF', fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { width: '80%', maxWidth: 320, backgroundColor: '#FFFFFF', borderRadius: 24, paddingTop: 28, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center' },
    modalIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF2F0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 10, textAlign: 'center' },
    modalDescription: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    modalButtonRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    modalButton: { flex: 1, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginHorizontal: 6 },
    modalCancelButton: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA' },
    modalCancelButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
    modalDeleteButton: { backgroundColor: '#FF4D4F' },
    modalDeleteButtonText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
});