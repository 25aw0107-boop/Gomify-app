import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export default function ReuseDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // 获取动态路由传递过来的商品ID

    // 模拟根据ID获取到的商品详细数据
    const [itemData, setItemData] = useState({
        id: id || '1',
        title: '自転車',
        quality: '古い',
        location: '新宿駅',
        description: 'テキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキスト文本内容',
        isLiked: true,
    });

    // 切换收藏爱心状态
    const toggleLike = () => {
        setItemData(prev => ({ ...prev, isLiked: !prev.isLiked }));
    };

    return (
        <View style={styles.mainWrapper}>
            {/* 主体滚动内容区 */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 顶部返回按钮 */}
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </Pressable>

                {/* 商品大图展示区域 */}
                <View style={styles.imageWrapper}>
                    {/* 这里暂时用本地自行车Icon占位，如果正式开发可以替换为 Image 组件 */}
                    <View style={styles.imagePlaceholder}>
                        <FontAwesome5 name="bicycle" size={100} color="#aaa" />
                    </View>
                </View>

                {/* 商品标题 */}
                <ThemedText style={styles.detailTitle}>{itemData.title}</ThemedText>

                {/* 商品大段详细描述文本 */}
                <ThemedText style={styles.detailDescription}>
                    {itemData.description}
                </ThemedText>

                {/* 位置与品质并排信息栏 */}
                <View style={styles.infoMetaRow}>
                    {/* 位置 */}
                    <View style={styles.metaItem}>
                        <Ionicons name="location-sharp" size={20} color="#9BB886" />
                        <ThemedText style={styles.metaText}>{itemData.location}</ThemedText>
                    </View>

                    {/* 中间分割线 */}
                    <View style={styles.metaDivider} />

                    {/* 品质 */}
                    <View style={styles.metaItem}>
                        <Ionicons name="pricetag" size={18} color="#9BB886" style={styles.tagIconStyle} />
                        <ThemedText style={styles.metaText}>品质：{itemData.quality}</ThemedText>
                    </View>
                </View>

                {/* 右侧大收藏爱心按钮 */}
                <View style={styles.likeButtonWrapper}>
                    <Pressable onPress={toggleLike}>
                        <Ionicons
                            name={itemData.isLiked ? "heart" : "heart-outline"}
                            size={40}
                            color={itemData.isLiked ? "#FFB1B1" : "#C2C2C2"}
                        />
                    </Pressable>
                </View>

                {/* 中央“チャット”咨询聊天按钮 */}
                <Pressable
                    style={styles.chatButton}
                    onPress={() => router.push(`/messages/${itemData.id}`)}
                >
                    <Ionicons name="person" size={20} color="#555" />
                    <ThemedText style={styles.chatButtonText}>チャット</ThemedText>
                </Pressable>
            </ScrollView>

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
        backgroundColor: '#FFFFFF', // 详情页内部白底设计
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 140, // 为底部导航栏留出富余滚动空间
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginBottom: 10,
    },
    imageWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    imagePlaceholder: {
        width: '100%',
        height: 260,
        backgroundColor: '#EAE6DF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    detailDescription: {
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
        marginBottom: 24,
    },
    infoMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#EFEFEF',
        paddingVertical: 14,
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    tagIconStyle: {
        transform: [{ rotate: '90deg' }], // 让标签Icon角度微微倾斜
    },
    metaText: {
        fontSize: 15,
        color: '#555',
        fontWeight: '500',
    },
    metaDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#DDD',
    },
    likeButtonWrapper: {
        alignItems: 'flex-end',
        paddingRight: 10,
        marginBottom: 20,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3EFE4', // 匹配截屏设计中的沙滩米黄色按钮背景
        paddingVertical: 14,
        borderRadius: 24,
        gap: 8,
        marginHorizontal: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    chatButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444',
    },
    // ---- 底部通用五个导航栏菜单样式 (100%保持一致) ----
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