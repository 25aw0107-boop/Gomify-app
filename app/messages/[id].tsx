import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Pressable, TextInput, Image,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';

type MessageType = {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
    isImage?: boolean;
};

export default function ChatScreen() {
    const router = useRouter();

    const { id: pathId, itemId, targetUserId: paramTargetUserId } = useLocalSearchParams<{
        id: string;
        itemId?: string;
        targetUserId?: string;
    }>();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(pathId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [isImageUploading, setIsImageUploading] = useState(false);

    // ✨ 控制加号上方绿色气泡菜单的显示
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
            console.error('【消息已读】更新失败:', err);
        }
    };

    // --- 🌍 数据初始化 ---
    useEffect(() => {
        let isMounted = true;
        const initializeChatData = async () => {
            if (!pathId) return;
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
                console.error('加载异常:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initializeChatData();
        return () => { isMounted = false; };
    }, [pathId, itemId, paramTargetUserId]);

    // --- ⚡ 实时消息监听 ---
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
                    text: msg.text,
                    sender: msg.sender_id === currentUserId ? ('me' as const) : ('other' as const),
                    time: formatTime(msg.created_at),
                    isImage: msg.text.includes('chat_attachments')
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
                        text: newMsg.text,
                        sender: 'other',
                        time: formatTime(newMsg.created_at),
                        isImage: newMsg.text.includes('chat_attachments')
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

    // --- 📝 发送文本 ---
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
            console.error('发送失败:', error);
        }
    };

    // --- 📸 图片上传核心管道 ---
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
            console.error('图片上传失败:', err);
            alert(`画像の送信に失敗しました: ${err.message || 'エラーが発生しました'}`);
        } finally {
            setIsImageUploading(false);
        }
    };

    // --- 📷 拍照功能 ---
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

    // --- 🖼️ 相册选择 ---
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
            {/* 顶部标题栏 */}
            <View style={styles.headerRow}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/reuse/')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </Pressable>
                <ThemedText style={styles.headerTitle}>{partnerName}</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            {/* 商品描述上下文卡片 */}
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

            {/* 聊天消息流 */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageBubble}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatListContainer}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            {/* 输入栏与键盘避让 */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputBarContainer}>
                    {/* 加号按钮：点击直接在上方弹出绿色精美气泡 */}
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

            {/* 全局底部导航栏 */}
            <View style={styles.tabBarContainer}>
                <View style={styles.scanBackgroundCircle} />
                <View style={styles.tabBarBackground} />
                <View style={styles.tabBarContent}>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}><Octicons name="home" size={24} color="#555" /><ThemedText style={styles.tabLabelBottom}>ホーム</ThemedText></Pressable>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}><FontAwesome5 name="calendar-alt" size={22} color="#555" /><ThemedText style={styles.tabLabelBottom}>ゴミカレンダー</ThemedText></Pressable>
                    <View style={styles.scanWrapper}><Pressable style={styles.scanButton} onPress={() => router.push('/scan')}><Ionicons name="scan-outline" size={26} color="#555" /></Pressable><ThemedText style={styles.scanLabel}>ゴミスキャン</ThemedText></View>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse/')}><Ionicons name="refresh-circle" size={26} color="#5B9E00" /><ThemedText style={[styles.tabLabelBottom, styles.tabLabelBottomActive]}>リユース</ThemedText></Pressable>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/mypage')}><Ionicons name="person" size={22} color="#555" /><ThemedText style={styles.tabLabelBottom}>マイページ</ThemedText></Pressable>
                </View>
            </View>

            {/* ✨ 新增：完美贴合主 UI 绿白配色的「输入框上方气泡弹窗」 */}
            <Modal
                transparent={true}
                visible={isActionMenuVisible}
                animationType="fade"
                onRequestClose={() => setIsActionMenuVisible(false)}
            >
                {/* 点击弹窗外部任意区域都会优雅关闭菜单 */}
                <Pressable style={styles.popoverOverlay} onPress={() => setIsActionMenuVisible(false)}>
                    <View style={styles.popoverMenuContainer}>

                        {/* 气泡主体：采用系统整体的浅绿多白质感（#D1E0C5 / #5B9E00 细节延伸） */}
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

                        {/* 气泡向下的小三角箭头：定位在左下角加号按钮的正上方 */}
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
    chatListContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 180 },
    bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, maxWidth: '85%' },
    bubbleMeWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    bubbleOtherWrapper: { alignSelf: 'flex-start' },
    chatAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DDD', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
    imageBubble: { padding: 4, borderRadius: 12, overflow: 'hidden' },
    chatRenderedImage: { width: 200, height: 150, borderRadius: 10 },
    bubbleOther: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 4 },
    bubbleMe: { backgroundColor: '#D1E0C5', borderTopRightRadius: 4 }, // 保持原有柔和绿色消息框
    bubbleText: { fontSize: 14, color: '#333', lineHeight: 20 },
    chatTime: { fontSize: 10, color: '#999', marginHorizontal: 6, bottom: 2 },
    inputBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderColor: '#EFEFEF', marginBottom: 95 },
    plusButton: { padding: 4, width: 35, alignItems: 'center', justifyContent: 'center' },
    chatTextInput: { flex: 1, backgroundColor: '#F2F2F2', borderRadius: 20, height: 40, paddingHorizontal: 16, marginHorizontal: 10, fontSize: 14 },
    sendButton: { padding: 4 },
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

    // ✨ 新增：加号正上方的绿色微章气泡弹窗样式
    popoverOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' }, // 轻量阴影背景
    popoverMenuContainer: {
        position: 'absolute',
        bottom: 150, // 正好浮动在加号按钮上方
        left: 12,    // 靠近加号的对齐位置
        width: 150,
    },
    popoverCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 4,
        borderWidth: 1.5,
        borderColor: '#D1E0C5', // 使用你底部 Tab 的特征嫩绿色作为边框
        // 增加柔和的阴影，让气泡产生浮空感
        shadowColor: '#5B9E00',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    popoverItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    popoverText: {
        fontSize: 14,
        color: '#333333',
        marginLeft: 10,
        fontWeight: '600',
    },
    popoverDivider: {
        height: 1,
        backgroundColor: '#EFEFEF',
        marginHorizontal: 12,
    },
    popoverArrow: {
        width: 12,
        height: 12,
        backgroundColor: '#FFFFFF',
        borderLeftWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: '#D1E0C5',
        transform: [{ rotate: '-45deg' }],
        position: 'absolute',
        bottom: -7, // 让小三角贴在气泡卡片最底下
        left: 16,   // 刚好指向左下角的加号中心
    },
});