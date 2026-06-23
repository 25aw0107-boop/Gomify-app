// // app/calendar.tsx
// import { ThemedText } from '@/components/themed-text';
// import { TOKYO_GARBAGE_DATABASE } from '@/constants/garbageData';
// import { FontAwesome5, Ionicons, Octicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import React from 'react';
// import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

// export default function CalendarScreen() {
//     const router = useRouter();

//     const userWardId = "TYO-01";
//     const currentWardData = TOKYO_GARBAGE_DATABASE.find(w => w.ward_id === userWardId);
//     const garbageRules = currentWardData ? currentWardData.garbage_rules : [];

//     const startDayOffset = 5;
//     const totalDays = 31;

//     const weekDayCharMap: Record<number, string> = {
//         1: '月', 2: '火', 3: '水', 4: '木', 5: '金', 6: '土', 7: '日'
//     };

//     const getDayGarbageInfo = (day: number) => {
//         const weekDay = (day + startDayOffset - 1) % 7 || 7;
//         const currentWeekDayChar = weekDayCharMap[weekDay];
//         const weekOfMonth = Math.ceil(day / 7);

//         for (const rule of garbageRules) {
//             const dayInfo = rule.day_info_jp;

//             if (dayInfo && dayInfo.includes('第')) {
//                 if (currentWeekDayChar === '土' && dayInfo.includes('土')) {
//                     if (dayInfo.includes(String(weekOfMonth))) {
//                         return { color: rule.color };
//                     }
//                 }
//                 continue;
//             }

//             if (dayInfo && dayInfo.includes(currentWeekDayChar)) {
//                 return { color: rule.color };
//             }
//         }
//         return { color: '#FFFFFF' };
//     };

//     const renderCalendarGrid = () => {
//         const gridCells = [];
//         for (let i = 0; i < startDayOffset; i++) {
//             gridCells.push(<View key={`empty-${i}`} style={styles.dateCell} />);
//         }

//         for (let d = 1; d <= totalDays; d++) {
//             const { color: bgColor } = getDayGarbageInfo(d);
//             const isToday = d === 15;

//             gridCells.push(
//                 <View
//                     key={`day-${d}`}
//                     style={[
//                         styles.dateCell,
//                         { backgroundColor: bgColor },
//                         isToday && styles.todayCell
//                     ]}
//                 >
//                     <ThemedText style={[
//                         styles.dateText,
//                         bgColor !== '#FFFFFF' && { color: '#FFF', fontWeight: 'bold' },
//                         isToday && { color: bgColor === '#FFFFFF' ? '#76C800' : '#FFF' }
//                     ]}>
//                         {d}
//                     </ThemedText>
//                 </View>
//             );
//         }
//         return gridCells;
//     };

//     return (
//         <View style={styles.mainWrapper}>
//             <ScrollView contentContainerStyle={styles.contentBody} showsVerticalScrollIndicator={false}>
//                 <View style={styles.monthHeaderContainer}>
//                     <ThemedText style={styles.monthTitleText}>၂၀၂၆ ခုနှစ်၊ မေလ</ThemedText>
//                     <ThemedText style={styles.regionSubText}>
//                         လက်ရှိမြို့နယ်- {currentWardData ? `${currentWardData.ward_name_jp} (${currentWardData.ward_name_en})` : 'မရှိပါ'}
//                     </ThemedText>
//                 </View>

//                 <View style={styles.calendarCard}>
//                     <View style={styles.weekHeaderRow}>
//                         {['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'].map((w, index) => (
//                             <ThemedText
//                                 key={w}
//                                 style={[
//                                     styles.weekHeaderText,
//                                     index === 0 && { color: '#EF4444' },
//                                     index === 6 && { color: '#3B82F6' }
//                                 ]}
//                             >
//                                 {w.substring(0, 3)}
//                             </ThemedText>
//                         ))}
//                     </View>

//                     <View style={styles.gridContainer}>
//                         {renderCalendarGrid()}
//                     </View>
//                 </View>

//                 <View style={styles.legendContainer}>
//                     <ThemedText style={styles.legendSectionTitle}>အမှိုက်ခွဲခြားမှု လမ်းညွှန်ချက်များ</ThemedText>
//                     {garbageRules.map((rule) => (
//                         <View key={rule.item_id} style={styles.legendItem}>
//                             <View style={[styles.legendColorBox, { backgroundColor: rule.color }]} />
//                             <View style={styles.legendTextWrapper}>
//                                 <ThemedText style={styles.legendLabelText}>
//                                     {rule.category_jp} ({rule.day_info_jp})
//                                 </ThemedText>
//                                 <ThemedText style={styles.legendSubLabelText}>
//                                     {rule.category_mm} ({rule.day_info_mm}နေ့ပစ်ရန်)
//                                 </ThemedText>
//                             </View>
//                         </View>
//                     ))}
//                 </View>
//             </ScrollView>

//             {/* Navigation Menu Bar */}
//             <View style={styles.tabBarContainer}>
//                 <View style={styles.scanBackgroundCircle} />
//                 <View style={styles.tabBarBackground} />
//                 <View style={styles.tabBarContent}>
//                     <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}>
//                         <Octicons name="home" size={24} color="#555" />
//                         <ThemedText style={styles.tabLabelBottom}>ပင်မစာမျက်နှာ</ThemedText>
//                     </Pressable>
//                     <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}>
//                         <FontAwesome5 name="calendar-alt" size={22} color="#5B9E00" />
//                         <ThemedText style={[styles.tabLabelBottom, styles.tabLabelBottomActive]}>ပြက္ခဒိန်</ThemedText>
//                     </Pressable>
//                     <View style={styles.scanWrapper}>
//                         <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
//                             <Ionicons name="scan-outline" size={26} color="#555" />
//                         </Pressable>
//                         <ThemedText style={styles.scanLabel}>စကင်ဖတ်ရန်</ThemedText>
//                     </View>
//                     <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse')}>
//                         <Ionicons name="refresh-circle-outline" size={26} color="#555" />
//                         <ThemedText style={styles.tabLabelBottom}>ပြန်သုံးရန်</ThemedText>
//                     </Pressable>
//                     <Pressable style={styles.tabItemBottom} onPress={() => router.push('/mypage')}>
//                         <Ionicons name="person" size={22} color="#555" />
//                         <ThemedText style={styles.tabLabelBottom}>အကောင့်</ThemedText>
//                     </Pressable>
//                 </View>
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     mainWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
//     contentBody: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 120 },
//     monthHeaderContainer: { marginBottom: 20, alignItems: 'center' },
//     monthTitleText: { fontSize: 24, fontWeight: 'bold', color: '#000' },
//     regionSubText: { fontSize: 14, color: '#76C800', fontWeight: '600', marginTop: 4 },
//     calendarCard: { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 20, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 20 },
//     weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8 },
//     weekHeaderText: { fontSize: 12, fontWeight: '600', color: '#999', width: '14.28%', textAlign: 'center' },
//     gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
//     dateCell: { width: '14.28%', height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginVertical: 4 },
//     dateText: { fontSize: 15, color: '#333', fontWeight: '500' },
//     todayCell: { borderWidth: 2, borderColor: '#76C800' },
//     legendContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
//     legendSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 14 },
//     legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
//     legendColorBox: { width: 18, height: 18, borderRadius: 6, marginRight: 12 },
//     legendTextWrapper: { flex: 1 },
//     legendLabelText: { fontSize: 14, color: '#333', fontWeight: '600' },
//     legendSubLabelText: { fontSize: 12, color: '#666', marginTop: 2 },
//     tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end' },
//     tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
//     scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
//     tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
//     tabItemBottom: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
//     tabLabelBottom: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
//     tabLabelBottomActive: { color: '#5B9E00', fontWeight: 'bold' },
//     scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
//     scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 2 },
//     scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' }
// });

// app/calendar.tsx
import { ThemedText } from '@/components/themed-text';
import { TOKYO_GARBAGE_DATABASE } from '@/constants/garbageData';
import { FontAwesome5, Ionicons, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function CalendarScreen() {
    const router = useRouter();

    const userWardId = "TYO-01";
    const currentWardData = TOKYO_GARBAGE_DATABASE.find(w => w.ward_id === userWardId);
    const garbageRules = currentWardData ? currentWardData.garbage_rules : [];

    const startDayOffset = 5;
    const totalDays = 31;

    const weekDayCharMap: Record<number, string> = {
        1: '月', 2: '火', 3: '水', 4: '木', 5: '金', 6: '土', 7: '日'
    };

    const getDayGarbageInfo = (day: number) => {
        const weekDay = (day + startDayOffset - 1) % 7 || 7;
        const currentWeekDayChar = weekDayCharMap[weekDay];
        const weekOfMonth = Math.ceil(day / 7);

        for (const rule of garbageRules) {
            const dayInfo = rule.day_info_jp;

            if (dayInfo && dayInfo.includes('第')) {
                if (currentWeekDayChar === '土' && dayInfo.includes('土')) {
                    if (dayInfo.includes(String(weekOfMonth))) {
                        return { color: rule.color };
                    }
                }
                continue;
            }

            if (dayInfo && dayInfo.includes(currentWeekDayChar)) {
                return { color: rule.color };
            }
        }
        return { color: '#FFFFFF' };
    };

    const renderCalendarGrid = () => {
        const gridCells = [];
        for (let i = 0; i < startDayOffset; i++) {
            gridCells.push(<View key={`empty-${i}`} style={styles.dateCell} />);
        }

        for (let d = 1; d <= totalDays; d++) {
            const { color: bgColor } = getDayGarbageInfo(d);
            const isToday = d === 15;

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
                        isToday && { color: bgColor === '#FFFFFF' ? '#76C800' : '#FFF' }
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
            <ScrollView contentContainerStyle={styles.contentBody} showsVerticalScrollIndicator={false}>
                <View style={styles.monthHeaderContainer}>
                    <ThemedText style={styles.monthTitleText}>2026年 5月</ThemedText>
                    <ThemedText style={styles.regionSubText}>
                        現在の地域: {currentWardData ? currentWardData.ward_name_jp : '未設定'}
                    </ThemedText>
                </View>

                <View style={styles.calendarCard}>
                    <View style={styles.weekHeaderRow}>
                        {['日', '月', '火', '水', '木', '金', '土'].map((w, index) => (
                            <ThemedText
                                key={w}
                                style={[
                                    styles.weekHeaderText,
                                    index === 0 && { color: '#EF4444' },
                                    index === 6 && { color: '#3B82F6' }
                                ]}
                            >
                                {w}
                            </ThemedText>
                        ))}
                    </View>

                    <View style={styles.gridContainer}>
                        {renderCalendarGrid()}
                    </View>
                </View>

                <View style={styles.legendContainer}>
                    <ThemedText style={styles.legendSectionTitle}>ゴミ収集区分と指示</ThemedText>
                    {garbageRules.map((rule) => (
                        <View key={rule.item_id} style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: rule.color }]} />
                            <View style={styles.legendTextWrapper}>
                                <ThemedText style={styles.legendLabelText}>
                                    {rule.category_jp} ({rule.day_info_jp}曜)
                                </ThemedText>
                                <ThemedText style={styles.legendSubLabelText}>
                                    {rule.instructions_jp}
                                </ThemedText>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Navigation Menu Bar */}
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
                        <ThemedText style={[styles.tabLabelBottom, styles.tabLabelBottomActive]}>カレンダー</ThemedText>
                    </Pressable>
                    <View style={styles.scanWrapper}>
                        <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
                            <Ionicons name="scan-outline" size={26} color="#555" />
                        </Pressable>
                        <ThemedText style={styles.scanLabel}>スキャン</ThemedText>
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
    mainWrapper: { flex: 1, backgroundColor: '#F5F5F5' },
    contentBody: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 120 },
    monthHeaderContainer: { marginBottom: 20, alignItems: 'center' },
    monthTitleText: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    regionSubText: { fontSize: 14, color: '#76C800', fontWeight: '600', marginTop: 4 },
    calendarCard: { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 20, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 20 },
    weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8 },
    weekHeaderText: { fontSize: 14, fontWeight: '600', color: '#999', width: '14.28%', textAlign: 'center' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    dateCell: { width: '14.28%', height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginVertical: 4 },
    dateText: { fontSize: 15, color: '#333', fontWeight: '500' },
    todayCell: { borderWidth: 2, borderColor: '#76C800' },
    legendContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    legendSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    legendColorBox: { width: 18, height: 18, borderRadius: 6, marginRight: 12 },
    legendTextWrapper: { flex: 1 },
    legendLabelText: { fontSize: 14, color: '#333', fontWeight: '600' },
    legendSubLabelText: { fontSize: 12, color: '#666', marginTop: 2 },
    tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, justifyContent: 'flex-end' },
    tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
    scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
    tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
    tabItemBottom: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
    tabLabelBottom: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
    tabLabelBottomActive: { color: '#5B9E00', fontWeight: 'bold' },
    scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
    scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 2 },
    scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' }
});