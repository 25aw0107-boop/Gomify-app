import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Pressable, TextInput, Image,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal
} from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '../tema/ThemeContext';

type MessageType = {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
    isImage?: boolean;
};

export default function ChatScreen() {
    const router = useRouter();
    const pathname = usePathname();
    const { selectedDesign } = useAppTheme();

    const { id: pathId, itemId, targetUserId: paramTargetUserId } = useLocalSearchParams<{
        id: string;
        itemId?: string;
        targetUserId?: string;
    }>();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(pathId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [isImageUploading, setIsImageUploading] = useState(false);


    const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

    const [itemContext, setItemContext] = useState<{
        title: string;
        quality: string;
        location: string;
        imageUrl: string | null;
    }>({
        title: '読み込み中...',
        quality: '-',
        location: '-',
        imageUrl: null
    });

    const [partnerName, setPartnerName] = useState('チャット');
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const isKawaii = selectedDesign === 'cute';
    const isNight = selectedDesign === 'night';
    const isCafe = selectedDesign === 'cafe';
    const tabBarBgColor = isNight ? '#1C2432' : isKawaii ? '#E6F0E3' : isCafe ? '#F2EBE3' : '#D1E0C5';
    const tabInactiveColor = isKawaii ? '#A4C3A2' : isNight ? '#7A8B9E' : isCafe ? '#B8A89A' : '#555555';
    const tabActiveColor = isNight ? '#A6C56F' : isKawaii ? '#F4A396' : isCafe ? '#8B5E3C' : '#5B9E00';
    const isHomeActive = pathname === '/dashboard';
    const isCalendarActive = pathname === '/calendar';
    const isScanActive = pathname === '/scan';
    const isReuseActive = pathname.startsWith('/reuse') || pathname.startsWith('/messages');
    const isMyPageActive = pathname === '/mypage';

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const cleanUnreadStatus = async (roomId: string, userId: string) => {
        try {
            await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('room_id', roomId)
                .neq('sender_id', userId)
                .eq('is_read', false);
        } catch (err) {
            console.error('既読状態の更新に失敗しました。', err);
        }
    };


    useEffect(() => {
        let isMounted = true;
        const initializeChatData = async () => {
            if (!pathId) {
                if (isMounted) setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || !isMounted) return;
                setCurrentUserId(user.id);

                let finalItemId = itemId || null;
                let finalTargetUserId = paramTargetUserId || null;

                if (pathId && (!finalItemId || !finalTargetUserId)) {
                    const { data: room } = await supabase
                        .from('chat_rooms')
                        .select('item_id, buyer_id, seller_id')
                        .eq('id', pathId)
                        .maybeSingle();

                    if (room && isMounted) {
                        finalItemId = room.item_id;
                        finalTargetUserId = room.buyer_id === user.id ? room.seller_id : room.buyer_id;
                    }
                }

                if (finalItemId && isMounted) {
                    const { data: item } = await supabase
                        .from('items')
                        .select('*')
                        .eq('id', finalItemId)
                        .maybeSingle();

                    if (item && isMounted) {
                        setItemContext({
                            title: item.title || '無題の商品',
                            quality: item.quality || '未設定',
                            location: item.station || '指定なし',
                            imageUrl: item.images && item.images.length > 0 ? item.images[0] : null
                        });
                        if (!finalTargetUserId) finalTargetUserId = item.user_id;
                    }
                }

                if (finalTargetUserId && isMounted) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('nickname')
                        .eq('id', finalTargetUserId)
                        .maybeSingle();

                    if (profile && isMounted) {
                        setPartnerName(profile.nickname || `ユーザー_${finalTargetUserId.substring(0, 4)}`);
                    }
                }

                if (isMounted) {
                    setActiveRoomId(pathId);
                    await cleanUnreadStatus(pathId, user.id);
                }
            } catch (err) {
                console.error('読み込みエラー', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initializeChatData();
        return () => { isMounted = false; };
    }, [pathId, itemId, paramTargetUserId]);


    useEffect(() => {
        if (!activeRoomId || !currentUserId) return;

        let isChannelMounted = true;
        const uniqueChannelName = `room_${activeRoomId}_ts_${Date.now()}`;

        const fetchChatHistory = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', activeRoomId)
                .order('created_at', { ascending: true });

            if (data && isChannelMounted) {
                const formatted = data.map((msg: any) => ({
                    id: msg.id,
                    text: msg.text || '',
                    sender: msg.sender_id === currentUserId ? ('me' as const) : ('other' as const),
                    time: formatTime(msg.created_at),
                    isImage: msg.text?.includes('chat_attachments') || false
                }));
                setMessages(formatted);
                setTimeout(() => {
                    if (isChannelMounted) flatListRef.current?.scrollToEnd({ animated: false });
                }, 100);
            }
        };

        fetchChatHistory();

        const channel = supabase.channel(uniqueChannelName);
        channel.on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoomId}` },
            (payload) => {
                if (!isChannelMounted) return;
                const newMsg = payload.new;

                if (newMsg.sender_id !== currentUserId) {
                    setMessages(prev => [...prev, {
                        id: newMsg.id,
                        text: newMsg.text || '',
                        sender: 'other',
                        time: formatTime(newMsg.created_at),

                        isImage: newMsg.text?.includes('chat_attachments') || false
                    }]);
                    setTimeout(() => {
                        if (isChannelMounted) flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);

                    cleanUnreadStatus(activeRoomId, currentUserId);
                }
            }
        ).subscribe();

        return () => {
            isChannelMounted = false;
            supabase.removeChannel(channel);
        };
    }, [activeRoomId, currentUserId]);


    const handleSend = async () => {
        if (!inputText.trim() || !activeRoomId || !currentUserId) return;
        const textToSend = inputText.trim();
        setInputText('');

        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: textToSend,
            sender: 'me',
            time: formatTime(new Date().toISOString()),
            isImage: false
        }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({ room_id: activeRoomId, sender_id: currentUserId, text: textToSend });
            if (error) throw error;
        } catch (error) {
            console.error('送信に失敗しました。', error);
        }
    };


    const uploadAndSendImagePipeline = async (localUri: string) => {
        if (!activeRoomId || !currentUserId) return;
        setIsImageUploading(true);

        try {
            const response = await fetch(localUri);
            const fileBody = await response.blob();
            const fileExt = Platform.OS === 'web'
                ? (fileBody.type.split('/')[1] || 'jpg')
                : (localUri.split('.').pop()?.toLowerCase() || 'jpg');

            const fileName = `${activeRoomId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('chat_attachments')
                .upload(fileName, fileBody, { contentType: `image/${fileExt}`, upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat_attachments')
                .getPublicUrl(fileName);

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: publicUrl,
                sender: 'me',
                time: formatTime(new Date().toISOString()),
                isImage: true
            }]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

            const { error: msgError } = await supabase
                .from('chat_messages')
                .insert({ room_id: activeRoomId, sender_id: currentUserId, text: publicUrl });
            if (msgError) throw msgError;

            const { error: ledgerError } = await supabase
                .from('chat_attachments_ledger')
                .insert({ room_id: activeRoomId, file_path: fileName });
            if (ledgerError) throw ledgerError;

        } catch (err: any) {
            console.error('画像のアップロードに失敗しました。', err);
            alert(`画像の送信に失敗しました: ${err.message || 'エラーが発生しました'}`);
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleLaunchCamera = async () => {
        setIsActionMenuVisible(false);
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            alert('写真を撮影するにはカメラへのアクセス許可が必要です。');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.6,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            await uploadAndSendImagePipeline(result.assets[0].uri);
        }
    };

    const handleLaunchLibrary = async () => {
        setIsActionMenuVisible(false);
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            alert('写真を選択するにはライブラリへのアクセス許可が必要です。');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.6,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            await uploadAndSendImagePipeline(result.assets[0].uri);
        }
    };

    const renderMessageBubble = ({ item }: { item: MessageType }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={[styles.bubbleWrapper, isMe ? styles.bubbleMeWrapper : styles.bubbleOtherWrapper]}>
                {!isMe && (
                    <View style={styles.chatAvatar}>
                        <Ionicons name="person" size={18} color="#aaa" />
                    </View>
                )}
                {item.isImage ? (
                    <View style={[styles.imageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                        <Image source={{ uri: item.text }} style={styles.chatRenderedImage} resizeMode="cover" />
                    </View>
                ) : (
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                        <ThemedText style={styles.bubbleText}>{item.text}</ThemedText>
                    </View>
                )}
                <ThemedText style={styles.chatTime}>{item.time}</ThemedText>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.mainWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#5B9E00" />
            </View>
        );
    }

    return (
        <View style={styles.mainWrapper}>
          
            <View style={styles.headerRow}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/reuse/')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </Pressable>
                <ThemedText style={styles.headerTitle}>{partnerName}</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.productContextCard}>
                <View style={styles.miniImagePlaceholder}>
                    {itemContext.imageUrl ? (
                        <Image source={{ uri: itemContext.imageUrl }} style={styles.miniProductImage} />
                    ) : (
                        <FontAwesome5 name="box" size={20} color="#999" />
                    )}
                </View>
                <View style={styles.productContextInfo}>
                    <ThemedText style={styles.contextTitle}>{itemContext.title}</ThemedText>
                    <ThemedText style={styles.contextDetails}>
                        状態：{itemContext.quality}  |  {itemContext.location}
                    </ThemedText>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageBubble}
                keyExtractor={(item) => item.id}
                style={styles.chatList}
                contentContainerStyle={styles.chatListContainer}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />


            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputBarContainer}>
                    <Pressable style={styles.plusButton} onPress={() => setIsActionMenuVisible(true)}>
                        {isImageUploading ? (
                            <ActivityIndicator size="small" color="#666" />
                        ) : (
                            <Ionicons name="add" size={26} color="#5B9E00" />
                        )}
                    </Pressable>
                    <TextInput
                        style={styles.chatTextInput}
                        placeholder="メッセージを入力"
                        value={inputText}
                        onChangeText={setInputText}
                        placeholderTextColor="#999"
                    />
                    <Pressable style={styles.sendButton} onPress={handleSend}>
                        <Ionicons name="paper-plane" size={22} color="#5B9E00" />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>


            <View style={styles.tabBarContainer}>
                <View style={[styles.tabBarBackground, { backgroundColor: tabBarBgColor }]} />
                <View style={styles.tabBarContent}>
                
                    <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
                        <View style={[styles.tabIconCircle, isHomeActive && styles.tabIconCircleActive]}>
                            <Octicons name="home" size={24} color={isHomeActive ? tabActiveColor : tabInactiveColor} />
                        </View>
                        <ThemedText style={[styles.tabLabel, { color: isHomeActive ? tabActiveColor : tabInactiveColor, fontWeight: isHomeActive ? 'bold' : '600' }]}>ホーム</ThemedText>
                    </Pressable>

               
                    <Pressable style={styles.tabItem} onPress={() => router.push('/calendar')}>
                        <View style={[styles.tabIconCircle, isCalendarActive && styles.tabIconCircleActive]}>
                            <FontAwesome5 name="calendar-alt" size={22} color={isCalendarActive ? tabActiveColor : tabInactiveColor} />
                        </View>
                        <ThemedText style={[styles.tabLabel, { color: isCalendarActive ? tabActiveColor : tabInactiveColor, fontWeight: isCalendarActive ? 'bold' : '600' }]}>ゴミカレンダー</ThemedText>
                    </Pressable>

                  
                    <View style={styles.scanWrapper}>
                        <Pressable style={[styles.scanButton, isScanActive && styles.tabIconCircleActive]} onPress={() => router.push('/scan')}>
                            <Ionicons name="scan-outline" size={26} color={isScanActive ? tabActiveColor : tabInactiveColor} />
                        </Pressable>
                        <ThemedText style={[styles.scanLabel, { color: isScanActive ? tabActiveColor : tabInactiveColor, fontWeight: isScanActive ? 'bold' : '700' }]}>ゴミスキャン</ThemedText>
                    </View>

                  <Pressable style={styles.reuseItem} onPress={() => router.push('/reuse/')}>
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
                        <ThemedText style={[styles.tabLabel, { color: isMyPageActive ? tabActiveColor : tabInactiveColor, fontWeight: isMyPageActive ? 'bold' : '600' }]}>マイページ</ThemedText>
                    </Pressable>
                </View>
            </View>

         
            <Modal
                transparent={true}
                visible={isActionMenuVisible}
                animationType="fade"
                onRequestClose={() => setIsActionMenuVisible(false)}
            >
                <Pressable style={styles.popoverOverlay} onPress={() => setIsActionMenuVisible(false)}>
                    <View style={styles.popoverMenuContainer}>
                        <View style={styles.popoverCard}>
                            <Pressable style={styles.popoverItem} onPress={handleLaunchCamera}>
                                <Ionicons name="camera" size={18} color="#5B9E00" />
                                <ThemedText style={styles.popoverText}>カメラで撮影</ThemedText>
                            </Pressable>

                            <View style={styles.popoverDivider} />

                            <Pressable style={styles.popoverItem} onPress={handleLaunchLibrary}>
                                <Ionicons name="image" size={18} color="#5B9E00" />
                                <ThemedText style={styles.popoverText}>写真アルバム</ThemedText>
                            </Pressable>
                        </View>
                        <View style={styles.popoverArrow} />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}


const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EFEFEF' },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    productContextCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, margin: 12, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    miniImagePlaceholder: { width: 48, height: 48, backgroundColor: '#EAE6DF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    miniProductImage: { width: 48, height: 48, borderRadius: 8 },
    productContextInfo: { flex: 1, marginLeft: 12 },
    contextTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    contextDetails: { fontSize: 12, color: '#777' },
    chatList: { flex: 1 },
    chatListContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 180 },
    bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, maxWidth: '85%' },
    bubbleMeWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    bubbleOtherWrapper: { alignSelf: 'flex-start' },
    chatAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DDD', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
    imageBubble: { padding: 4, borderRadius: 12, overflow: 'hidden' },
    chatRenderedImage: { width: 200, height: 150, borderRadius: 10 },
    bubbleOther: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 4 },
    bubbleMe: { backgroundColor: '#D1E0C5', borderTopRightRadius: 4 },
    bubbleText: { fontSize: 14, color: '#333', lineHeight: 20 },
    chatTime: { fontSize: 10, color: '#999', marginHorizontal: 6, bottom: 2 },
    inputBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderColor: '#EFEFEF', marginBottom: 70 },
    plusButton: { padding: 4, width: 35, alignItems: 'center', justifyContent: 'center' },
    chatTextInput: { flex: 1, backgroundColor: '#F2F2F2', borderRadius: 20, height: 40, paddingHorizontal: 16, marginHorizontal: 10, fontSize: 14 },
    sendButton: { padding: 4 },

   
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


  tabIconCircleActiveReuse: {
    transform: [{ translateY: -0 }],
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
    popoverOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
    popoverMenuContainer: { position: 'absolute', bottom: 124, left: 12, width: 150 },
    popoverCard: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 4, borderWidth: 1.5, borderColor: '#D1E0C5', shadowColor: '#5B9E00', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
    popoverItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
    popoverText: { fontSize: 14, color: '#333333', marginLeft: 10, fontWeight: '600' },
    popoverDivider: { height: 1, backgroundColor: '#EFEFEF', marginHorizontal: 12 },
    popoverArrow: { width: 12, height: 12, backgroundColor: '#FFFFFF', borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#D1E0C5', transform: [{ rotate: '-45deg' }], position: 'absolute', bottom: -7, left: 16 }
});