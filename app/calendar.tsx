import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

// 新宿区垃圾分类规则颜色和图标
const GARBAGE_TYPES = {
    BURNABLE: { label: '燃えるゴミ (火・金)', color: '#EF4444', icon: 'flame' },
    NON_BURNABLE: { label: '燃えないゴミ (第2・4土)', color: '#3B82F6', icon: 'close-circle-outline' },
    PLASTIC: { label: 'プラスチック (木)', color: '#F59E0B', icon: 'recycle' },
};

export default function CalendarScreen() {
    const router = useRouter();

    // 模拟新宿区5月份日历数据：5月1日是周五（前面留5个空白位格）
    const startDayOffset = 5;
    const totalDays = 31;

    // 新宿区规则逻辑：根据日期和星期计算该格子的颜色
    const getDayColor = (day: number) => {
        // 计算当前是星期几：1(Mon) - 7(Sun)
        const weekDay = (day + startDayOffset - 1) % 7 || 7;

        // 1. 周二、周五：燃えるゴミ (红色)
        if (weekDay === 2 || weekDay === 5) return GARBAGE_TYPES.BURNABLE.color;
        // 2. 周四：塑料资源 (橙色)
        if (weekDay === 4) return GARBAGE_TYPES.PLASTIC.color;

        // 3. 第2和第4个周六：不燃垃圾 (蓝色)
        const weekOfMonth = Math.ceil(day / 7);
        if (weekDay === 6 && (weekOfMonth === 2 || weekOfMonth === 4)) {
            return GARBAGE_TYPES.NON_BURNABLE.color;
        }

        // 其他日子无收集，返回纯白背景
        return '#FFFFFF';
    };

    // 渲染完整的日历格子矩阵
    const renderCalendarGrid = () => {
        const gridCells = [];

        // 1. 渲染月初前面的空白格子
        for (let i = 0; i < startDayOffset; i++) {
            gridCells.push(<View key={`empty-${i}`} style={styles.dateCell} />);
        }

        // 2. 渲染1号到31号的真实日期
        for (let d = 1; d <= totalDays; d++) {
            const bgColor = getDayColor(d);
            const isToday = d === 15; // 结合你主页显示的“明日5/16”，今天假设是5/15

            gridCells.push(
                <View
                    key={`day-${d}`}
                    style={[
                        styles.dateCell,
                        { backgroundColor: bgColor },
                        isToday && styles.todayCell
                    ]}
                >
                    <ThemedText style={[
                        styles.dateText,
                        bgColor !== '#FFFFFF' && { color: '#FFF', fontWeight: 'bold' },
                        isToday && { color: bgColor === '#FFFFFF' ? '#5B9E00' : '#FFF' }
                    ]}>
                        {d}
                    </ThemedText>
                </View>
            );
        }
        return gridCells;
    };

    return (
        <View style={styles.mainWrapper}>
            {/* 页面主内容区域，加上 ScrollView 防止未来数据多时产生溢出 */}
            <ScrollView contentContainerStyle={styles.contentBody}>

                {/* 1. 顶部地区与月份标题 */}
                <View style={styles.monthHeaderContainer}>
                    <ThemedText style={styles.monthTitleText}>2026年 5月</ThemedText>
                    <ThemedText style={styles.regionSubText}>当前地区：新宿区</ThemedText>
                </View>

                {/* 2. 白色日历大卡片容器 */}
                <View style={styles.calendarCard}>
                    {/* 星期表头 */}
                    <View style={styles.weekHeaderRow}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, index) => (
                            <ThemedText
                                key={w}
                                style={[
                                    styles.weekHeaderText,
                                    index === 0 && { color: '#EF4444' }, // 周日标红
                                    index === 6 && { color: '#3B82F6' }  // 周六标蓝
                                ]}
                            >
                                {w}
                            </ThemedText>
                        ))}
                    </View>

                    {/* 7列自动换行的日期矩阵网格 */}
                    <View style={styles.gridContainer}>
                        {renderCalendarGrid()}
                    </View>
                </View>

                {/* 3. 颜色分类对照说明栏（Legend） */}
                <View style={styles.legendContainer}>
                    <ThemedText style={styles.legendSectionTitle}>分類ルールの参考</ThemedText>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendColorBox, { backgroundColor: GARBAGE_TYPES.BURNABLE.color }]} />
                        <ThemedText style={styles.legendLabelText}>{GARBAGE_TYPES.BURNABLE.label}</ThemedText>
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendColorBox, { backgroundColor: GARBAGE_TYPES.PLASTIC.color }]} />
                        <ThemedText style={styles.legendLabelText}>{GARBAGE_TYPES.PLASTIC.label}</ThemedText>
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendColorBox, { backgroundColor: GARBAGE_TYPES.NON_BURNABLE.color }]} />
                        <ThemedText style={styles.legendLabelText}>{GARBAGE_TYPES.NON_BURNABLE.label}</ThemedText>
                    </View>
                </View>

            </ScrollView>

            {/* ================= 全局绿色底部选项卡菜单栏 (100% 对应主页样式) ================= */}
            <View style={styles.tabBarContainer}>
                <View style={styles.scanBackgroundCircle} />
                <View style={styles.tabBarBackground} />

                <View style={styles.tabBarContent}>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}>
                        <Octicons name="home" size={24} color="#555" />
                        <ThemedText style={styles.tabLabelBottom}>ホーム</ThemedText>
                    </Pressable>

                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}>
                        <FontAwesome5 name="calendar-alt" size={22} color="#5B9E00" />
                        <ThemedText style={[styles.tabLabelBottom, styles.tabLabelBottomActive]}>ゴミカレンダー</ThemedText>
                    </Pressable>

                    <View style={styles.scanWrapper}>
                        <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
                            <Ionicons name="scan-outline" size={26} color="#555" />
                        </Pressable>
                        <ThemedText style={styles.scanLabel}>ゴミスキャン</ThemedText>
                    </View>

                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse')}>
                        <Ionicons name="refresh-circle-outline" size={26} color="#555" />
                        <ThemedText style={styles.tabLabelBottom}>リユース</ThemedText>
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
        backgroundColor: '#F5F5F5',
    },
    contentBody: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 120, // 确保内容不被底部 95px 高度的菜单栏挡住
    },
    monthHeaderContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    monthTitleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    regionSubText: {
        fontSize: 14,
        color: '#76C800',
        fontWeight: '600',
        marginTop: 4,
    },
    // 日历白底卡片，延续主页的高级圆角阴影质感
    calendarCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },
    weekHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 8,
    },
    weekHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
        width: '14.28%',
        textAlign: 'center',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap', // 让 36 个格子自动排成多行
        justifyContent: 'flex-start',
    },
    dateCell: {
        width: '14.28%', // 100% / 7 列
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginVertical: 4,
    },
    dateText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    todayCell: {
        borderWidth: 2,
        borderColor: '#76C800', // 用主页的主题绿色圈出今天
    },
    // 规则参考样式
    legendContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    legendSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 14,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    legendColorBox: {
        width: 18,
        height: 18,
        borderRadius: 6,
        marginRight: 12,
    },
    legendLabelText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '500',
    },
    // ---- 底部通用五个导航栏菜单样式 (完全复制主页布局代码) ----
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