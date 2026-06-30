import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Image, ActivityIndicator, Modal, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons, Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase'; // 🔐 Supabase 客户端

export default function ReuseDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [itemData, setItemData] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); // 👤 存储当前登录用户的ID
    const [isFavorited, setIsFavorited] = useState(false); // ❤️ 收藏状态

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // 🎯 核心新增：当前显示的图片索引
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // --- 🌍 拉取 Supabase 数据 ---
    const fetchItemDetailAndUser = async () => {
        if (!id) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }

            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setItemData(data);

            if (user && data && user.id !== data.user_id) {
                const { data: favData } = await supabase
                    .from('favorites')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('item_id', data.id)
                    .maybeSingle();

                setIsFavorited(!!favData);
            }
        } catch (error: any) {
            console.error('商品詳細の取得に失敗しました:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItemDetailAndUser();
    }, [id]);

    // 🎯 彻底删除商品
    const executeDelete = async () => {
        setConfirmVisible(false);
        setIsDeleting(true);

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setIsDeleting(false);
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/reuse');
            }
        } catch (err: any) {
            setIsDeleting(false);
            console.error('削除失敗:', err);
            alert("削除に失敗しました。時間をおいて再度お試しください。");
        }
    };

    // ❤️ 切换收藏状态
    const toggleFavorite = async () => {
        if (!currentUserId || !itemData) return;

        try {
            if (isFavorited) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', currentUserId)
                    .eq('item_id', itemData.id);
                setIsFavorited(false);
            } else {
                await supabase
                    .from('favorites')
                    .insert({ user_id: currentUserId, item_id: itemData.id });
                setIsFavorited(true);
            }
        } catch (err) {
            console.error('收藏操作失敗:', err);
        }
    };

    const handleStartChat = async () => {
        if (!itemData || !currentUserId) return;

        try {
            const { data: existingRoom, error: fetchError } = await supabase
                .from('chat_rooms')
                .select('id')
                .eq('item_id', itemData.id)
                .eq('buyer_id', currentUserId)
                .maybeSingle();

            let finalRoomId = '';

            if (existingRoom) {
                finalRoomId = existingRoom.id;
            } else {
                const { data: newRoom, error: createError } = await supabase
                    .from('chat_rooms')
                    .insert({
                        item_id: itemData.id,
                        buyer_id: currentUserId,
                        seller_id: itemData.user_id
                    })
                    .select('id')
                    .single();

                if (createError) throw createError;
                if (newRoom) {
                    finalRoomId = newRoom.id;
                }
            }

            if (finalRoomId) {
                router.push({
                    pathname: `/messages/${finalRoomId}`,
                    params: {
                        itemId: itemData.id,
                        targetUserId: itemData.user_id
                    }
                });
            }
        } catch (err) {
            console.error('无法开启聊天室:', err);
            alert('开启聊天失败，请稍后再试。');
        }
    };

    // 🎯 新增：上一张图片切换逻辑
    const handlePrevImage = () => {
        if (!itemData?.images || itemData.images.length <= 1) return;
        setCurrentImageIndex((prev) => (prev === 0 ? itemData.images.length - 1 : prev - 1));
    };

    // 🎯 新增：下一张图片切换逻辑
    const handleNextImage = () => {
        if (!itemData?.images || itemData.images.length <= 1) return;
        setCurrentImageIndex((prev) => (prev === itemData.images.length - 1 ? 0 : prev + 1));
    };

    if (isLoading) {
        return (
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#5B9E00" />
            </View>
        );
    }

    if (!itemData) {
        return (
            <View style={styles.errorCenter}>
                <ThemedText style={styles.errorText}>商品が見つかりませんでした。</ThemedText>
                <Pressable style={styles.errorButton} onPress={() => router.back()}>
                    <ThemedText style={styles.errorButtonText}>戻る</ThemedText>
                </Pressable>
            </View>
        );
    }

    // 解析图片逻辑
    const imageList = Array.isArray(itemData.images) ? itemData.images : [];
    const hasImage = imageList.length > 0;
    const currentImageUrl = hasImage ? imageList[currentImageIndex] : null;
    const isMyOwnItem = currentUserId === itemData.user_id;

    return (
        <View style={styles.mainWrapper}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 顶部返回行 */}
                <View style={styles.topHeaderActions}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={28} color="#222" />
                    </Pressable>
                </View>

                {/* 📷 商品大图核心修改区域 */}
                <View style={styles.imageWrapper}>
                    {hasImage ? (
                        <View style={styles.imageContainerInner}>
                            <Image source={{ uri: currentImageUrl }} style={styles.productBigImage} />

                            {/* 🔥 当有多张图时，渲染左侧切换按钮 */}
                            {imageList.length > 1 && (
                                <Pressable style={[styles.navButton, styles.leftNavButton]} onPress={handlePrevImage}>
                                    <Ionicons name="chevron-back" size={20} color="#333" />
                                </Pressable>
                            )}

                            {/* 🔥 当有多张图时，渲染右侧切换按钮 */}
                            {imageList.length > 1 && (
                                <Pressable style={[styles.navButton, styles.rightNavButton]} onPress={handleNextImage}>
                                    <Ionicons name="chevron-forward" size={20} color="#333" />
                                </Pressable>
                            )}

                            {/* 🔥 底部精致的分页指示小圆点 */}
                            {imageList.length > 1 && (
                                <View style={styles.imageBadgeRow}>
                                    {imageList.map((_item: any, index: number) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.imageDot,
                                                index === currentImageIndex && styles.imageDotActive
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <FontAwesome5 name="bicycle" size={80} color="#bbb" />
                        </View>
                    )}
                </View>

                {/* 大标题 */}
                <View style={styles.titleContainer}>
                    <ThemedText style={styles.detailTitle}>{itemData.title || '無題の商品'}</ThemedText>
                </View>

                {/* 📌 状态行 */}
                <View style={styles.infoMetaRow}>
                    <View style={styles.metaLeftBadges}>
                        <View style={styles.metaBadge}>
                            <Ionicons name="location-sharp" size={16} color="#5B9E00" />
                            <ThemedText style={styles.metaText}>{itemData.station || '未設定'}</ThemedText>
                        </View>

                        <View style={styles.metaBadge}>
                            <Ionicons name="pricetag" size={14} color="#5B9E00" style={styles.tagIconStyle} />
                            <ThemedText style={styles.metaText}>状態：{itemData.quality || '指定なし'}</ThemedText>
                        </View>
                    </View>

                    {!isMyOwnItem && (
                        <Pressable
                            style={[
                                styles.favoriteCircleButton,
                                isFavorited && styles.favoriteCircleButtonActive
                            ]}
                            onPress={toggleFavorite}
                        >
                            <Ionicons
                                name={isFavorited ? "heart" : "heart-outline"}
                                size={20}
                                color={isFavorited ? "#FA5A5A" : "#888888"}
                            />
                        </Pressable>
                    )}
                </View>

                {/* 描述文本 */}
                <View style={styles.descriptionContainer}>
                    <ThemedText style={styles.detailDescription}>
                        {itemData.description || '詳細な説明はありません。'}
                    </ThemedText>
                </View>

                {/* 底部按钮切换 */}
                {isMyOwnItem ? (
                    <Pressable style={styles.manageButton} onPress={() => setConfirmVisible(true)}>
                        <Feather name="trash-2" size={20} color="#FFF" />
                        <ThemedText style={styles.manageButtonText}>この出品を削除する</ThemedText>
                    </Pressable>
                ) : (
                    <Pressable style={styles.chatButton} onPress={handleStartChat}>
                        <Ionicons name="chatbubble-ellipses-outline" size={21} color="#FFF" />
                        <ThemedText style={styles.chatButtonText}>出品者とチャットで相談</ThemedText>
                    </Pressable>
                )}
            </ScrollView>

            {/* 删除确认 Modal */}
            <Modal transparent={true} animationType="fade" visible={confirmVisible} onRequestClose={() => setConfirmVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.customAlertBox}>
                        <View style={styles.alertIconCircle}>
                            <Ionicons name="warning-outline" size={32} color="#FA5A5A" />
                        </View>
                        <ThemedText style={styles.alertTitle}>出品の削除</ThemedText>
                        <ThemedText style={styles.alertMessage}>
                            「{itemData.title || 'この商品'}」の出品を取り消しますか？{'\n'}この操作は取り消せません。
                        </ThemedText>
                        <View style={styles.alertButtonRow}>
                            <Pressable style={styles.alertCancelButton} onPress={() => setConfirmVisible(false)}>
                                <ThemedText style={styles.alertCancelText}>キャンセル</ThemedText>
                            </Pressable>
                            <Pressable style={styles.alertConfirmButton} onPress={executeDelete}>
                                <ThemedText style={styles.alertConfirmText}>削除する</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 正在删除遮罩 Modal */}
            <Modal transparent={true} animationType="fade" visible={isDeleting}>
                <View style={styles.modalOverlay}>
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#FF4D4F" />
                        <ThemedText style={styles.loaderText}>削除しています...</ThemedText>
                    </View>
                </View>
            </Modal>

            {/* 全局底部导航栏 */}
            <View style={styles.tabBarContainer}>
                <View style={styles.scanBackgroundCircle} />
                <View style={styles.tabBarBackground} />
                <View style={styles.tabBarContent}>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}>
                        <Octicons name="home" size={24} color="#555" />
                        <ThemedText style={styles.tabLabelBottom}>ホーム</ThemedText>
                    </Pressable>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}>
                        <FontAwesome5 name="calendar-alt" size={22} color="#555" />
                        <ThemedText style={styles.tabLabelBottom}>ゴミカレンダー</ThemedText>
                    </Pressable>
                    <View style={styles.scanWrapper}>
                        <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
                            <Ionicons name="scan-outline" size={26} color="#555" />
                        </Pressable>
                        <ThemedText style={styles.scanLabel}>ゴミスキャン</ThemedText>
                    </View>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse')}>
                        <Ionicons name="refresh-circle" size={26} color="#5B9E00" />
                        <ThemedText style={[styles.tabLabelBottom, styles.tabLabelBottomActive]}>リユース</ThemedText>
                    </Pressable>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/mypage')}>
                        <Ionicons name="person" size={22} color="#555" />
                        <ThemedText style={styles.tabLabelBottom}>マイページ</ThemedText>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 140,
    },
    topHeaderActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    imageWrapper: {
        width: '100%',
        height: 280,
        marginBottom: 24,
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
            }
        })
    },
    // 🔥 新增：支撑组件绝对定位的内部壳子
    imageContainerInner: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F4F3EF',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productBigImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        backgroundColor: '#F4F3EF',
        resizeMode: 'cover',
    },
    // 🔥 新增：左右换图悬浮按钮的通用样式
    navButton: {
        position: 'absolute',
        top: '50%',
        marginTop: -18, // 垂直完美居中 (36 / 2)
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    leftNavButton: {
        left: 12,
    },
    rightNavButton: {
        right: 12,
    },
    // 🔥 新增：指示器指示点容器
    imageBadgeRow: {
        position: 'absolute',
        bottom: 14,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    imageDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    imageDotActive: {
        backgroundColor: '#FFFFFF',
        width: 14, // 激活时拉成长胶囊状，非常现代高端
    },
    titleContainer: {
        marginBottom: 14,
    },
    detailTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1A1A',
        lineHeight: 34,
    },
    infoMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    metaLeftBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F5EC',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 4,
    },
    favoriteCircleButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    favoriteCircleButtonActive: {
        backgroundColor: '#FFF1F1',
        borderColor: '#FFE0E0',
    },
    tagIconStyle: {
        transform: [{ rotate: '90deg' }],
    },
    metaText: {
        fontSize: 14,
        color: '#4A5D3B',
        fontWeight: '600',
    },
    descriptionContainer: {
        backgroundColor: '#FAF9F6',
        padding: 20,
        borderRadius: 16,
        marginBottom: 35,
    },
    detailDescription: {
        fontSize: 15,
        color: '#444444',
        lineHeight: 26,
        fontWeight: '400',
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E95757',
        paddingVertical: 16,
        borderRadius: 28,
        gap: 8,
        marginHorizontal: 12,
        ...Platform.select({
            web: { boxShadow: '0px 4px 8px rgba(233, 87, 87, 0.15)' },
            default: {
                shadowColor: '#E95757',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
            }
        })
    },
    manageButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#76C800',
        paddingVertical: 16,
        borderRadius: 28,
        gap: 8,
        marginHorizontal: 12,
        ...Platform.select({
            web: { boxShadow: '0px 4px 8px rgba(118, 200, 0, 0.15)' },
            default: {
                shadowColor: '#76C800',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
            }
        })
    },
    chatButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customAlertBox: {
        width: '85%',
        maxWidth: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    alertIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF1F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#222222',
        marginBottom: 12,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 28,
    },
    alertButtonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    alertCancelButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertCancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#555555',
    },
    alertConfirmButton: {
        flex: 1,
        backgroundColor: '#EE5E5E',
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertConfirmText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    loaderContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 24,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    loaderText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '600',
    },
    loadingCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    errorCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#999',
        marginBottom: 16,
    },
    errorButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: '#5B9E00',
        borderRadius: 20,
    },
    errorButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
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
        backgroundColor: '#D1E0C5',
        zIndex: 1,
    },
    scanBackgroundCircle: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#D1E0C5',
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
    tabItemBottom: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: 60,
    },
    tabLabelBottom: {
        fontSize: 9,
        color: '#555',
        marginTop: 4,
        fontWeight: '600',
        textAlign: 'center',
    },
    tabLabelBottomActive: {
        color: '#5B9E00',
        fontWeight: 'bold',
    },
    scanWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: 95,
    },
    scanButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    scanLabel: {
        fontSize: 9,
        color: '#555',
        marginTop: 2,
        fontWeight: '700',
        textAlign: 'center',
    },
});