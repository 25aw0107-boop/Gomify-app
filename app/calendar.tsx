import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '../lib/supabase';

const colorMap: Record<string, { id: number; color: string }> = {
    '可燃ごみ': { id: 1, color: '#DC2626' },
    '不燃ごみ': { id: 2, color: '#2563EB' },
    '燃やすごみ': { id: 1, color: '#DC2626' },
    '金属・陶器・ガラスごみ': { id: 3, color: '#2563EB' },
    '資源': { id: 3, color: '#16A34A' },
    '古紙': { id: 3, color: '#16A34A' },
    '資源プラスチック': { id: 4, color: '#EAB308' },
    'プラスチック': { id: 4, color: '#EAB308' },
    'プラ': { id: 4, color: '#EAB308' },
    '容器包装プラスチック': { id: 4, color: '#EAB308' },
    'プラ容器包装': { id: 4, color: '#EAB308' },
    '金属・陶器・ガラス': { id: 2, color: '#2563EB' },
    '燃やさないごみ': { id: 2, color: '#2563EB' },
    '不燃小物類': { id: 2, color: '#2563EB' },
    '燃えないごみ': { id: 2, color: '#2563EB' },
    '陶器・ガラス・金属ごみ': { id: 2, color: '#2563EB' },
};

export default function CalendarScreen() {
    const router = useRouter();

    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
    const [areaName, setAreaName] = useState<string>('読み込み中...');

    const [allAreas, setAllAreas] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
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
        const initializeData = async () => {
            setLoading(true);
            try {
                let allFetchedAreas: any[] = [];
                let page = 0;
                const pageSize = 1000;
                let hasMore = true;

            
                while (hasMore) {
                    const { data, error } = await supabase
                        .from('areas')
                        .select('area_id, area_name_jp, ward_id')
                        .range(page * pageSize, (page + 1) * pageSize - 1);

                    if (error) {
                        console.error("エラーが発生しました:", error.message);
                        break;
                    }

                    if (data && data.length > 0) {
                        allFetchedAreas = [...allFetchedAreas, ...data];
                        if (data.length < pageSize) {
                            hasMore = false; 
                        } else {
                            page++; 
                        }
                    } else {
                        hasMore = false;
                    }
                }

                console.log(`[DEBUG]  ${allFetchedAreas.length} .`);

                let parsedAreas: any[] = [];
                if (allFetchedAreas.length > 0) {
                    parsedAreas = allFetchedAreas.map(a => {
                        let fullName = a.area_name_jp;
                        
                        const wardMap: { [key: number]: string } = {
                            1: '新宿区', 2: '北区', 3: '板橋区', 4: '練馬区', 5: '台東区', 6: '墨田区', 7: '江東区', 8: '荒川区',
                            9: '足立区', 10: '葛飾区', 11: '渋谷区', 12: '港区', 13: '中央区',
                            14: '千代田区', 15: '品川区', 16: '目黒区', 17: '大田区', 18: '世田谷区',
                            19: '中野区', 20: '杉並区', 21: '豊島区', 22: '文京区',
                            23: '江戸川区', 
                        };

                        const wardName = wardMap[a.ward_id];

                        if (wardName && !a.area_name_jp.includes(wardName)) {
                            fullName = `${wardName} ${a.area_name_jp}`;
                        }

                        return {
                            id: a.area_id,
                            name: fullName,
                            matchKey: fullName
                        };
                    });
                    
                    setAllAreas(parsedAreas);

                   
                }

               
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('city, address')
                        .eq('id', user.id)
                        .single();

                    if (profile && profile.city) {
                        const userCity = profile.city; 
                        
                        const matchedArea = parsedAreas.find(area =>
                            area.name.includes(userCity) || userCity.includes(area.name)
                        );

                        if (matchedArea) {
                            setSelectedAreaId(matchedArea.id);
                            setAreaName(matchedArea.name);
                            setLoading(false);
                            return;
                        }
                    }
                }

                if (parsedAreas.length > 0) {
                    setSelectedAreaId(parsedAreas[0].id);
                    setAreaName(parsedAreas[0].name);
                }

            } catch (err) {
                console.error("エラーが発生しました:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, []);



    
    useEffect(() => {
        const fetchRules = async () => {
            if (!selectedAreaId) return;

            setLoading(true);
            try {
             
                const { data: areaRules, error } = await supabase
                    .from('collection_rules')
                    .select('*')
                    .eq('area_id', selectedAreaId);

                if (areaRules) {
                    setDbRules(areaRules);
                }
            } catch (err) {
                console.error("エラーが発生しました:", err);
            } finally {
                setLoading(false);
            }
        };

        if (allAreas.length > 0) {
            fetchRules();
        }
    }, [selectedAreaId, allAreas]);

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

        const jaWeekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const currentJaDay = jaWeekdays[dayOfWeek];

        const matchingRules = dbRules.filter(rule => {
            if (!rule.day_of_week) return false;
            return rule.day_of_week.includes(currentJaDay);
        });

        const uniqueRules = matchingRules.filter((rule, index, self) =>
            index === self.findIndex((r) => r.garbage_type === rule.garbage_type)
        );

        return uniqueRules.map(rule => {
            const rawType = rule.garbage_type ? String(rule.garbage_type) : '';
            const cleanType = rawType.replace(/[\r\n\s\u3000]+/g, '');

            const typeInfo = colorMap[cleanType] || { id: 99, color: '#757575' };
            return {
                id: typeInfo.id,
                color: typeInfo.color,
                isTextWhite: true
            };
        });
    };

    const renderGarbageIcon = (typeId: number, index: number) => {
        if (typeId === 1) {
            return (
                <View key={index} style={styles.iconBadge}>
                    <Ionicons name="flame-outline" size={14} color="#FFF" />
                    <ThemedText style={[styles.miniGridText, { color: '#FFF' }]}>可燃</ThemedText>
                </View>
            );
        }
        if (typeId === 2) {
            return (
                <View key={index} style={styles.iconBadge}>
                    <MaterialCommunityIcons name="fire-off" size={14} color="#FFF" />
                    <ThemedText style={[styles.miniGridText, { color: '#FFF' }]}>不燃</ThemedText>
                </View>
            );
        }
        if (typeId === 3) {
            return (
                <View key={index} style={styles.iconBadge}>
                    <Ionicons name="newspaper-outline" size={14} color="#FFF" />
                    <ThemedText style={[styles.miniGridText, { color: '#FFF' }]}>資源</ThemedText>
                </View>
            );
        }
        if (typeId === 4) {
            return (
                <View key={index} style={styles.iconBadge}>
                    <Ionicons name="cube-outline" size={13} color="#FFF" />
                    <ThemedText style={[styles.miniGridText, { color: '#FFF' }]}>プラ</ThemedText>
                </View>
            );
        }
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
                <View key={`day-${d}`} style={[styles.dateCell, isToday && styles.todayCell]}>
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
                        placeholder="他の区名や地域名で検索"
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
                                <Pressable key={area.id} style={styles.dropdownItem} onPress={() => {
                                    setSelectedAreaId(area.id);
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

                <View style={styles.legendContainer}>
                    <ThemedText style={styles.legendSectionTitle}>資源とごみの収集区分</ThemedText>
                    <View style={styles.legendGrid}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: '#DC2626' }]}>
                                <Ionicons name="flame-outline" size={12} color="#FFF" />
                            </View>
                            <ThemedText style={styles.legendLabelText}>可燃ごみ</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: '#2563EB' }]}>
                                <MaterialCommunityIcons name="fire-off" size={14} color="#FFF" />
                            </View>
                            <ThemedText style={styles.legendLabelText}>不燃ごみ</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: '#16A34A' }]}>
                                <Ionicons name="newspaper-outline" size={12} color="#FFF" />
                            </View>
                            <ThemedText style={styles.legendLabelText}>資源</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: '#EAB308' }]}>
                                <Ionicons name="cube-outline" size={12} color="#FFF" />
                            </View>
                            <ThemedText style={styles.legendLabelText}>プラ容器包装</ThemedText>
                        </View>
                    </View>
                </View>
            </ScrollView>


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
        backgroundColor: '#F8F9FA',
    },

    contentBody: {
        paddingTop: 18,
        paddingHorizontal: 20,
        paddingBottom: 140,
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 50,
        marginTop: 20,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },

    searchIcon: {
        marginRight: 10,
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },

    dropdownContainer: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        paddingVertical: 8,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        zIndex: 99,
        elevation: 5,
    },

    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },

    dropdownItemText: {
        fontSize: 14,
        color: '#333',
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    headerTitleContainer: {
        alignItems: 'center',
        flex: 1,
    },

    arrowButton: {
        padding: 8,
    },

    monthTitleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
    },

    regionSubText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },

    calendarCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },

    weekHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },

    weekHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#777',
        width: '14.28%',
        textAlign: 'center',
    },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    dateCell: {
        width: '14.28%',
        height: 72,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 6,
        borderWidth: 0.5,
        borderColor: '#EEEEEE',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
    },

    cellBackgroundWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
    },

    dateText: {
        fontSize: 12,
        color: '#444',
        marginBottom: 3,
        zIndex: 2,
    },

    labelContainerInside: {
        flex: 1,
        flexDirection: 'row',
        gap: 3,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        zIndex: 2,
    },

    iconBadge: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    miniGridText: {
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: 2,
    },

    todayCell: {
        borderWidth: 3,
        borderColor: '#76C800',
    },

    legendContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },

    legendSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },

    legendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
        marginBottom: 14,
    },

    legendColorBox: {
        width: 28,
        height: 28,
        borderRadius: 7,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    legendLabelText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '500',
    },

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
    