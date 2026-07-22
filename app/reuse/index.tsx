import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, FlatList, Pressable, Image, ActivityIndicator, Modal, RefreshControl, Animated, Dimensions } from 'react-native';
import { useRouter, Stack, useFocusEffect, usePathname } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialIcons, Octicons, Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '../tema/ThemeContext';

type TabType = 'discover' | 'favorites' | 'listings' | 'messages';
type ModalMode = 'delete_listing' | 'delete_chatroom';
type FilterType = 'ward' | 'category' | null;

type ItemType = {
    id: string;
    title: string;
    images: string[] | null;
    quality?: string;
    ward?: string;
    station?: string;
    status: string;
    user_id: string;
    category?: string;
    priority?: boolean | number | null; 
};

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

const WARD_OPTIONS = ['千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区'];
const CATEGORY_OPTIONS = ['家具', '衣類', '漫画・本', 'その他'];

const ProductRow = React.memo(({ item, activeTab, isNight, cardBgColor, borderColor, textColor, subTextColor, tabActiveColor, toggleLike, openDeleteModal, onPress }: any) => {
    const isMyRealListing = activeTab === 'listings';
    const hasImage = item.images && item.images.length > 0 && item.images[0].startsWith('http');
    const imageUrl = hasImage ? item.images![0] : null;

    return (
        <Pressable style={[styles.itemCard, { backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }]} onPress={onPress}>
            <View style={styles.imageContainer}>
                {hasImage && imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: isNight ? '#2A3442' : '#F0F0F0' }]}><FontAwesome5 name="box" size={32} color={subTextColor} /></View>
                )}
            </View>
            <View style={styles.itemInfo}>
                <View style={styles.titleRow}>
                    <ThemedText style={[styles.itemTitleText, { color: textColor }]} numberOfLines={1}>
                        {item.title || '無題の商品'}
                    </ThemedText>
                    
                    {/* STRÄNGT VILLKOR: Visas BARA om priority är exakt true eller 1 */}
                    {(item.priority === true || item.priority === 1) ? (
                        <View style={styles.priorityTag}>
                            <ThemedText style={styles.priorityTagText}>優先</ThemedText>
                        </View>
                    ) : null}
                </View>
                
                <ThemedText style={[styles.itemDetail, { color: subTextColor }]}>状態：{item.quality || '未設定'}</ThemedText>
                <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={12} color={tabActiveColor} />
                    <ThemedText style={[styles.itemWardText, { color: textColor }]}>{item.ward || '未知区域'}</ThemedText>
                    <ThemedText style={[styles.itemStationText, { color: subTextColor }]}> ({item.station || '駅未指定'})</ThemedText>
                </View>
            </View>
            {!isMyRealListing ? (
                <Pressable style={styles.rightHeartButton} onPress={() => toggleLike(item.id)}>
                    <Ionicons name={activeTab === 'favorites' ? "heart" : "heart-outline"} size={26} color={activeTab === 'favorites' ? "#FFB1B1" : subTextColor} />
                </Pressable>
            ) : (
                <Pressable style={styles.rightDeleteButton} onPress={() => openDeleteModal(item.id, item.title || '無題の商品', 'delete_listing')}>
                    <Feather name="trash-2" size={22} color="#FF4D4F" />
                </Pressable>
            )}
        </Pressable>
    );
});

const MessageRow = React.memo(({ item, isNight, cardBgColor, borderColor, textColor, subTextColor, tabActiveColor, openDeleteModal, onPress }: any) => {
    const hasImg = item.itemImage && item.itemImage.startsWith('http');
    return (
        <View style={styles.messageCardWrapper}>
            <Pressable style={[styles.messageCard, { backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }]} onPress={onPress}>
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatarInnerCircle, { backgroundColor: isNight ? '#2A3442' : '#E2E8F0' }]}>
                        <Ionicons name="person" size={24} color={subTextColor} />
                    </View>
                    {item.unreadCount > 0 && <View style={[styles.miniDotBadge, { backgroundColor: tabActiveColor }]} />}
                </View>

                <View style={styles.messageContent}>
                    <View style={styles.messageUpperRow}>
                        <ThemedText style={[styles.messageUserName, { color: textColor }]} numberOfLines={1}>{item.partnerName}</ThemedText>
                        <ThemedText style={[styles.messageTime, { color: subTextColor }]}>{item.lastTime}</ThemedText>
                    </View>
                    <ThemedText style={[styles.messageText, { color: subTextColor }, item.unreadCount > 0 && { color: tabActiveColor, fontWeight: 'bold' }]} numberOfLines={1}>
                        {item.lastMessage}
                    </ThemedText>
                </View>

                <View style={styles.messageRightActionSection}>
                    <View style={[styles.messageMiniItemImageWrapper, { backgroundColor: isNight ? '#2A3442' : '#EDF2F7' }]}>
                        {hasImg ? <Image source={{ uri: item.itemImage! }} style={styles.messageMiniItemImage} /> : <FontAwesome5 name="box" size={12} color={subTextColor} />}
                    </View>
                    <Pressable style={styles.inlineRoomDeleteButton} onPress={() => openDeleteModal(item.id, item.partnerName, 'delete_chatroom')} hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}>
                        <Feather name="trash-2" size={15} color="#FF4D4F" />
                    </Pressable>
                </View>
            </Pressable>
        </View>
    );
});

export default function ReuseScreen() {
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<TabType>('discover');

    const { selectedDesign } = useAppTheme();
    const isKawaii = selectedDesign === 'cute';
    const isNight = selectedDesign === 'night';
    const isCafe = selectedDesign === 'cafe';

    const cafeTextColor = '#4A3B32'; 
    const cafeAccentColor = '#8fa288'; 
    const cafeBackgroundColor = '#F9F6F0';
  
    const kawaiiTextColor = '#6B4E3C';
    const kawaiiAccentColor = '#A4C3A2';
    const kawaiiBackgroundColor = '#FCF5F0';
    const kawaiiPeachPink = '#F4A396';

    const nightPurple = '#9288da';
    const nightgreen = '#A6C56F';

    const mainBackgroundColor = isNight ? '#000000' : isKawaii ? kawaiiBackgroundColor : isCafe ? cafeBackgroundColor : '#F4F5F7';
    const cardBgColor = isNight ? '#1C2432' : isKawaii ? '#FCF6EA' : isCafe ? '#FFFDF9' : '#FFFFFF';
    const textColor = isNight ? '#FFFFFF' : isKawaii ? kawaiiTextColor : isCafe ? cafeTextColor : '#333333';
    const subTextColor = isNight ? '#E6E19D' : isKawaii ? '#8B5F65' : isCafe ? '#7A6B58' : '#666666';
    
const borderColor =
  isNight
    ? '#9288DA'      // Night
    : isKawaii
      ? '#fad5c2'    // Cute
      : isCafe
        ? '#C9A97E'  // Cafe
        : '#E0E0E0'; // Normal

    const tabBarBgColor = isNight ? '#1C2432' : isKawaii ? '#E6F0E3' : isCafe ? '#F2EBE3' : '#D1E0C5';
    const tabActiveColor = isNight ? nightgreen : isKawaii ? kawaiiPeachPink : isCafe ? cafeAccentColor :  '#5B9E00';
    const tabInactiveColor = isNight ? '#7A8B9E' : isKawaii ? kawaiiPeachPink : isCafe ? '#B8A89A' : '#555555';
    
    const isHomeActive = pathname === '/dashboard';
    const isCalendarActive = pathname === '/calendar';
    const isScanActive = pathname === '/scan';
    const isReuseActive = pathname.startsWith('/reuse');
    const isMyPageActive = pathname === '/mypage';

    const [isFirstLoading, setIsFirstLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [selectedWard, setSelectedWard] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [currentFilterMenu, setCurrentFilterMenu] = useState<FilterType>(null);

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('delete_listing');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedTitle, setSelectedTitle] = useState('');

    const [discoverItems, setDiscoverItems] = useState<ItemType[]>([]);
    const [favoriteItems, setFavoriteItems] = useState<ItemType[]>([]);
    const [myListings, setMyListings] = useState<ItemType[]>([]);
    const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [messageItems, setMessageItems] = useState<ChatRoomListItem[]>([]);
    const [globalUnreadCount, setGlobalUnreadCount] = useState<number>(0);

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const openFilterMenu = (type: FilterType) => {
        setCurrentFilterMenu(type);
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(sheetTranslateY, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start();
    };

    const closeFilterMenu = () => {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(sheetTranslateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true })
        ]).start(() => { setCurrentFilterMenu(null); });
    };

    const checkGlobalUnreadCount = async (userId: string) => {
        try {
            const { count, error } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .neq('sender_id', userId)
                .eq('is_read', false);

            if (!error && count !== null) setGlobalUnreadCount(count);
        } catch (err) {
            console.error('グローバル未読数の取得に失敗しました:', err);
        }
    };

    const loadRealMessageData = async (userId: string) => {
        try {
            const { data: roomsData, error: roomErr } = await supabase
                .from('chat_rooms')
                .select(`id, buyer_id, seller_id, item_id, items ( title, images )`)
                .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

            if (roomErr) throw roomErr;

            if (roomsData) {
                const formatted: ChatRoomListItem[] = await Promise.all(
                    roomsData.map(async (room: any) => {
                        const targetUserId = room.buyer_id === userId ? room.seller_id : room.buyer_id;
                        let partnerName = 'ユーザー';
                        const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', targetUserId).maybeSingle();
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
                            displayMessage = (lastMsgData.text && lastMsgData.text.includes('chat_attachments')) ? '[画像]' : lastMsgData.text;
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
                setGlobalUnreadCount(formatted.reduce((sum, item) => sum + item.unreadCount, 0));
            }
        } catch (err) {
            console.error('【メッセージ読み込みエラー】:', err);
        }
    };

    const fetchAllData = useCallback(async (showGlobalLoader = false) => {
        if (showGlobalLoader) setIsFirstLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUserId(user.id);
            await checkGlobalUnreadCount(user.id);

            const { data: favRecords } = await supabase.from('favorites').select('item_id').eq('user_id', user.id);
            setFavoritedIds(new Set<string>((favRecords || []).map(f => f.item_id)));

            if (activeTab === 'discover') {
                const { data } = await supabase.from('items').select('*').not('user_id', 'eq', user.id).eq('status', 'available').order('priority', { ascending: false }).order('created_at', { ascending: false });
                if (data) setDiscoverItems(data);
            } else if (activeTab === 'favorites') {
                const { data } = await supabase.from('items').select('*, favorites!inner(*)').eq('favorites.user_id', user.id).eq('status', 'available').order('created_at', { ascending: false });
                if (data) setFavoriteItems(data);
            } else if (activeTab === 'listings') {
                const { data } = await supabase.from('items').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
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
    }, [activeTab]);

    useEffect(() => {
        fetchAllData(false); 
    }, [activeTab, fetchAllData]);

    useFocusEffect(
        useCallback(() => {
            fetchAllData(true);
        }, [fetchAllData])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchAllData(false);
    };

    const toggleLike = useCallback(async (itemId: string) => {
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
    }, [currentUserId, favoritedIds, activeTab]);

    const openDeleteModal = useCallback((id: string, title: string, mode: ModalMode) => {
        setSelectedId(id);
        setSelectedTitle(title);
        setModalMode(mode);
        setIsModalVisible(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!selectedId) return;
        setIsModalVisible(false);
        try {
            if (modalMode === 'delete_listing') {
                const { error } = await supabase.from('items').delete().eq('id', selectedId);
                if (error) throw error;
                setMyListings(prev => prev.filter(item => item.id !== selectedId));
            } else if (modalMode === 'delete_chatroom') {
                await supabase.from('chat_messages').delete().eq('room_id', selectedId);
                await supabase.from('chat_rooms').delete().eq('id', selectedId);
                setMessageItems(prev => prev.filter(room => room.id !== selectedId));
                if (currentUserId) await checkGlobalUnreadCount(currentUserId);
            }
        } catch (error: any) {
            alert('削除に失敗しました。');
        } finally {
            setSelectedId(null);
            setSelectedTitle('');
        }
    };

    const filteredData = useMemo(() => {
        switch (activeTab) {
            case 'discover': {
                let items = discoverItems;
                if (selectedWard) items = items.filter(item => item.ward === selectedWard);
                if (selectedCategory) items = items.filter(item => item.category === selectedCategory);
                return items;
            }
            case 'favorites': return favoriteItems;
            case 'listings': return myListings;
            default: return [];
        }
    }, [activeTab, discoverItems, favoriteItems, myListings, selectedWard, selectedCategory]);

    const renderListItem = useCallback(({ item }: { item: any }) => {
        if (activeTab === 'messages') {
            return (
                <MessageRow 
                    item={item}
                    isNight={isNight}
                    cardBgColor={cardBgColor}
                    borderColor={borderColor}
                    textColor={textColor}
                    subTextColor={subTextColor}
                    tabActiveColor={tabActiveColor}
                    openDeleteModal={openDeleteModal}
                    onPress={() => router.push(`/messages/${item.id}`)} 
                />
            );
        }

        return (
            <ProductRow 
                item={item}
                activeTab={activeTab}
                isNight={isNight}
                cardBgColor={cardBgColor}
                borderColor={borderColor}
                textColor={textColor}
                subTextColor={subTextColor}
                tabActiveColor={tabActiveColor}
                toggleLike={toggleLike}
                openDeleteModal={openDeleteModal}
                onPress={() => router.push(`/reuse/${item.id}`)}
            />
        );
    }, [activeTab, isNight, cardBgColor, borderColor, textColor, subTextColor, tabActiveColor, toggleLike, openDeleteModal, router]);

    return (
        <View style={[styles.mainWrapper, { backgroundColor: mainBackgroundColor }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.topTabBar, { backgroundColor: isNight ? '#1C2432' : isKawaii ? '#E6F0E3' : isCafe ? '#F2EBE3' : '#D6E4D0', borderBottomWidth: isNight ? 1 : 0, borderBottomColor: borderColor }]}>
                {(['discover', 'favorites', 'listings', 'messages'] as TabType[]).map((tab) => {
                    const icons: Record<TabType, any> = { discover: 'search', favorites: 'heart', listings: 'assignment', messages: 'chatbox-ellipses' };
                    const labels: Record<TabType, string> = { discover: '発見', favorites: '気に入り', listings: '出品中', messages: 'メッセージ' };
                    const isSelected = activeTab === tab;
                    const tabColor = isSelected ? tabActiveColor : tabInactiveColor;

                    return (
                        <Pressable key={tab} style={[styles.tabItemTop, isSelected && { borderBottomColor: tabActiveColor, borderBottomWidth: 2 }]} onPress={() => setActiveTab(tab)}>
                            <View style={styles.badgeWrapper}>
                                {tab === 'listings' ? <MaterialIcons name="assignment" size={24} color={tabColor} /> : <Ionicons name={icons[tab]} size={24} color={tabColor} />}
                                {tab === 'messages' && globalUnreadCount > 0 && (
                                    <View style={[styles.badge, { backgroundColor: tabActiveColor }]}><ThemedText style={styles.badgeText}>{globalUnreadCount}</ThemedText></View>
                                )}
                            </View>
                            <ThemedText style={[styles.tabLabelTop, { color: tabColor, fontWeight: isSelected ? '700' : '500' }]}>{labels[tab]}</ThemedText>
                        </Pressable>
                    );
                })}
            </View>

            {activeTab === 'discover' && (
                <View style={styles.filterControlRow}>
                    <Pressable style={[styles.filterMenuButton, { backgroundColor: cardBgColor, borderColor: borderColor }, selectedWard !== null && { backgroundColor: tabActiveColor }]} onPress={() => openFilterMenu('ward')}>
                        <ThemedText style={[styles.filterMenuButtonText, { color: selectedWard !== null ? '#FFF' : textColor }]}>{selectedWard || 'エリア（地域）'}</ThemedText>
                        <Ionicons name="chevron-down" size={14} color={selectedWard ? "#FFF" : subTextColor} />
                    </Pressable>

                    <Pressable style={[styles.filterMenuButton, { backgroundColor: cardBgColor, borderColor: borderColor }, selectedCategory !== null && { backgroundColor: tabActiveColor }]} onPress={() => openFilterMenu('category')}>
                        <ThemedText style={[styles.filterMenuButtonText, { color: selectedCategory !== null ? '#FFF' : textColor }]}>{selectedCategory || 'カテゴリ'}</ThemedText>
                        <Ionicons name="chevron-down" size={14} color={selectedCategory ? "#FFF" : subTextColor} />
                    </Pressable>
                </View>
            )}

            {activeTab === 'discover' && (selectedWard || selectedCategory) && (
                <View style={styles.activeFilterPillsRow}>
                    {selectedWard && (
                        <View style={[styles.filterActivePill, { backgroundColor: cardBgColor, borderColor: tabActiveColor }]}>
                            <ThemedText style={[styles.filterActivePillText, { color: textColor }]}>{selectedWard}</ThemedText>
                            <Pressable onPress={() => setSelectedWard(null)} style={styles.pillCloseTouch}><Ionicons name="close-circle" size={16} color={tabActiveColor} /></Pressable>
                        </View>
                    )}
                    {selectedCategory && (
                        <View style={[styles.filterActivePill, { backgroundColor: cardBgColor, borderColor: tabActiveColor }]}>
                            <ThemedText style={[styles.filterActivePillText, { color: textColor }]}>{selectedCategory}</ThemedText>
                            <Pressable onPress={() => setSelectedCategory(null)} style={styles.pillCloseTouch}><Ionicons name="close-circle" size={16} color={tabActiveColor} /></Pressable>
                        </View>
                    )}
                </View>
            )}

            {isFirstLoading ? (
                <View style={styles.loadingCenter}><ActivityIndicator size="large" color={tabActiveColor} /></View>
            ) : (
                <FlatList
                    data={activeTab === 'messages' ? messageItems : filteredData}
                    renderItem={renderListItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[tabActiveColor]} tintColor={tabActiveColor} />}
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListHeaderComponent={activeTab === 'messages' ? (
                        <View style={styles.messageHeaderTitleRow}>
                            <ThemedText style={[styles.messageTitleText, { color: textColor }]}>メッセージ</ThemedText>
                            {globalUnreadCount > 0 && <View style={[styles.messageCountBadge, { backgroundColor: tabActiveColor }]}><ThemedText style={styles.messageCountBadgeText}>{globalUnreadCount}</ThemedText></View>}
                        </View>
                    ) : null}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="file-tray-outline" size={48} color={subTextColor} />
                            <ThemedText style={[styles.emptyText, { color: subTextColor }]}>
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
                <Pressable style={[styles.centerListingButton, { backgroundColor: isNight ? '#1C2432' : '#FFFFFF', borderColor: tabActiveColor, borderWidth: 1 }]} onPress={() => router.push('/reuse/create')}>
                    <MaterialIcons name="add" size={20} color={tabActiveColor} />
                    <ThemedText style={[styles.centerListingButtonText, { color: tabActiveColor }]}>出品する</ThemedText>
                </Pressable>
            )}

            <View style={styles.tabBarContainer}>
                <View style={[styles.tabBarBackground, { backgroundColor: tabBarBgColor }]} />
                <View style={styles.tabBarContent}>
                    <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
                        <View style={[styles.tabIconCircle, isHomeActive && styles.tabIconCircleActive]}>
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
     
                    <View style={styles.scanWrapper}>
                        <Pressable style={[styles.scanButton, isScanActive && styles.tabIconCircleActive]} onPress={() => router.push('/scan')}>
                            <Ionicons name="scan-outline" size={26} color={isScanActive ? tabActiveColor : tabInactiveColor} />
                        </Pressable>
                        <ThemedText style={[styles.scanLabel, { color: isScanActive ? tabActiveColor : tabInactiveColor, fontWeight: isScanActive ? 'bold' : '700' }]}>
                            ゴミスキャン
                        </ThemedText>
                    </View>

                    <Pressable style={styles.reuseItem} onPress={() => router.push('/reuse')}>
                        <View style={[styles.tabIconCircle, isReuseActive && styles.tabIconCircleActiveReuse]}>
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

            {currentFilterMenu !== null && (
                <View style={[StyleSheet.absoluteFillObject, styles.filterModalContainer]}>
                    <Animated.View style={[styles.filterOverlay, { opacity: overlayOpacity }]}><Pressable style={styles.flexTouchClose} onPress={closeFilterMenu} /></Animated.View>
                    <Animated.View style={[styles.filterBottomSheet, { backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: isNight ? 1 : 0 }, { transform: [{ translateY: sheetTranslateY }] }]}>
                        <View style={[styles.sheetIndicatorBar, { backgroundColor: borderColor }]} />
                        <View style={styles.sheetHeaderRow}>
                            <ThemedText style={[styles.sheetTitleText, { color: textColor }]}>{currentFilterMenu === 'ward' ? 'エリア（地域）で絞り込む' : 'カテゴリで絞り込む'}</ThemedText>
                            <Pressable onPress={closeFilterMenu} style={styles.sheetCloseButtonTouch}><Ionicons name="close" size={22} color={subTextColor} /></Pressable>
                        </View>
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
                                        style={[styles.gridCapsule, { backgroundColor: isSelected ? tabActiveColor : (isNight ? '#2A3442' : '#F0F0F0') }]}
                                        onPress={() => {
                                            if (currentFilterMenu === 'ward') {
                                                setSelectedWard(isSelected ? null : item);
                                            } else {
                                                setSelectedCategory(isSelected ? null : item);
                                            }
                                            closeFilterMenu();
                                        }}
                                    >
                                        <ThemedText style={[styles.gridCapsuleText, { color: isSelected ? '#FFF' : textColor, fontWeight: isSelected ? '700' : '400' }]}>
                                            {item}
                                        </ThemedText>
                                    </Pressable>
                                );
                            }}
                        />
                    </Animated.View>
                </View>
            )}

            <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: cardBgColor }]}>
                        <View style={[styles.modalIconCircle, { backgroundColor: isNight ? '#3A2424' : '#FFF0F0' }]}>
                            <Feather name="trash-2" size={28} color="#FF4D4F" />
                        </View>
                        <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                            {modalMode === 'delete_listing' ? '出品の削除' : 'チャットの削除'}
                        </ThemedText>
                        <ThemedText style={[styles.modalDescription, { color: subTextColor }]}>
                            {modalMode === 'delete_listing' 
                                ? `「${selectedTitle}」を削除してもよろしいですか？この操作は取り消せません。`
                                : `「${selectedTitle}」とのチャットルームを削除してもよろしいですか？履歴も削除されます。`}
                        </ThemedText>
                        <View style={styles.modalActionsRow}>
                            <Pressable style={[styles.modalButton, styles.modalCancelButton, { backgroundColor: isNight ? '#2A3442' : '#E2E8F0' }]} onPress={() => setIsModalVisible(false)}>
                                <ThemedText style={[styles.modalButtonText, { color: textColor }]}>キャンセル</ThemedText>
                            </Pressable>
                            <Pressable style={[styles.modalButton, styles.modalConfirmButton]} onPress={handleConfirmDelete}>
                                <ThemedText style={[styles.modalButtonText, styles.modalConfirmButtonText]}>削除する</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: { flex: 1 },
    topTabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 40, paddingBottom: 10 },
    tabItemTop: { alignItems: 'center', flex: 1, paddingVertical: 8 },
    tabLabelTop: { fontSize: 12, marginTop: 4 },
    badgeWrapper: { position: 'relative' },
    badge: { position: 'absolute', right: -12, top: -6, borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    filterControlRow: { flexDirection: 'row', padding: 12, justifyContent: 'space-between' },
    filterMenuButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
    filterMenuButtonText: { fontSize: 13, marginRight: 4 },
    activeFilterPillsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8 },
    filterActivePill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
    filterActivePillText: { fontSize: 12 },
    pillCloseTouch: { marginLeft: 6 },
    listContainer: { paddingBottom: 120 },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
    itemCard: { flexDirection: 'row', marginHorizontal: 12, marginBottom: 12, borderRadius: 12, padding: 12, alignItems: 'center' },
    imageContainer: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
    productImage: { width: '100%', height: '100%' },
    imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
        flexWrap: 'wrap',
    },
    itemTitleText: { fontSize: 15, fontWeight: 'bold', maxWidth: '75%' },
    priorityTag: {
        backgroundColor: '#FF9500', 
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    priorityTagText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },

    itemDetail: { fontSize: 12, marginBottom: 4 },
    locationContainer: { flexDirection: 'row', alignItems: 'center' },
    itemWardText: { fontSize: 12, marginLeft: 2 },
    itemStationText: { fontSize: 11 },
    rightHeartButton: { padding: 6 },
    rightDeleteButton: { padding: 6 },
    messageCardWrapper: { marginHorizontal: 12, marginBottom: 8 },
    messageCard: { flexDirection: 'row', borderRadius: 12, padding: 12, alignItems: 'center' },
    avatarContainer: { position: 'relative' },
    avatarInnerCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    miniDotBadge: { position: 'absolute', right: 0, top: 0, width: 12, height: 12, borderRadius: 6 },
    messageContent: { flex: 1, marginLeft: 12, marginRight: 8 },
    messageUpperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    messageUserName: { fontSize: 15, fontWeight: 'bold', flex: 1, marginRight: 4 },
    messageTime: { fontSize: 11 },
    messageText: { fontSize: 13 },
    messageRightActionSection: { alignItems: 'center', justifyContent: 'space-between', height: 44 },
    messageMiniItemImageWrapper: { width: 24, height: 24, borderRadius: 4, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    messageMiniItemImage: { width: '100%', height: '100%' },
    inlineRoomDeleteButton: { padding: 2 },
    messageHeaderTitleRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
    messageTitleText: { fontSize: 18, fontWeight: 'bold' },
    messageCountBadge: { marginLeft: 8, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    messageCountBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    centerListingButton: { position: 'absolute', bottom: 95, left: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 33, paddingVertical: 10, borderRadius: 25, elevation: 4, shadowOpacity: 0.1, shadowRadius: 4 },
    centerListingButtonText: { fontSize: 14, fontWeight: 'bold', marginLeft: 4 },

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
        left: 0,
        right: 0,
        bottom: 0,
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
    reuseItem: {
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
    tabIconCircleActiveReuse: {
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

    filterModalContainer: { zIndex: 999 },
    filterOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    flexTouchClose: { flex: 1 },
    filterBottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 400, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
    sheetIndicatorBar: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 12 },
    sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sheetTitleText: { fontSize: 16, fontWeight: 'bold' },
    sheetCloseButtonTouch: { padding: 4 },
    sheetGridRow: { justifyContent: 'flex-start' },
    sheetListContent: { paddingBottom: 24 },
    gridCapsule: { flex: 1, margin: 4, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    gridCapsuleText: { fontSize: 13 },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalCard: { width: '80%', borderRadius: 16, padding: 24, alignItems: 'center' },
    modalIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    modalDescription: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    modalActionsRow: { flexDirection: 'row', width: '100%' },
    modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
    modalCancelButton: {},
    modalConfirmButton: { backgroundColor: '#FF4D4F' },
    modalButtonText: { fontSize: 14, fontWeight: 'bold' },
    modalConfirmButtonText: { color: '#FFF' }
});