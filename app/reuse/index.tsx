import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialIcons, Octicons, Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

type TabType = 'discover' | 'favorites' | 'listings' | 'messages';

export default function ReuseScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('discover');

    // 商品列表数据
    const [items, setItems] = useState([
        { id: '1', title: '自転車', quality: '古い', location: '新宿駅', distance: '3km', isLiked: true, status: 'discover' },
        { id: '2', title: '木の椅子', quality: '古い', location: '新宿駅', distance: '3km', isLiked: false, status: 'discover' },
        { id: '3', title: '電子レンジ', quality: '古い', location: '新宿駅', distance: '3km', isLiked: true, status: 'discover' },
        { id: '4', title: '電子レンジ', quality: '古い', location: '新宿駅', distance: '3km', isLiked: false, status: 'discover' },
        { id: '5', title: 'マイ出品のテーブル', quality: '目立った傷なし', location: '渋谷駅', distance: '1km', isLiked: false, status: 'listings' },
    ]);

    // 消息列表数据
    const [messageItems, setMessageItems] = useState([
        {
            id: 'm1',
            userName: '4336_山田 さん',
            text: 'こんにちは。\n投稿を見ました。もしよければ...',
            time: '11:25',
            itemTitle: '自転車'
        }
    ]);

    const toggleLike = (id: string) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, isLiked: !item.isLiked } : item
            )
        );
    };

    // 新增：处理卖家删除自己出品物资的逻辑
    const handleDeleteProduct = (id: string, title: string) => {
        Alert.alert(
            "出品削除",
            `「${title}」の出品を取り消しますか？\n（この操作は取り消せません）`,
            [
                {
                    text: "キャンセル",
                    style: "cancel"
                },
                {
                    text: "削除する",
                    style: "destructive",
                    onPress: () => {
                        // 从核心数据列表中将对应的商品彻底滤除
                        setItems(prevItems => prevItems.filter(item => item.id !== id));
                    }
                }
            ]
        );
    };

    const getFilteredData = () => {
        switch (activeTab) {
            case 'discover': return items.filter(item => item.status === 'discover');
            case 'favorites': return items.filter(item => item.isLiked);
            case 'listings': return items.filter(item => item.status === 'listings');
            case 'messages': return messageItems;
            default: return [];
        }
    };

    const renderProductItem = ({ item }: { item: typeof items[0] }) => (
        <Pressable style={styles.itemCard} onPress={() => router.push(`/reuse/${item.id}`)}>
            <View style={styles.imageContainer}>
                <View style={styles.imagePlaceholder}>
                    <FontAwesome5 name="bicycle" size={40} color="#aaa" />
                </View>
                <View style={styles.imageInnerHeart}>
                    <Ionicons name="heart-outline" size={14} color="#666" />
                </View>
            </View>

            <View style={styles.itemInfo}>
                <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.itemDetail}>品质：{item.quality}</ThemedText>
                <ThemedText style={styles.itemDetail}>{item.location}   {item.distance}</ThemedText>
            </View>

            {/* 如果不是“出品中”状态，显示原有的收藏爱心按钮 */}
            {activeTab !== 'listings' ? (
                <Pressable style={styles.rightHeartButton} onPress={() => toggleLike(item.id)}>
                    <Ionicons
                        name={item.isLiked ? "heart" : "heart-outline"}
                        size={26}
                        color={item.isLiked ? "#FFB1B1" : "#C2C2C2"}
                    />
                </Pressable>
            ) : (
                /* 如果是“出品中”状态，则在最右侧精准渲染垃圾桶删除按钮 */
                <Pressable
                    style={({ pressed }) => [
                        styles.rightDeleteButton,
                        pressed && styles.deleteButtonPressed
                    ]}
                    onPress={() => handleDeleteProduct(item.id, item.title)}
                >
                    <Feather name="trash-2" size={22} color="#FF4D4D" />
                </Pressable>
            )}
        </Pressable>
    );

    const renderMessageItem = ({ item }: { item: typeof messageItems[0] }) => (
        <Pressable style={styles.messageCard} onPress={() => router.push(`/messages/${item.id}`)}>
            <View style={styles.avatarContainer}>
                <Ionicons name="person-outline" size={32} color="#aaa" />
            </View>
            <View style={styles.messageContent}>
                <ThemedText style={styles.messageUserName}>{item.userName}</ThemedText>
                <ThemedText style={styles.messageText} numberOfLines={2}>{item.text}</ThemedText>
            </View>
            <View style={styles.messageRightSide}>
                <ThemedText style={styles.messageTime}>{item.time}</ThemedText>
                <View style={styles.messageMiniItemImage}>
                    <FontAwesome5 name="bicycle" size={18} color="#999" />
                </View>
            </View>
        </Pressable>
    );

    // 获取当前“出品中”的红点数字标识数量
    const listingCount = items.filter(item => item.status === 'listings').length;

    return (
        <View style={styles.mainWrapper}>
            {/* 顶部标签栏 */}
            <View style={styles.topTabBar}>
                <Pressable style={[styles.tabItemTop, activeTab === 'discover' && styles.tabItemActiveTop]} onPress={() => setActiveTab('discover')}>
                    <Ionicons name="search" size={24} color="#000" />
                    <ThemedText style={styles.tabLabelTop}>発見</ThemedText>
                </Pressable>
                <Pressable style={[styles.tabItemTop, activeTab === 'favorites' && styles.tabItemActiveTop]} onPress={() => setActiveTab('favorites')}>
                    <Ionicons name="heart" size={24} color="#000" />
                    <ThemedText style={styles.tabLabelTop}>気に入り</ThemedText>
                </Pressable>
                <Pressable style={[styles.tabItemTop, activeTab === 'listings' && styles.tabItemActiveTop]} onPress={() => setActiveTab('listings')}>
                    <View style={styles.badgeWrapper}>
                        <MaterialIcons name="assignment" size={24} color="#000" />
                        {listingCount > 0 && (
                            <View style={styles.badge}>
                                <ThemedText style={styles.badgeText}>{listingCount}</ThemedText>
                            </View>
                        )}
                    </View>
                    <ThemedText style={styles.tabLabelTop}>出品中</ThemedText>
                </Pressable>
                <Pressable style={[styles.tabItemTop, activeTab === 'messages' && styles.tabItemActiveTop]} onPress={() => setActiveTab('messages')}>
                    <View style={styles.badgeWrapper}><Ionicons name="chatbox-ellipses" size={24} color="#000" /><View style={styles.badge}><ThemedText style={styles.badgeText}>1</ThemedText></View></View>
                    <ThemedText style={styles.tabLabelTop}>メッセージ</ThemedText>
                </Pressable>
            </View>

            {/* 动态列表内容 */}
            <FlatList
                data={getFilteredData() as any}
                renderItem={activeTab === 'messages' ? renderMessageItem : renderProductItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={
                    activeTab === 'messages' ? (
                        <View style={styles.messageHeaderTitleRow}>
                            <ThemedText style={styles.messageTitleText}>メッセージ</ThemedText>
                            <View style={styles.messageCountBadge}><ThemedText style={styles.messageCountBadgeText}>1</ThemedText></View>
                        </View>
                    ) : null
                }
                // 在发现页或者商品相关页面底部加入原先的中间悬浮“出品する”按钮样式
                ListFooterComponent={
                    activeTab !== 'messages' ? (
                        <Pressable style={styles.centerListingButton} onPress={() => router.push('/reuse/create')}>
                            <MaterialIcons name="add" size={20} color="#444" />
                            <ThemedText style={styles.centerListingButtonText}>出品する</ThemedText>
                        </Pressable>
                    ) : null
                }
            />

            {/* ================= 全局绿色底部选项卡菜单栏 ================= */}
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
        backgroundColor: '#F2F2F2',
    },
    topTabBar: {
        flexDirection: 'row',
        backgroundColor: '#D6E4D0',
        paddingTop: 50,
        paddingBottom: 10,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabItemTop: {
        alignItems: 'center',
        paddingVertical: 6,
        width: '22%',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabItemActiveTop: {
        borderBottomColor: '#000000',
    },
    tabLabelTop: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 4,
    },
    badgeWrapper: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 120, // 留出底部菜单栏的富余空间
    },
    itemCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    imageContainer: {
        position: 'relative',
    },
    imagePlaceholder: {
        width: 100,
        height: 100,
        backgroundColor: '#EAE6DF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageInnerHeart: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 4,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    itemDetail: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    rightHeartButton: {
        padding: 12,
    },
    // ---- 新增的右侧删除图标按钮样式 ----
    rightDeleteButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        marginRight: 4,
    },
    deleteButtonPressed: {
        backgroundColor: '#FFEBEB', // 点击时产生的轻微红底反馈
    },
    // 内嵌的中间出品按钮
    centerListingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(235, 233, 222, 0.9)',
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#DDD',
        marginTop: 10,
        marginBottom: 20,
    },
    centerListingButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#444',
        marginLeft: 6,
    },
    // 消息样式
    messageHeaderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    messageTitleText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    messageCountBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        paddingHorizontal: 8,
        marginLeft: 10,
    },
    messageCountBadgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messageCard: {
        backgroundColor: '#F3EFE4',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCC',
    },
    messageContent: {
        flex: 1,
        marginLeft: 16,
    },
    messageUserName: {
        fontSize: 15,
        fontWeight: '600',
    },
    messageText: {
        fontSize: 13,
        color: '#555',
    },
    messageRightSide: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 64,
    },
    messageTime: {
        fontSize: 11,
        color: '#666',
    },
    messageMiniItemImage: {
        width: 44,
        height: 44,
        backgroundColor: '#FFF',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ---- 底部通用五个导航栏菜单样式 ----
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