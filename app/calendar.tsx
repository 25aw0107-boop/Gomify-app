import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
// Lade till MaterialCommunityIcons för att få tillgång till "fire-off" ikonen
import { Ionicons, FontAwesome5, Octicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/config/supabase';

export default function CalendarScreen() {
    const router = useRouter();

    const [selectedAreaId, setSelectedAreaId] = useState<number>(9999); 
    const [isCurrentChiyoda, setIsCurrentChiyoda] = useState<boolean>(true);
    const [allAreas, setAllAreas] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState<boolean>(false);

    const [areaName, setAreaName] = useState<string>('千代田区（麹町一〜六丁目の偶数番地・二番町・六番町）');
    const [dbRules, setDbRules] = useState<any[]>([]); 
    const [loading, setLoading] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const isFirstMonth = year === 2026 && month === 3; 
    const isLastMonth = year === 2027 && month === 0;  

    useEffect(() => {
        const fetchAreasAndTypes = async () => {
            try {
                const { data: dbAreas } = await supabase.from('areas').select('*');
                
                const chiyodaAreas = [
                    { id: 9999, name: '千代田区（麹町一〜六丁目の偶数番地・二番町・六番町）', isChiyoda: true, matchKey: 'chiyoda kojimachi 千代田区 麹町' },
                    { id: 9998, name: '千代田区（飯田橋・九段北・九段下・富士見）', isChiyoda: true, matchKey: 'chiyoda kudan iidabashi fujimi 千代田区 九段 下 北' }
                ];

                if (dbAreas) {
                    const mappedDbAreas = dbAreas.map(a => ({
                        ...a,
                        isChiyoda: false,
                        matchKey: a.name.toLowerCase()
                    }));
                    setAllAreas([...chiyodaAreas, ...mappedDbAreas]);
                } else {
                    setAllAreas(chiyodaAreas);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchAreasAndTypes();
    }, []);

    useEffect(() => {
        const fetchRulesIfNeeded = async () => {
            if (isCurrentChiyoda) {
                setDbRules([]); 
                return;
            }

            setLoading(true);
            try {
                const { data: areaRules } = await supabase
                    .from('collection_rules')
                    .select('*')
                    .eq('area_id', selectedAreaId);
                
                if (areaRules) {
                    setDbRules(areaRules);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (allAreas.length > 0) {
            fetchRulesIfNeeded();
        }
    }, [selectedAreaId, isCurrentChiyoda, allAreas]);

    const goToPreviousMonth = () => {
        if (year === 2026 && month > 3) {
            setCurrentDate(new Date(year, month - 1, 1));
        } else if (year === 2027 && month === 0) {
            setCurrentDate(new Date(2026, 11, 1));
        }
    };

    const goToNextMonth = () => {
        if (year === 2026 && month < 11) {
            setCurrentDate(new Date(year, month + 1, 1));
        } else if (year === 2026 && month === 11) {
            setCurrentDate(new Date(2027, 0, 1));
        }
    };

    const getDayInfos = (currentYear: number, currentMonth: number, day: number) => {
        const dateObj = new Date(currentYear, currentMonth, day);
        const dayOfWeek = dateObj.getDay(); 
        const nthWeekday = Math.ceil(day / 7);

        if (isCurrentChiyoda) {
            if (currentYear === 2026 && currentMonth === 11 && day === 31) return [{ id: 5, color: '#757575', isTextWhite: true }];
            if (currentYear === 2027 && currentMonth === 0 && (day === 1 || day === 2)) return [{ id: 5, color: '#757575', isTextWhite: true }];

            if (dayOfWeek === 3 || dayOfWeek === 6) return [{ id: 1, color: '#DC2626', isTextWhite: true }];
            if (dayOfWeek === 4) return [{ id: 4, color: '#EAB308', isTextWhite: true }]; // Ändrad till en gulare färg
            if (dayOfWeek === 1) return [{ id: 3, color: '#16A34A', isTextWhite: true }];

            if (dayOfWeek === 2) { 
                if (currentYear === 2026) {
                    if (currentMonth === 3 && (day === 7 || day === 21)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                    if (currentMonth === 4 && (day === 5 || day === 19)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                    if (currentMonth === 5 && (day === 2 || day === 16)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                    if (currentMonth === 6 && (day === 7 || day === 21)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                    if (currentMonth === 7 && (day === 4 || day === 18)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                    if (currentMonth === 8 && (day === 1 || day === 15)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                    if (currentMonth === 9 && (day === 6 || day === 20)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                    if (currentMonth === 10 && (day === 3 || day === 17)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                    if (currentMonth === 11 && (day === 1 || day === 15)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
                }
                if (currentYear === 2027 && currentMonth === 0 && (day === 5 || day === 19)) return [{ id: 2, color: '#2563EB', isTextWhite: true }];
            }
            return [];
        }

        const dbWeekDayNum = dayOfWeek === 0 ? 7 : dayOfWeek; 
        
        const matchingRules = dbRules.filter(rule => {
            if (rule.day_of_week !== dbWeekDayNum) return false;
            if (rule.week_of_month === null) return true; 
            return rule.week_of_month === nthWeekday; 
        });

        const clearColors: { [key: number]: string } = { 
            1: '#DC2626', // 可燃 (赤)
            2: '#2563EB', // 不燃 (青)
            3: '#16A34A', // 資源 (緑)
            4: '#EAB308'  // プラ (Gulare färg)
        };

        return matchingRules.map(rule => ({
            id: rule.garbage_type_id,
            color: clearColors[rule.garbage_type_id] || '#757575',
            isTextWhite: true
        }));
    };

    const renderGarbageIcon = (typeId: number, index: number) => {
        if (typeId === 1) {
            return (
                <View key={index} style={styles.iconBadge}>
                    <Ionicons name="flame-outline" size={14} color="#FFF" />
                    <ThemedText style={[styles.miniGridText, {color: '#FFF'}]}>可燃</ThemedText>
                </View>
            );
        }
        if (typeId === 2) {
            return (
                <View key={index} style={styles.iconBadge}>
                    {/* Använder MaterialCommunityIcons för "fire-off" (eld med streck) */}
                    <MaterialCommunityIcons name="fire-off" size={14} color="#FFF" />
                    <ThemedText style={[styles.miniGridText, {color: '#FFF'}]}>不燃</ThemedText>
                </View>
            );
        }
        if (typeId === 3) {
            return (
                <View key={index} style={styles.iconBadge}>
                    {/* Ändrat till tidningsikon */}
                    <Ionicons name="newspaper-outline" size={14} color="#FFF" />
                    <ThemedText style={[styles.miniGridText, {color: '#FFF'}]}>資源</ThemedText>
                </View>
            );
        }
        if (typeId === 4) {
            return (
                <View key={index} style={styles.iconBadge}>
                    <Ionicons name="cube-outline" size={13} color="#FFF" />
                    <ThemedText style={[styles.miniGridText, {color: '#FFF'}]}>プラ</ThemedText>
                </View>
            );
        }
        if (typeId === 5) return <ThemedText key={index} style={{fontSize: 9, color: '#FFF', fontWeight: 'bold'}}>休み</ThemedText>;
        return null;
    };

    const renderCalendarGrid = () => {
        const gridCells = [];
        const today = new Date();

        for (let i = 0; i < firstDayOfMonth; i++) {
            gridCells.push(<View key={`empty-${i}`} style={styles.dateCell} />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayInfos = getDayInfos(year, month, d);
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasEvents = dayInfos.length > 0;
            const isTextWhite = hasEvents; 

            gridCells.push(
                <View key={`day-${d}`} style={[ styles.dateCell, isToday && styles.todayCell ]}>
                    
                    <View style={styles.cellBackgroundWrapper}>
                        {dayInfos.map((info, index) => (
                            <View key={index} style={{ flex: 1, backgroundColor: info.color }} />
                        ))}
                    </View>

                    <ThemedText style={[
                        styles.dateText, 
                        isTextWhite && { color: '#FFF', fontWeight: 'bold' },
                        isToday && !hasEvents && { color: '#76C800', fontWeight: 'bold' }
                    ]}>
                        {d}
                    </ThemedText>

                    <View style={styles.labelContainerInside}>
                        {dayInfos.map((info, index) => renderGarbageIcon(info.id, index))}
                    </View>
                </View>
            );
        }
        return gridCells;
    };

    const filteredAreas = allAreas.filter(area => {
        const query = searchQuery.toLowerCase();
        return area.name.toLowerCase().includes(query) || area.matchKey.includes(query);
    });

    return (
        <View style={styles.mainWrapper}>
            <ScrollView contentContainerStyle={styles.contentBody}>
                
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="区名や地域名で検索 (例: 渋谷区 上原, 笹塚)"
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            setShowDropdown(text.length > 0);
                        }}
                    />
                </View>

                {showDropdown && (
                    <View style={styles.dropdownContainer}>
                        {filteredAreas.length > 0 ? (
                            filteredAreas.map(area => (
                                <Pressable key={`${area.id}-${area.isChiyoda}`} style={styles.dropdownItem} onPress={() => {
                                    setSelectedAreaId(area.id);
                                    setIsCurrentChiyoda(area.isChiyoda);
                                    setAreaName(area.name);
                                    setSearchQuery('');
                                    setShowDropdown(false);
                                }}>
                                    <Ionicons name="location-outline" size={16} color="#76C800" style={{ marginRight: 8 }} />
                                    <ThemedText style={styles.dropdownItemText}>{area.name}</ThemedText>
                                </Pressable>
                            ))
                        ) : (
                            <View style={styles.dropdownItem}>
                                <ThemedText style={styles.dropdownItemText}>見つかりませんでした</ThemedText>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.headerRow}>
                    <Pressable onPress={goToPreviousMonth} disabled={isFirstMonth} style={[styles.arrowButton, isFirstMonth && { opacity: 0.2 }]}>
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </Pressable>
                    
                    <View style={styles.headerTitleContainer}>
                        <ThemedText style={styles.monthTitleText}>{year}年 {month + 1}月</ThemedText>
                        <ThemedText style={styles.regionSubText}>現在のエリア：{areaName}</ThemedText>
                    </View>

                    <Pressable onPress={goToNextMonth} disabled={isLastMonth} style={[styles.arrowButton, isLastMonth && { opacity: 0.2 }]}>
                        <Ionicons name="chevron-forward" size={28} color="#333" />
                    </Pressable>
                </View>

                <View style={styles.calendarCard}>
                    <View style={styles.weekHeaderRow}>
                        {['日', '月', '火', '水', '木', '金', '土'].map((w, index) => (
                            <ThemedText key={w} style={[styles.weekHeaderText, index === 0 && { color: '#EF4444' }, index === 6 && { color: '#3B82F6' }]}>
                                {w}
                            </ThemedText>
                        ))}
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#76C800" style={{ marginVertical: 40 }} />
                    ) : (
                        <View style={styles.gridContainer}>
                            {renderCalendarGrid()}
                        </View>
                    )}
                </View>

                {/* Clear color legend */}
                <View style={styles.legendContainer}>
                    <ThemedText style={styles.legendSectionTitle}>資源とごみの収集区分</ThemedText>
                    <View style={styles.legendGrid}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, {backgroundColor: '#DC2626'}]}>
                                <Ionicons name="flame-outline" size={12} color="#FFF" />
                            </View>
                            <ThemedText style={styles.legendLabelText}>可燃ごみ</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, {backgroundColor: '#2563EB'}]}>
                                <MaterialCommunityIcons name="fire-off" size={14} color="#FFF" />
                            </View>
                            <ThemedText style={styles.legendLabelText}>不燃ごみ</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, {backgroundColor: '#16A34A'}]}>
                                <Ionicons name="newspaper-outline" size={12} color="#FFF" />
                            </View>
                            <ThemedText style={styles.legendLabelText}>資源</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, {backgroundColor: '#EAB308'}]}>
                                <Ionicons name="cube-outline" size={12} color="#FFF" />
                            </View>
                            <ThemedText style={styles.legendLabelText}>プラ容器包装</ThemedText>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
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
    mainWrapper: { flex: 1, backgroundColor: '#F8F9FA' },
    contentBody: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 120 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14, height: 46, marginTop: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#333' },
    dropdownContainer: { backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 6, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0', zIndex: 99, elevation: 5 },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    dropdownItemText: { fontSize: 14, color: '#333' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    headerTitleContainer: { alignItems: 'center', flex: 1 },
    arrowButton: { padding: 6 },
    monthTitleText: { fontSize: 22, fontWeight: 'bold', color: '#111' },
    regionSubText: { fontSize: 11, color: '#666', marginTop: 2, textAlign: 'center' },
    calendarCard: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, borderWidth: 1, borderColor: '#E0E0E0' },
    weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
    weekHeaderText: { fontSize: 14, fontWeight: '600', color: '#777', width: '14.28%', textAlign: 'center' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    dateCell: { width: '14.28%', height: 64, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4, borderWidth: 0.5, borderColor: '#EEEEEE', borderRadius: 4, overflow: 'hidden', position: 'relative' },
    cellBackgroundWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
    dateText: { fontSize: 12, color: '#444', marginBottom: 1, zIndex: 2 },
    labelContainerInside: { flex: 1, flexDirection: 'row', gap: 2, justifyContent: 'center', alignItems: 'center', width: '100%', zIndex: 2 },
    iconBadge: { alignItems: 'center', justifyContent: 'center' },
    miniGridText: { fontSize: 9, fontWeight: 'bold', marginTop: 1 },
    todayCell: { borderWidth: 3, borderColor: '#76C800' },
    legendContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#E0E0E0' },
    legendSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    legendGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    legendItem: { flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 10 },
    legendColorBox: { width: 24, height: 24, borderRadius: 6, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
    legendLabelText: { fontSize: 12, color: '#555', fontWeight: '500' },
    tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, zIndex: 10, justifyContent: 'flex-end' },
    tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#D1E0C5', zIndex: 1 },
    scanBackgroundCircle: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1E0C5', zIndex: 1 },
    tabBarContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 5, height: 95, zIndex: 2 },
    tabItemBottom: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 60 },
    tabLabelBottom: { fontSize: 9, color: '#555', marginTop: 4, fontWeight: '600', textAlign: 'center' },
    tabLabelBottomActive: { color: '#5B9E00', fontWeight: 'bold' },
    scanWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, height: 95 },
    scanButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 2 },
    scanLabel: { fontSize: 9, color: '#555', marginTop: 2, fontWeight: '700', textAlign: 'center' },
});