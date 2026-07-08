import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Image, ActivityIndicator, Modal, Platform, Alert } from 'react-native';
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

    // ⏳ 积分提升与锁定的 loading 状态
    const [isActionLoading, setIsActionLoading] = useState(false);

    // 🎯 当前显示的图片索引
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 🌟 新增：全平台通用的高度自定义美化弹窗状态控制
    const [customAlert, setCustomAlert] = useState<{
        visible: boolean;
        type: 'confirm' | 'success' | 'error';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    });

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
            // 升级为美化弹窗
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'エラー',
                message: '削除に失敗しました。時間をおいて再度お試しください。'
            });
        }
    };

    // 🚀 核心优化：消耗 2 点数提升商品曝光优先级
    const handlePromoteItem = async () => {
        console.log("=== 🚀 提升优先级按钮被触发 ===");

        if (!currentUserId || !itemData) return;

        const COST_POINTS = 2;
        const currentPriority = itemData.priority !== undefined && itemData.priority !== null ? itemData.priority : 0;

        const startBoosting = async () => {
            // 关闭询问弹窗，展示加载中遮罩
            setCustomAlert(prev => ({ ...prev, visible: false }));
            setIsActionLoading(true);

            try {
                console.log("👉 正在发送 Supabase RPC 请求...");

                const { error } = await supabase.rpc('boost_item_with_points', {
                    target_item_id: itemData.id,
                    target_user_id: currentUserId,
                    cost_points: COST_POINTS
                });

                if (error) throw error;

                console.log("✅ Supabase RPC 执行成功！");
                const nextPriority = currentPriority + 1;

                // 本地同步更新前端 UI 状态
                setItemData({ ...itemData, priority: nextPriority });

                // 🌟 触发高颜值成功喜报弹窗
                setTimeout(() => {
                    setCustomAlert({
                        visible: true,
                        type: 'success',
                        title: '引き上げ成功！',
                        message: `商品の優先度を ${nextPriority} に引き上げました！\n検索一覧の上位に優先表示されます。`
                    });
                }, 100);

            } catch (err: any) {
                console.error('❌ 置顶失败错误详情:', err);
                const errMsg = err.message || '処理に失敗しました。';
                
                // 🌟 触发高颜值错误拦截弹窗
                setTimeout(() => {
                    setCustomAlert({
                        visible: true,
                        type: 'error',
                        title: '引き上げ失敗',
                        message: errMsg.includes('点数不足') ? 'ポイントが不足しているため、優先度を引き上げることができません。' : errMsg
                    });
                }, 100);
            } finally {
                setIsActionLoading(false);
            }
        };

        // 🌟 无论 Web 还是手机端，统一弹出美丽的 App 内嵌询问框
        setCustomAlert({
            visible: true,
            type: 'confirm',
            title: '優先度の引き上げ',
            message: `${COST_POINTS}ポイントを消費して、この商品の表示順位を上げますか？\n(現在の優先度: ${currentPriority})`,
            onConfirm: startBoosting
        });
    };

    // 🔒 核心功能 2：锁定状态切换 (Lock / Unlock)
    const handleToggleLock = async () => {
        if (!itemData) return;

        const currentStatus = itemData.status;
        const isCurrentlyLocked = currentStatus === 'locked';
        const nextStatus = isCurrentlyLocked ? 'available' : 'locked';

        setIsActionLoading(true);
        try {
            const { error } = await supabase
                .from('items')
                .update({ status: nextStatus })
                .eq('id', itemData.id);

            if (error) throw error;

            setItemData({ ...itemData, status: nextStatus });

            setTimeout(() => {
                setCustomAlert({
                    visible: true,
                    type: 'success',
                    title: nextStatus === 'locked' ? '商品をロックしました' : 'ロックを解除しました',
                    message: nextStatus === 'locked' 
                        ? 'この商品は検索一覧に表示されなくなりました。取引が完了したら削除してください。'
                        : '商品が再び検索一覧に公開されました。'
                });
            }, 100);

        } catch (err) {
            console.error('状态切换失败:', err);
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'エラー',
                message: '状態の更新に失敗しました。'
            });
        } finally {
            setIsActionLoading(false);
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
            const { data: existingRoom } = await supabase
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
                    params: { itemId: itemData.id, targetUserId: itemData.user_id }
                });
            }
        } catch (err) {
            console.error('无法开启聊天室:', err);
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'エラー',
                message: 'チャットの開始に失敗しました。'
            });
        }
    };

    const handlePrevImage = () => {
        if (!itemData?.images || itemData.images.length <= 1) return;
        setCurrentImageIndex((prev) => (prev === 0 ? itemData.images.length - 1 : prev - 1));
    };

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

    const imageList = Array.isArray(itemData.images) ? itemData.images : [];
    const hasImage = imageList.length > 0;
    const currentImageUrl = hasImage ? imageList[currentImageIndex] : null;
    const isMyOwnItem = currentUserId === itemData.user_id;
    const isLocked = itemData.status === 'locked';

    return (
        <View style={styles.mainWrapper}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 顶部返回行 */}
                <View style={styles.topHeaderActions}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={28} color="#222" />
                    </Pressable>
                </View>

                {/* 商品大图 */}
                <View style={styles.imageWrapper}>
                    {hasImage ? (
                        <View style={styles.imageContainerInner}>
                            <Image source={{ uri: currentImageUrl }} style={styles.productBigImage} />

                            {/* 🔒 覆盖半透明标识蒙层 */}
                            {isLocked && (
                                <View style={styles.lockedImageOverlay}>
                                    <Ionicons name="lock-closed" size={40} color="#FFF" />
                                    <ThemedText style={styles.lockedOverlayText}>予約キープ中</ThemedText>
                                </View>
                            )}

                            {imageList.length > 1 && (
                                <Pressable style={[styles.navButton, styles.leftNavButton]} onPress={handlePrevImage}>
                                    <Ionicons name="chevron-back" size={20} color="#333" />
                                </Pressable>
                            )}

                            {imageList.length > 1 && (
                                <Pressable style={[styles.navButton, styles.rightNavButton]} onPress={handleNextImage}>
                                    <Ionicons name="chevron-forward" size={20} color="#333" />
                                </Pressable>
                            )}

                            {imageList.length > 1 && (
                                <View style={styles.imageBadgeRow}>
                                    {imageList.map((_item: any, index: number) => (
                                        <View key={index} style={[styles.imageDot, index === currentImageIndex && styles.imageDotActive]} />
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
                    <ThemedText style={styles.detailTitle}>
                        {isLocked ? `[キープ中] ${itemData.title}` : itemData.title || '無題の商品'}
                    </ThemedText>
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

                        {/* 如果是自己的商品，追加显示当前的优先级信息 */}
                        {isMyOwnItem && (
                            <View style={[styles.metaBadge, { backgroundColor: '#FFF4E5' }]}>
                                <Octicons name="rocket" size={13} color="#FF9500" />
                                <ThemedText style={[styles.metaText, { color: '#B36B00' }]}>優先度: {itemData.priority !== undefined && itemData.priority !== null ? itemData.priority : 0}</ThemedText>
                            </View>
                        )}
                    </View>

                    {!isMyOwnItem && (
                        <Pressable style={[styles.favoriteCircleButton, isFavorited && styles.favoriteCircleButtonActive]} onPress={toggleFavorite}>
                            <Ionicons name={isFavorited ? "heart" : "heart-outline"} size={20} color={isFavorited ? "#FA5A5A" : "#888888"} />
                        </Pressable>
                    )}
                </View>

                {/* 描述文本 */}
                <View style={styles.descriptionContainer}>
                    <ThemedText style={styles.detailDescription}>
                        {itemData.description || '詳細な説明はありません。'}
                    </ThemedText>
                </View>

                {/* 底部管理面板控制组 */}
                {isMyOwnItem ? (
                    <View style={styles.myManagementPanel}>
                        {/* 1. 操作功能双按钮组 */}
                        <View style={styles.actionButtonRow}>
                            {/* 左按钮：使用点数进行商品优先级置顶提升 */}
                            <Pressable
                                style={[styles.inlineActionButton, styles.promoteBtn]}
                                onPress={handlePromoteItem}
                                disabled={isActionLoading}
                            >
                                <Ionicons name="flash" size={18} color="#FF9500" />
                                <ThemedText style={styles.inlineBtnText}>ポイントで上位へ</ThemedText>
                            </Pressable>

                            {/* 右按钮：切换锁定/解锁商品状态 */}
                            <Pressable
                                style={[styles.inlineActionButton, isLocked ? styles.unlockBtn : styles.lockBtn]}
                                onPress={handleToggleLock}
                                disabled={isActionLoading}
                            >
                                <Ionicons name={isLocked ? "lock-open" : "lock-closed"} size={17} color={isLocked ? "#555" : "#FFF"} />
                                <ThemedText style={[styles.inlineBtnText, { color: isLocked ? '#555' : '#FFF' }]}>
                                    {isLocked ? 'ロックを解除' : 'キープ(非公開)'}
                                </ThemedText>
                            </Pressable>
                        </View>

                        {/* 2. 高颜值出品删除按钮（从主色改为了优雅的浅底精致边框版，降低误触感） */}
                        <Pressable style={styles.manageDeleteButton} onPress={() => setConfirmVisible(true)}>
                            <Feather name="trash-2" size={16} color="#E95757" />
                            <ThemedText style={styles.manageDeleteButtonText}>この出品を削除する</ThemedText>
                        </Pressable>
                    </View>
                ) : (
                    <Pressable style={styles.chatButton} onPress={handleStartChat}>
                        <Ionicons name="chatbubble-ellipses-outline" size={21} color="#FFF" />
                        <ThemedText style={styles.chatButtonText}>出品者とチャットで相談</ThemedText>
                    </Pressable>
                )}
            </ScrollView>

            {/* 1. 删除确认 Modal */}
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

            {/* 2. 🌟 全功能自适应美化交互弹窗 (替代浏览器原生 Confirm / Alert) */}
            <Modal transparent={true} animationType="fade" visible={customAlert.visible} onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}>
                <View style={styles.modalOverlay}>
                    <View style={styles.customAlertBox}>
                        
                        {/* 根据状态动态渲染图标和颜色主题 */}
                        {customAlert.type === 'confirm' && (
                            <View style={[styles.alertIconCircle, { backgroundColor: '#FFF9E6' }]}>
                                <Ionicons name="flash" size={32} color="#FF9500" />
                            </View>
                        )}
                        {customAlert.type === 'success' && (
                            <View style={[styles.alertIconCircle, { backgroundColor: '#EFFFF0' }]}>
                                <Ionicons name="checkmark-circle" size={32} color="#27AE60" />
                            </View>
                        )}
                        {customAlert.type === 'error' && (
                            <View style={[styles.alertIconCircle, { backgroundColor: '#FFF0F0' }]}>
                                <Ionicons name="alert-circle" size={32} color="#EB5757" />
                            </View>
                        )}

                        <ThemedText style={styles.alertTitle}>{customAlert.title}</ThemedText>
                        <ThemedText style={styles.alertMessage}>{customAlert.message}</ThemedText>
                        
                        <View style={styles.alertButtonRow}>
                            {customAlert.type === 'confirm' ? (
                                <>
                                    <Pressable style={styles.alertCancelButton} onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}>
                                        <ThemedText style={styles.alertCancelText}>やめる</ThemedText>
                                    </Pressable>
                                    <Pressable style={[styles.alertConfirmButton, { backgroundColor: '#FF9500' }]} onPress={customAlert.onConfirm}>
                                        <ThemedText style={styles.alertConfirmText}>引き上げる</ThemedText>
                                    </Pressable>
                                </>
                            ) : (
                                <Pressable style={[styles.alertCancelButton, { backgroundColor: '#5B9E00', flex: 1 }]} onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}>
                                    <ThemedText style={[styles.alertCancelText, { color: '#FFF' }]}>OK</ThemedText>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 操作全屏遮罩 */}
            <Modal transparent={true} animationType="fade" visible={isDeleting || isActionLoading}>
                <View style={styles.modalOverlay}>
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#5B9E00" />
                        <ThemedText style={styles.loaderText}>処理中...</ThemedText>
                    </View>
                </View>
            </Modal>

            {/* 全局底部导航栏栏 */}
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
    mainWrapper: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 180 },
    topHeaderActions: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 12 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    imageWrapper: {
        width: '100%', height: 280, marginBottom: 24,
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }
        })
    },
    imageContainerInner: { width: '100%', height: '100%', position: 'relative' },
    imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#F4F3EF', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    productBigImage: { width: '100%', height: '100%', borderRadius: 24, backgroundColor: '#F4F3EF', resizeMode: 'cover' },
    lockedImageOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)', borderRadius: 24,
        justifyContent: 'center', alignItems: 'center', gap: 8
    },
    lockedOverlayText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    navButton: { position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.75)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    leftNavButton: { left: 12 },
    rightNavButton: { right: 12 },
    imageBadgeRow: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
    imageDotActive: { backgroundColor: '#FFFFFF', width: 14 },
    titleContainer: { marginBottom: 14 },
    detailTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', lineHeight: 32 },
    infoMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    metaLeftBadges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F5EC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
    favoriteCircleButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EAEAEA' },
    favoriteCircleButtonActive: { backgroundColor: '#FFF1F1', borderColor: '#FFE0E0' },
    tagIconStyle: { transform: [{ rotate: '90deg' }] },
    metaText: { fontSize: 13, color: '#4A5D3B', fontWeight: '600' },
    descriptionContainer: { backgroundColor: '#FAF9F6', padding: 20, borderRadius: 16, marginBottom: 35 },
    detailDescription: { fontSize: 15, color: '#444444', lineHeight: 26, fontWeight: '400' },

    // 🎨 ✨ 管理面板样式全面升级
    myManagementPanel: { width: '100%', gap: 14, paddingHorizontal: 4, marginBottom: 30 },
    actionButtonRow: { flexDirection: 'row', width: '100%', gap: 12 },
    inlineActionButton: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 14, 
        borderRadius: 20, 
        gap: 6, 
        borderWidth: 1,
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }
        })
    },
    // 提升按钮：尊贵柔和的香槟金暖色调
    promoteBtn: { backgroundColor: '#FFF8EB', borderColor: '#FFE2B3' },
    inlineBtnText: { fontSize: 14, fontWeight: '700', color: '#E28700' },
    // 锁定状态按钮：沉稳高雅的森林绿（契合应用色系）
    lockBtn: { backgroundColor: '#5B9E00', borderColor: '#5B9E00' },
    // 解锁状态按钮：质感低调的淡灰色
    unlockBtn: { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' },
    
    // 优雅低调的白色底赤红边框删除按钮（降低视觉攻击性，防止突兀）
    manageDeleteButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#FFFFFF', 
        paddingVertical: 14, 
        borderRadius: 20, 
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#FCA5A5',
    },
    manageDeleteButtonText: { fontSize: 14, fontWeight: '700', color: '#E95757' },

    chatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#76C800', paddingVertical: 16, borderRadius: 28, gap: 8, marginHorizontal: 12 },
    chatButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    
    // 🌌 弹窗通用暗化蒙层
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
    
    // 🎴 内嵌卡片式弹框样式升级
    customAlertBox: { 
        width: '85%', 
        maxWidth: 320, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 24, 
        paddingTop: 28, 
        paddingBottom: 22, 
        paddingHorizontal: 22, 
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 }
        })
    },
    alertIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF1F1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    alertTitle: { fontSize: 18, fontWeight: '800', color: '#222222', marginBottom: 10, textAlign: 'center' },
    alertMessage: { fontSize: 13, color: '#666666', lineHeight: 20, textAlign: 'center', marginBottom: 24 },
    alertButtonRow: { flexDirection: 'row', width: '100%', gap: 10 },
    alertCancelButton: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    alertCancelText: { fontSize: 14, fontWeight: '700', color: '#666666' },
    alertConfirmButton: { flex: 1, backgroundColor: '#EE5E5E', paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    alertConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    
    loaderContainer: { backgroundColor: '#FFFFFF', paddingVertical: 24, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', gap: 12 },
    loaderText: { fontSize: 14, color: '#444', fontWeight: '600' },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    errorCenter: { flex: 1, alignItems: 'center', padding: 24, justifyContent: 'center' },
    errorText: { fontSize: 16, color: '#999', marginBottom: 16 },
    errorButton: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: '#5B9E00', borderRadius: 20 },
    errorButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end', zIndex: 99 },
    tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
    scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
    tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
    tabItemBottom: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
    tabLabelBottom: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
    tabLabelBottomActive: { color: '#5B9E00', fontWeight: 'bold' },
    scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
    scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' },
});