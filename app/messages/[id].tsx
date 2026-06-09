import React, { useState } from 'react';
import {
    StyleSheet, View, Pressable, TextInput,
    FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

// 消息结构定义
type MessageType = {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
};

export default function ChatScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // 动态获取传递过来的商品或对话ID

    // 1. 模拟顶部关联的商品信息
    const [itemContext] = useState({
        title: '自転車',
        quality: '古い',
        location: '新宿駅',
        distance: '3km'
    });

    // 2. 模拟聊天记录数据
    const [messages, setMessages] = useState<MessageType[]>([
        { id: '1', text: 'こんにちは。\n投稿を見ました。', sender: 'other', time: '11:23' },
        { id: '2', text: 'もしよければ、まだお取引可能でしょうか？', sender: 'other', time: '11:24' },
        { id: '3', text: 'こんにちは！はい、まだ大丈夫ですよ。新宿駅での手渡しになりますが、ご都合はいかがですか？', sender: 'me', time: '11:26' },
    ]);

    // 3. 输入框状态
    const [inputText, setInputText] = useState('');

    // 发送消息逻辑
    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: MessageType = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'me',
            time: '11:35', // 实际开发用 new Date() 格式化
        };

        setMessages([...messages, newMessage]);
        setInputText('');
    };

    // 渲染单条聊天气泡
    const renderMessageBubble = ({ item }: { item: MessageType }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={[styles.bubbleWrapper, isMe ? styles.bubbleMeWrapper : styles.bubbleOtherWrapper]}>
                {/* 对方发送的，左侧显示一个圆圈头像占位 */}
                {!isMe && (
                    <View style={styles.chatAvatar}>
                        <Ionicons name="person" size={18} color="#aaa" />
                    </View>
                )}

                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    <ThemedText style={styles.bubbleText}>{item.text}</ThemedText>
                </View>

                {/* 时间戳 */}
                <ThemedText style={styles.chatTime}>{item.time}</ThemedText>
            </View>
        );
    };

    return (
        <View style={styles.mainWrapper}>
            {/* 顶层大返回导航栏 */}
            <View style={styles.headerRow}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </Pressable>
                <ThemedText style={styles.headerTitle}>4336_山田 さん</ThemedText>
                <View style={{ width: 40 }} /> {/* 占位保持居中 */}
            </View>

            {/* A. 顶部吸顶的商品上下文卡片 */}
            <View style={styles.productContextCard}>
                <View style={styles.miniImagePlaceholder}>
                    <FontAwesome5 name="bicycle" size={24} color="#999" />
                </View>
                <View style={styles.productContextInfo}>
                    <ThemedText style={styles.contextTitle}>{itemContext.title}</ThemedText>
                    <ThemedText style={styles.contextDetails}>
                        品质：{itemContext.quality}  |  {itemContext.location} {itemContext.distance}
                    </ThemedText>
                </View>
            </View>

            {/* B. 聊天对话历史区域 */}
            <FlatList
                data={messages}
                renderItem={renderMessageBubble}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatListContainer}
                showsVerticalScrollIndicator={false}
            />

            {/* C. 底部聊天输入框区域 */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90} // 避开下方公共Tabbar的高度
            >
                <View style={styles.inputBarContainer}>
                    <Pressable style={styles.plusButton}>
                        <Ionicons name="add" size={26} color="#666" />
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

            {/* ================= 全局绿色底部通用五个导航栏菜单 ================= */}
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

                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/profile')}>
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
        backgroundColor: '#F5F5F5',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderColor: '#EFEFEF',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    // 顶部吸顶的物品卡片
    productContextCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 12,
        margin: 12,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    miniImagePlaceholder: {
        width: 48,
        height: 48,
        backgroundColor: '#EAE6DF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productContextInfo: {
        flex: 1,
        marginLeft: 12,
    },
    contextTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    contextDetails: {
        fontSize: 12,
        color: '#777',
    },
    // 聊天气泡列表
    chatListContainer: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 180, // 给底部的输入框和系统栏留出充足空间
    },
    bubbleWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
        maxWidth: '85%',
    },
    bubbleMeWrapper: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse', // 让自己的消息和时间右对齐
    },
    bubbleOtherWrapper: {
        alignSelf: 'flex-start',
    },
    chatAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
    },
    bubbleOther: {
        backgroundColor: '#FFFFFF', // 对方发送的：纯白底
        borderTopLeftRadius: 4,
    },
    bubbleMe: {
        backgroundColor: '#D1E0C5', // 核心：自己发的使用你家主页绿色的淡色调
        borderTopRightRadius: 4,
    },
    bubbleText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    chatTime: {
        fontSize: 10,
        color: '#999',
        marginHorizontal: 6,
        bottom: 2,
    },
    // 底部文字输入框
    inputBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderColor: '#EFEFEF',
        marginBottom: 95, // 刚好悬浮停留在最下方的绿色菜单栏之上
    },
    plusButton: {
        padding: 4,
    },
    chatTextInput: {
        flex: 1,
        backgroundColor: '#F2F2F2',
        borderRadius: 20,
        height: 40,
        paddingHorizontal: 16,
        marginHorizontal: 10,
        fontSize: 14,
    },
    sendButton: {
        padding: 4,
    },
    // ---- 底部通用五个导航栏菜单样式 (100%全页面统一) ----
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
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