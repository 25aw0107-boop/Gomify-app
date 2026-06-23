import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Pressable, TextInput, Image,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';

type MessageType = {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
};

export default function ChatScreen() {
    const router = useRouter();

    // 从路由接收动态参数
    const { id: pathId, itemId, targetUserId: paramTargetUserId } = useLocalSearchParams<{
        id: string;
        itemId?: string;
        targetUserId?: string;
    }>();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(pathId || null);
    const [isLoading, setIsLoading] = useState(true);

    // --- 📦 动态商品上下文状态 ---
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

    // --- 👤 动态聊天对象昵称 ---
    const [partnerName, setPartnerName] = useState('チャット');

    // 聊天记录与输入框
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // 清洗未读状态函数
    const cleanUnreadStatus = async (roomId: string, userId: string) => {
        try {
            console.log('【触发清洗】正在尝试清洗房间:', roomId, ' 用户:', userId);
            const { data, error } = await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('room_id', roomId)
                .neq('sender_id', userId)
                .eq('is_read', false)
                .select();

            if (error) {
                console.error('【消息已读】Supabase 后端拒绝了修改请求，错误详情:', error.message);
            } else {
                console.log('【消息已读】成功更新已读条数:', data?.length || 0);
            }
        } catch (err) {
            console.error('【消息已读】清洗状态时发生未知异常:', err);
        }
    };

    // --- 🌍 核心逻辑：拉取全部真实上下文（商品 + 聊天室 + 用户昵称） ---
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

                // 反向查询聊天室详情
                if (pathId && (!finalItemId || !finalTargetUserId)) {
                    const { data: room, error: roomErr } = await supabase
                        .from('chat_rooms')
                        .select('item_id, buyer_id, seller_id')
                        .eq('id', pathId)
                        .maybeSingle();

                    if (roomErr) console.error("【调试】查询 chat_rooms 报错:", roomErr);

                    if (room && isMounted) {
                        finalItemId = room.item_id;
                        finalTargetUserId = room.buyer_id === user.id ? room.seller_id : room.buyer_id;
                    }
                }

                // 查出真正的商品卡片信息信息
                if (finalItemId && isMounted) {
                    const { data: item, error: itemErr } = await supabase
                        .from('items')
                        .select('*')
                        .eq('id', finalItemId)
                        .maybeSingle();

                    if (itemErr) console.error("【调试】查询 items 报错:", itemErr);

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

                // 获取聊天对象的真实昵称
                if (finalTargetUserId && isMounted) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('nickname')
                        .eq('id', finalTargetUserId)
                        .maybeSingle();

                    if (profile && isMounted) {
                        if (profile.nickname || (profile as any).full_name) {
                            const actualName = profile.nickname || (profile as any).full_name;
                            setPartnerName(actualName);
                        } else {
                            setPartnerName(`ユーザー_${finalTargetUserId.substring(0, 4)}`);
                        }
                    }
                }

                if (isMounted) {
                    setActiveRoomId(pathId);
                    await cleanUnreadStatus(pathId, user.id);
                }

            } catch (err) {
                console.error('动态数据加载遇到严重未捕获异常:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initializeChatData();

        return () => {
            isMounted = false;
        };
    }, [pathId, itemId, paramTargetUserId]);

    // --- ⚡ 实时消息监听与订阅（💡 时间戳防崩溃最终重构版） ---
    useEffect(() => {
        if (!activeRoomId || !currentUserId) return;

        let isChannelMounted = true;

        // 🔥 【核心防撞细节】让信道名称带上当前时间戳。这样高频重载时，新老账号开辟的都是不同的 WebSocket 房间，绝不发生覆盖和报错
        const uniqueChannelName = `room_${activeRoomId}_ts_${Date.now()}`;
        console.log(`【创建独立监听通道】建立专属指纹订阅通道: ${uniqueChannelName}`);

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
                    time: formatTime(msg.created_at)
                }));
                setMessages(formatted);
                setTimeout(() => {
                    if (isChannelMounted) flatListRef.current?.scrollToEnd({ animated: false });
                }, 100);
            }
        };

        fetchChatHistory();

        // 1. 独立声明新带指纹的通道
        const channel = supabase.channel(uniqueChannelName);

        // 2. 绑定事件（顺序：先 on）
        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `room_id=eq.${activeRoomId}` // 依然只拦截当前房间的真实记录
            },
            (payload) => {
                if (!isChannelMounted) return;
                const newMsg = payload.new;
                console.log('【通道接收新数据通知】明细:', newMsg);

                if (newMsg.sender_id !== currentUserId) {
                    setMessages(prev => [...prev, {
                        id: newMsg.id,
                        text: newMsg.text,
                        sender: 'other',
                        time: formatTime(newMsg.created_at)
                    }]);
                    setTimeout(() => {
                        if (isChannelMounted) flatListRef.current?.scrollToEnd({ animated: true }), 100;
                    }, 100);

                    cleanUnreadStatus(activeRoomId, currentUserId);
                }
            }
        );

        // 3. 激活订阅（顺序：最后 subscribe）
        channel.subscribe((status) => {
            console.log(`【实时通道订阅状态同步】指纹信道 ${uniqueChannelName} 状态更改为: ${status}`);
        });

        // 4. 清理阶段
        return () => {
            console.log(`【销毁实时通道】解绑带指纹的房间监听: ${uniqueChannelName}`);
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
            time: formatTime(new Date().toISOString())
        }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: activeRoomId,
                    sender_id: currentUserId,
                    text: textToSend
                });
            if (error) throw error;
        } catch (error) {
            console.error('发送失败:', error);
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
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    <ThemedText style={styles.bubbleText}>{item.text}</ThemedText>
                </View>
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
            {/* 顶部导航栏 */}
            <View style={styles.headerRow}>
                <Pressable onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.push('/reuse/');
                    }
                }} style={styles.backButton}>
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
                contentContainerStyle={styles.chatListContainer}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputBarContainer}>
                    <Pressable style={styles.plusButton}><Ionicons name="add" size={26} color="#666" /></Pressable>
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

            {/* 底部 Tab 栏 */}
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

                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse/')}>
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

// 样式部分保持原样...
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
    bubbleOther: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 4 },
    bubbleMe: { backgroundColor: '#D1E0C5', borderTopRightRadius: 4 },
    bubbleText: { fontSize: 14, color: '#333', lineHeight: 20 },
    chatTime: { fontSize: 10, color: '#999', marginHorizontal: 6, bottom: 2 },
    inputBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderColor: '#EFEFEF', marginBottom: 95 },
    plusButton: { padding: 4 },
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
});