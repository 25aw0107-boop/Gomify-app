import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Image, ActivityIndicator, Modal, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase'; 


import { useAppTheme } from '../tema/ThemeContext';

export default function ReuseDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { selectedDesign } = useAppTheme();
    const isKawaii = selectedDesign === 'cute';
    const isNight = selectedDesign === 'night';
    const isCafe = selectedDesign === 'cafe';

    const cafeTextColor = '#4A3B32'; 
    const cafeAccentColor = '#8B5E3C'; 
    const cafeBackgroundColor = '#F9F6F0';
  
    const kawaiiTextColor = '#6B4E3C';
    const kawaiiBackgroundColor = '#FCF5F0';
    const kawaiiPeachPink = '#F4A396';

    const nightPurple = '#9288da';

    const mainBackgroundColor = isNight ? '#000000' : isKawaii ? kawaiiBackgroundColor : isCafe ? cafeBackgroundColor : '#FFFFFF';
    const cardBgColor = isNight ? '#1C2432' : isKawaii ? '#FCF6EA' : isCafe ? '#FFFDF9' : '#FFFFFF';
    const descriptionBgColor = isNight ? '#111622' : isKawaii ? '#FFFDF9' : isCafe ? '#FAF9F6' : '#FAF9F6';
    const textColor = isNight ? '#FFFFFF' : isKawaii ? kawaiiTextColor : isCafe ? cafeTextColor : '#1A1A1A';
    const subTextColor = isNight ? '#E6E19D' : isKawaii ? '#8B5F65' : isCafe ? '#7A6B58' : '#666666';
    const borderColor = isNight ? nightPurple : '#E0E0E0';
    
    const activeAccentColor = isNight ? nightPurple : isKawaii ? kawaiiPeachPink : isCafe ? cafeAccentColor : '#5B9E00';
    const chatButtonColor = isNight ? nightPurple : isKawaii ? '#A4C3A2' : isCafe ? '#8B5E3C' : '#76C800';
    const activeBtnTextColor = isNight ? '#000000' : '#FFFFFF';


    const [isLoading, setIsLoading] = useState(true);
    const [itemData, setItemData] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); 
    const [isFavorited, setIsFavorited] = useState(false); 

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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


    const fetchItemDetailAndUser = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

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

    const executeDelete = async () => {
        setConfirmVisible(false);
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('items').delete().eq('id', id);
            if (error) throw error;
            setIsDeleting(false);
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/reuse');
            }
        } catch (err: any) {
            setIsDeleting(false);
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'エラー',
                message: '削除に失敗しました。'
            });
        }
    };

    const handlePromoteItem = async () => {
        if (!currentUserId || !itemData) return;
        const COST_POINTS = 2;
        const currentPriority = itemData.priority ?? 0;

        const startBoosting = async () => {
            setCustomAlert(prev => ({ ...prev, visible: false }));
            setIsActionLoading(true);
            try {
                const nextPriority = currentPriority + 1;

                // 💡 UPPDATERING: Sparar nu ändringen på riktigt i Supabase!
                const { error } = await supabase
                    .from('items')
                    .update({ priority: nextPriority })
                    .eq('id', id);

                if (error) throw error;

                setItemData({ ...itemData, priority: nextPriority });

                setTimeout(() => {
                    setCustomAlert({
                        visible: true,
                        type: 'success',
                        title: '引き上げ成功！',
                        message: `商品の優先度を ${nextPriority} に引き上げました！`,
                        onConfirm: () => {
                            setCustomAlert(prev => ({ ...prev, visible: false }));
                            router.replace('/reuse');
                        }
                    });
                }, 100);
            } catch (err: any) {
                console.error("Uppdatering av prioritet misslyckades:", err);
                setTimeout(() => {
                    setCustomAlert({
                        visible: true,
                        type: 'error',
                        title: '引き上げ失敗',
                        message: 'ポイントが不足しているか、処理に失敗しました。'
                    });
                }, 100);
            } finally {
                setIsActionLoading(false);
            }
        };

        setCustomAlert({
            visible: true,
            type: 'confirm',
            title: '優先度の引き上げ',
            message: `${COST_POINTS}ポイントを消費して、表示順位を上げますか？`,
            onConfirm: startBoosting
        });
    };

    const handleToggleLock = async () => {
        if (!itemData) return;
        const nextStatus = itemData.status === 'locked' ? 'available' : 'locked';
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('items').update({ status: nextStatus }).eq('id', itemData.id);
            if (error) throw error;
            setItemData({ ...itemData, status: nextStatus });
        } catch (err) {
            console.error(err);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleStartChat = async () => {
        if (!itemData || !currentUserId) return;
        try {
            const { data: existingRoom } = await supabase.from('chat_rooms').select('id').eq('item_id', itemData.id).eq('buyer_id', currentUserId).maybeSingle();
            let roomId = existingRoom?.id;
            if (!roomId) {
                const { data: newRoom } = await supabase.from('chat_rooms').insert({ item_id: itemData.id, buyer_id: currentUserId, seller_id: itemData.user_id }).select('id').single();
                roomId = newRoom?.id;
            }
            if (roomId) router.push(`/messages/${roomId}`);
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingCenter, { backgroundColor: mainBackgroundColor }]}>
                <ActivityIndicator size="large" color={activeAccentColor} />
            </View>
        );
    }

    if (!itemData) {
        return (
            <View style={[styles.errorCenter, { backgroundColor: mainBackgroundColor }]}>
                <Text style={{ color: textColor }}>商品が見つかりませんでした。</Text>
            </View>
        );
    }

    const imageList = Array.isArray(itemData.images) ? itemData.images : [];
    const isMyOwnItem = currentUserId === itemData.user_id;
    const isLocked = itemData.status === 'locked';

    return (
        <View style={[styles.mainWrapper, { backgroundColor: mainBackgroundColor }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
             
<View style={styles.topHeaderActions}>
<Pressable
    style={styles.backButton}
    onPress={() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/reuse');
        }
    }}
>
    <Ionicons name="chevron-back" size={28} color={textColor} />
</Pressable>
</View>

                <View style={[styles.imageWrapper, { borderColor: borderColor, borderWidth: isNight ? 1 : 0, borderRadius: 24 }]}>
                    {imageList.length > 0 ? (
                        <View style={styles.imageContainerInner}>
                            <Image source={{ uri: imageList[currentImageIndex] }} style={styles.productBigImage} />
                            {isLocked && (
                                <View style={styles.lockedImageOverlay}>
                                    <Ionicons name="lock-closed" size={40} color="#FFF" />
                                    <Text style={styles.lockedOverlayText}>予約キープ中</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: isNight ? '#1C2432' : '#F4F3EF' }]}>
                            <FontAwesome5 name="bicycle" size={80} color={isNight ? nightPurple : '#bbb'} />
                        </View>
                    )}
                </View>

                <View style={styles.titleContainer}>
                    <Text style={[styles.detailTitle, { color: textColor }]}>{itemData.title}</Text>
                </View>

                <View style={[styles.descriptionContainer, { backgroundColor: descriptionBgColor, borderColor: borderColor, borderWidth: isNight ? 1 : 0 }]}>
                    <Text style={{ color: isNight ? '#D1D5DB' : '#444444' }}>{itemData.description}</Text>
                </View>

                {isMyOwnItem ? (
                    <View style={styles.myManagementPanel}>
                        <View style={styles.actionButtonRow}>
                            <Pressable style={[styles.inlineActionButton, { backgroundColor: isNight ? '#2A1F10' : '#FFF8EB', borderColor: isNight ? '#FF9500' : '#FFE2B3' }]} onPress={handlePromoteItem}>
                                <Ionicons name="flash" size={18} color="#FF9500" />
                                <Text style={{ color: '#FF9500', fontWeight: 'bold' }}>ポイントで上位へ</Text>
                            </Pressable>
                            <Pressable style={[styles.inlineActionButton, { backgroundColor: isLocked ? '#334155' : activeAccentColor }]} onPress={handleToggleLock}>
                                <Text style={{ color: activeBtnTextColor }}>{isLocked ? 'ロック解除' : 'キープ'}</Text>
                            </Pressable>
                        </View>
                        
                        <Pressable style={[styles.manageDeleteButton, { borderColor: '#FCA5A5', borderWidth: 1 }]} onPress={() => setConfirmVisible(true)}>
                            <Text style={{ color: '#E95757' }}>この出品を削除する</Text>
                        </Pressable>
                    </View>
                ) : (
                    <Pressable style={[styles.chatButton, { backgroundColor: chatButtonColor }]} onPress={handleStartChat}>
                        <Text style={{ color: activeBtnTextColor, fontWeight: 'bold' }}>チャットで相談</Text>
                    </Pressable>
                )}
            </ScrollView>

            {/* 1. 削除確認 Modal */}
            <Modal transparent={true} animationType="fade" visible={confirmVisible} onRequestClose={() => setConfirmVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.customAlertBox, { backgroundColor: cardBgColor }]}>
                        <Text style={[styles.alertTitle, { color: textColor }]}>出品の削除</Text>
                        <Text style={[styles.alertMessage, { color: subTextColor }]}>削除しますか？</Text>
                        <View style={styles.alertButtonRow}>
                            <Pressable style={styles.alertCancelButton} onPress={() => setConfirmVisible(false)}>
                                <Text style={{ color: isNight ? '#FFF' : '#666' }}>キャンセル</Text>
                            </Pressable>
                            <Pressable style={styles.alertConfirmButton} onPress={executeDelete}>
                                <Text style={{ color: '#FFF' }}>削除</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>


            <Modal transparent={true} animationType="fade" visible={customAlert.visible} onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.customAlertBox, { backgroundColor: cardBgColor }]}>
                        <Text style={[styles.alertTitle, { color: textColor }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertMessage, { color: subTextColor }]}>{customAlert.message}</Text>
                        <View style={styles.alertButtonRow}>
                            {customAlert.type === 'confirm' ? (
                                <>
                                    <Pressable style={styles.alertCancelButton} onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}>
                                        <Text style={{ color: isNight ? '#FFF' : '#666' }}>やめる</Text>
                                    </Pressable>
                                    <Pressable style={[styles.alertConfirmButton, { backgroundColor: '#FF9500' }]} onPress={customAlert.onConfirm}>
                                        <Text style={{ color: '#FFF' }}>OK</Text>
                                    </Pressable>
                                </>
                            ) : (
                                <Pressable style={[styles.alertCancelButton, { backgroundColor: activeAccentColor, flex: 1 }]} onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}>
                                    <Text style={{ color: activeBtnTextColor }}>OK</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

         
            <Modal transparent={true} animationType="fade" visible={isDeleting || isActionLoading}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.loaderContainer, { backgroundColor: cardBgColor, padding: 30, borderRadius: 16, alignItems: 'center' }]}>
                        <ActivityIndicator size="large" color={activeAccentColor} />
                        <Text style={[{ color: textColor, marginTop: 15 }]}>処理中...</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
    topHeaderActions: { flexDirection: 'row', marginBottom: 12 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    imageWrapper: { width: '100%', height: 280, marginBottom: 24 },
    imageContainerInner: { width: '100%', height: '100%', position: 'relative' },
    imagePlaceholder: { width: '100%', height: '100%', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    productBigImage: { width: '100%', height: '100%', borderRadius: 24, resizeMode: 'cover' },
    lockedImageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.55)', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    lockedOverlayText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    titleContainer: { marginBottom: 14 },
    detailTitle: { fontSize: 24, fontWeight: '800' },
    descriptionContainer: { padding: 20, borderRadius: 16, marginBottom: 35 },
    myManagementPanel: { width: '100%', gap: 14, marginBottom: 30 },
    actionButtonRow: { flexDirection: 'row', gap: 12 },
    inlineActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20, gap: 6 },
    manageDeleteButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20 },
    chatButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 28, marginHorizontal: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    customAlertBox: { width: '85%', maxWidth: 320, borderRadius: 24, padding: 22, alignItems: 'center' },
    alertTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
    alertMessage: { fontSize: 13, marginBottom: 24, textAlign: 'center' },
    alertButtonRow: { 
        flexDirection: 'column', 
        width: '100%',           
        gap: 10,                 
    },
    alertCancelButton: { 
        width: '100%',           
        paddingVertical: 14,     
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#F5F5F5' 
    },
    alertConfirmButton: { 
        width: '100%',           
        paddingVertical: 14, 
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderContainer: { justifyContent: 'center', alignItems: 'center' }
});