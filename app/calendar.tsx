import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import { useRouter, useFocusEffect, usePathname } from 'expo-router';
import { Ionicons, FontAwesome5, Octicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '../lib/supabase';
import { useAppTheme } from './tema/ThemeContext';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = width <= 360 ? 14 : 20;




// Standard Ljust Läge
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

// Kawaii Läge
const kawaiicolormap: Record<string, { id: number; color: string }> = {
    '可燃ごみ': { id: 1, color: '#f9b7b7' },
    '不燃ごみ': { id: 2, color: '#a3b2d4' },
    '燃やすごみ': { id: 1, color: '#f9b7b7' },
    '金属・陶器・ガラスごみ': { id: 3, color: '#a3b2d4' },
    '資源': { id: 3, color: '#A4C3A2' },
    '古紙': { id: 3, color: '#A4C3A2' },
    '資源プラスチック': { id: 4, color: '#f1dd9a' },
    'プラスチック': { id: 4, color: '#E4CE88' },
    'プラ': { id: 4, color: '#E4CE88' },
    '容器包装プラスチック': { id: 4, color: '#E4CE88' },
    'プラ容器包装': { id: 4, color: '#E4CE88' },
    '金属・陶器・ガラス': { id: 2, color: '#a3b2d4' },
    '燃やさないごみ': { id: 2, color: '#a3b2d4' },
    '不燃小物類': { id: 2, color: '#a3b2d4' },
    '燃えないごみ': { id: 2, color: '#a3b2d4' },
    '陶器・ガラス・金属ごみ': { id: 2, color: '#a3b2d4' },
};

// Cafe Läge
const cafeColorMap: Record<string, { id: number; color: string }> = {
    '可燃ごみ': { id: 1, color: '#A06E5D' },
    '不燃ごみ': { id: 2, color: '#6A7B82' },
    '燃やすごみ': { id: 1, color: '#A06E5D' },
    '金属・陶器・ガラスごみ': { id: 3, color: '#6A7B82' },
    '資源': { id: 3, color: '#859873' },
    '古紙': { id: 3, color: '#859873' },
    '資源プラスチック': { id: 4, color: '#D4B872' },
    'プラスチック': { id: 4, color: '#D4B872' },
    'プラ': { id: 4, color: '#D4B872' },
    '容器包装プラスチック': { id: 4, color: '#D4B872' },
    'プラ容器包装': { id: 4, color: '#D4B872' },
    '金属・陶器・ガラス': { id: 2, color: '#6A7B82' },
    '燃やさないごみ': { id: 2, color: '#6A7B82' },
    '不燃小物類': { id: 2, color: '#6A7B82' },
    '燃えないごみ': { id: 2, color: '#6A7B82' },
    '陶器・ガラス・金属ごみ': { id: 2, color: '#6A7B82' },
};

// Night Läge
const darkColorMap: Record<string, { id: number; color: string }> = {
    '可燃ごみ': { id: 1, color: '#8e4343' },
    '不燃ごみ': { id: 2, color: '#57719c' },
    '燃やすごみ': { id: 1, color: '#8e4343' },
    '金属・陶器・ガラスごみ': { id: 3, color: '#57719c' },
    '資源': { id: 3, color: '#4b7c6c' },
    '古紙': { id: 3, color: '#4b7c6c' },
    '資源プラスチック': { id: 4, color: '#b39664' },
    'プラスチック': { id: 4, color: '#b39664' },
    'プラ': { id: 4, color: '#b39664' },
    '容器包装プラスチック': { id: 4, color: '#b39664' },
    'プラ容器包装': { id: 4, color: '#b39664' },
    '金属・陶器・ガラス': { id: 2, color: '#57719c' },
    '燃やさないごみ': { id: 2, color: '#57719c' },
    '不燃小物類': { id: 2, color: '#57719c' },
    '燃えないごみ': { id: 2, color: '#57719c' },
    '陶器・ガラス・金属ごみ': { id: 2, color: '#57719c' },
};

export default function CalendarScreen() {
    const router = useRouter();

    // --- STRUKTURERAD TEMALOGIK ---
    const { selectedDesign } = useAppTheme();
    const pathname = usePathname();
    const isKawaii = selectedDesign === 'cute';
    const isNight = selectedDesign === 'night';
    const isCafe = selectedDesign === 'cafe';

    // Färgkonstanter exakt som Dashboard
    const mainBackgroundColor = isNight ? '#000000' : isKawaii ? '#FCF5F0' : isCafe ? '#F9F6F0' : '#F5F5F5';
    const cardBg = isNight ? '#1C2432' : isKawaii ? '#FFFDFB' : isCafe ? '#FFFDF9' : '#FFF';
    const accentTextColor = isNight ? '#d4d09c' : isKawaii ? '#6B4E3C' : isCafe ? '#4A3B32' : '#111111';
    const subTextColor = isNight ? '#d4d09c' : isKawaii ? '#8E7B71' : isCafe ? '#8E7B71' : '#666666';
    const accentPrimaryColor = isNight ? '#A6C56F' : isKawaii ? '#A4C3A2' : isCafe ? '#8B5E3C' : '#76C800';
    const borderThemeColor = isNight ? '#9288da' : isKawaii ? '#F2EDE9' : isCafe ? '#EAE1D5' : '#E0E0E0';
    const placeholderColor = isNight ? '#556275' : isKawaii ? '#C5B8B1' : isCafe ? '#C5B8B1' : '#999';

    // Footer/TabBar-färger
    const tabBarBgColor = isNight ? '#1C2432' : isKawaii ? '#E6F0E3' : isCafe ? '#F2EBE3' : '#D1E0C5';
    const kawaiiPeachPink = '#F4A396';
    const tabActiveColor = isKawaii ? kawaiiPeachPink : isNight ? '#A6C56F' : isCafe ? '#8B5E3C' : '#5B9E00';
    const tabInactiveColor = isKawaii ? kawaiiPeachPink : isNight ? '#7A8B9E' : isCafe ? '#B8A89A' : '#555555';
    const isHomeActive = pathname === '/dashboard';
    const isCalendarActive = pathname === '/calendar';
    // ---------------------------------------------

    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
    const saveSelectedArea = async (areaId: number, areaName: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
            .from("profiles")
            .update({ selected_area_id: areaId, city: areaName })
            .eq("id", user.id);
    };
    
    const [areaName, setAreaName] = useState<string>('読み込み中...');
    const [allAreas, setAllAreas] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [dbRules, setDbRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(() => new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const isFirstMonth = year === 2026 && month === 3;
    const isLastMonth = year === 2027 && month === 0;

    useFocusEffect(
        useCallback(() => {
            initializeData();
        }, [])
    );

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

                if (error) break;

                if (data && data.length > 0) {
                    allFetchedAreas = [...allFetchedAreas, ...data];
                    if (data.length < pageSize) hasMore = false; 
                    else page++; 
                } else {
                    hasMore = false;
                }
            }

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
                    return { id: a.area_id, name: fullName, matchKey: fullName };
                });
                
                setAllAreas(parsedAreas);
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('selected_area_id, city')
                    .eq('id', user.id)
                    .single();

                if (profile && profile.selected_area_id) {
                    setSelectedAreaId(profile.selected_area_id);
                    setAreaName(profile.city || "エリア設定済み");
                    setLoading(false);
                    return;
                }
            }

            if (parsedAreas.length > 0) {
                setSelectedAreaId(parsedAreas[0].id);
                setAreaName(parsedAreas[0].name);
                await saveSelectedArea(parsedAreas[0].id, parsedAreas[0].name);
            }
        } catch (err) {
            console.error("Fel:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchRules = async () => {
            if (!selectedAreaId) return;
            setLoading(true);
            try {
                const { data: areaRules } = await supabase
                    .from('collection_rules')
                    .select('*')
                    .eq('area_id', selectedAreaId);

                if (areaRules && areaRules.length > 0) {
                    setDbRules(areaRules);
                } else {
                    setDbRules([]);
                }
            } catch (err) {
                setDbRules([]);
            } finally {
                setLoading(false);
            }
        };

        if (selectedAreaId) fetchRules();
    }, [selectedAreaId]);

    const goToPreviousMonth = () => {
        if (year === 2026 && month > 3) setCurrentDate(new Date(year, month - 1, 1));
        else if (year === 2027 && month === 0) setCurrentDate(new Date(2026, 11, 1));
    };

    const goToNextMonth = () => {
        if (year === 2026 && month < 11) setCurrentDate(new Date(year, month + 1, 1));
        else if (year === 2026 && month === 11) setCurrentDate(new Date(2027, 0, 1));
    };

    const getDayInfos = (currentYear: number, currentMonth: number, day: number) => {
        const dateObj = new Date(currentYear, currentMonth, day);
        const dayOfWeek = dateObj.getDay();
        const jaWeekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const currentJaDay = jaWeekdays[dayOfWeek];

        const matchingRules = dbRules.filter(rule => rule.day_of_week && rule.day_of_week.includes(currentJaDay));
        const uniqueRules = matchingRules.filter((rule, index, self) =>
            index === self.findIndex((r) => r.garbage_type === rule.garbage_type)
        );

        const activeColorMap = isKawaii ? kawaiicolormap : isCafe ? cafeColorMap : isNight ? darkColorMap : colorMap;

        return uniqueRules.map(rule => {
            const rawType = rule.garbage_type ? String(rule.garbage_type) : '';
            const cleanType = rawType.replace(/[\r\n\s\u3000]+/g, '');
            const typeInfo = activeColorMap[cleanType] || { id: 99, color: isNight ? '#2A3442' : (isKawaii || isCafe ? '#C5B8B1' : '#757575') };
            return { id: typeInfo.id, color: typeInfo.color, isTextWhite: true };
        });
    };

    const renderGarbageIcon = (typeId: number, index: number) => {
        if (typeId === 1) return <View key={index} style={styles.iconBadge}><Ionicons name="flame-outline" size={14} color="#FFF" /><ThemedText style={[styles.miniGridText, { color: '#FFF' }]}>可燃</ThemedText></View>;
        if (typeId === 2) return <View key={index} style={styles.iconBadge}><MaterialCommunityIcons name="fire-off" size={14} color="#FFF" /><ThemedText style={[styles.miniGridText, { color: '#FFF' }]}>不燃</ThemedText></View>;
        if (typeId === 3) return <View key={index} style={styles.iconBadge}><Ionicons name="newspaper-outline" size={14} color="#FFF" /><ThemedText style={[styles.miniGridText, { color: '#FFF' }]}>資源</ThemedText></View>;
        if (typeId === 4) return <View key={index} style={styles.iconBadge}><Ionicons name="cube-outline" size={13} color="#FFF" /><ThemedText style={[styles.miniGridText, { color: '#FFF' }]}>プラ</ThemedText></View>;
        return null;
    };

    const renderCalendarGrid = () => {
        const gridCells = [];
        const today = new Date();

        for (let i = 0; i < firstDayOfMonth; i++) gridCells.push(<View key={`empty-${i}`} style={[styles.dateCell, { borderColor: isNight ? '#2E3A4D' : borderThemeColor }]} />);

        for (let d = 1; d <= daysInMonth; d++) {
            const dayInfos = getDayInfos(year, month, d);
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasEvents = dayInfos.length > 0;

            gridCells.push(
                <View key={`day-${d}`} style={[
                    styles.dateCell, 
                    { borderColor: isNight ? '#2E3A4D' : borderThemeColor },
                    isToday && styles.todayCell,
                    isToday && { borderColor: accentPrimaryColor }
                ]}>
                    <View style={styles.cellBackgroundWrapper}>
                        {dayInfos.map((info, index) => <View key={index} style={{ flex: 1, backgroundColor: info.color }} />)}
                    </View>
                    <ThemedText style={[
                        styles.dateText, 
                        { color: accentTextColor },
                        hasEvents && { color: '#FFF', fontWeight: 'bold' }, 
                        isToday && !hasEvents && { color: accentPrimaryColor, fontWeight: 'bold' }
                    ]}>{d}</ThemedText>
                    <View style={styles.labelContainerInside}>
                        {dayInfos.map((info, index) => renderGarbageIcon(info.id, index))}
                    </View>
                </View>
            );
        }
        return gridCells;
    };


    const useCurrentLocation = async () => {
    setLoading(true);
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("エラー", "位置情報のアクセスが拒否されました。");
            setLoading(false);
            return;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
        });
        const { latitude, longitude } = location.coords;

        let detailedAddress = "";

        if (Platform.OS === 'web') {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ja`
            );
            const data = await response.json();
            if (data && data.address) {
                const province = data.address.province || "";
                const city = data.address.city || data.address.local_admin || "";
                const suburb = data.address.suburb || data.address.borough || "";
                const neighborhood = data.address.neighbourhood || data.address.quarter || "";
                detailedAddress = `${province}${city}${suburb}${neighborhood}`.trim();
            }
        } else {
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocode && geocode.length > 0) {
                const g = geocode[0];
                const region = g.region || "";
                const district = g.district || g.city || "";
                const street = g.street || "";
                detailedAddress = `${region}${district}${street}`;
            }
        }

        // --- MAGIN HÄNDER HÄR ---
        // Vi tar bort mellanslag från db-namnen (t.ex. "新宿区 西新宿" -> "新宿区西新宿")
        // och kollar om vår GPS-adress innehåller det namnet.
        const matchedArea = allAreas.find(area => {
            const cleanDbName = area.name.replace(/\s+/g, '');
            return detailedAddress.includes(cleanDbName);
        });

        if (matchedArea) {
            // Om vi hittar en match, spara till databasen och uppdatera kalendern!
            await saveSelectedArea(matchedArea.id, matchedArea.name);
            setSelectedAreaId(matchedArea.id);
            setAreaName(matchedArea.name);
            Alert.alert("成功！", `現在地から「${matchedArea.name}」のカレンダーを設定しました。`);
        } else {
            // Om platsen hittades men inte finns i din databas
            Alert.alert("注意", `現在地 (${detailedAddress}) のごみ収集データが見つかりませんでした。手動で検索してください。`);
        }

    } catch (e) {
        console.error("GPS Error:", e);
        Alert.alert("エラー", "位置情報の取得に失敗しました。");
    } finally {
        setLoading(false);
    }
};
    const filteredAreas = allAreas.filter(area => area.name.toLowerCase().includes(searchQuery.toLowerCase()) || area.matchKey.includes(searchQuery.toLowerCase()));
    const activeLegendMap = isKawaii ? kawaiicolormap : isCafe ? cafeColorMap : isNight ? darkColorMap : colorMap;

    return (
        <View style={[styles.mainWrapper, { backgroundColor: mainBackgroundColor }]}>
            <ScrollView contentContainerStyle={styles.contentBody}>

                <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor: borderThemeColor, flexDirection: 'row', alignItems: 'center' }, isNight && { borderWidth: 1.5 }, isCafe && { borderWidth: 2 }]}>
    <Ionicons name="search" size={20} color={placeholderColor} style={styles.searchIcon} />
    <TextInput
        style={[styles.searchInput, { color: accentTextColor, flex: 1 }]}
        placeholder="他の区名や地域名で検索"
        placeholderTextColor={placeholderColor}
        value={searchQuery}
        onChangeText={(text) => {
            setSearchQuery(text);
            setShowDropdown(text.length > 0);
        }}
    />
    
    {/* NY GPS-KNAPP */}
    <Pressable onPress={useCurrentLocation} style={{ padding: 8 }}>
        <Ionicons name="navigate-circle-outline" size={28} color={accentPrimaryColor} />
    </Pressable>
</View>

                {showDropdown && (
                    <View style={[styles.dropdownContainer, { backgroundColor: cardBg, borderColor: borderThemeColor }, isNight && { borderWidth: 1.5 }, isCafe && { borderWidth: 2 }]}>
                        {filteredAreas.length > 0 ? (
                            filteredAreas.map((area) => (
                                <Pressable
                                    key={area.id}
                                    style={[styles.dropdownItem, { borderBottomColor: isNight ? '#2E3A4D' : borderThemeColor }]}
                                    onPress={async () => {
                                        setSelectedAreaId(area.id);
                                        setAreaName(area.name);
                                        await saveSelectedArea(area.id, area.name);
                                        setSearchQuery('');
                                        setShowDropdown(false);
                                    }}
                                >
                                    <Ionicons name="location-outline" size={16} color={accentPrimaryColor} style={{ marginRight: 8 }} />
                                    <ThemedText style={[styles.dropdownItemText, { color: accentTextColor }]}>{area.name}</ThemedText>
                                </Pressable>
                            ))
                        ) : (
                            <View style={styles.dropdownItem}><ThemedText style={[styles.dropdownItemText, { color: accentTextColor }]}>見つかりませんでした</ThemedText></View>
                        )}
                    </View>
                )}




                <View style={styles.headerRow}>
                    <Pressable onPress={goToPreviousMonth} disabled={isFirstMonth} style={[styles.arrowButton, isFirstMonth && { opacity: 0.2 }]}>
                        <Ionicons name="chevron-back" size={28} color={accentTextColor} />
                    </Pressable>
                    <View style={styles.headerTitleContainer}>
                        <ThemedText style={[styles.monthTitleText, { color: accentTextColor }]}>{year}年 {month + 1}月</ThemedText>
                        <ThemedText style={[styles.regionSubText, { color: subTextColor }]}>現在のエリア：{areaName}</ThemedText>
                    </View>
                    <Pressable onPress={goToNextMonth} disabled={isLastMonth} style={[styles.arrowButton, isLastMonth && { opacity: 0.2 }]}>
                        <Ionicons name="chevron-forward" size={28} color={accentTextColor} />
                    </Pressable>
                </View>

                <View style={[
                    styles.calendarCard, 
                    { backgroundColor: cardBg, borderColor: borderThemeColor }, 
                    isNight && { borderWidth: 1.5, shadowOpacity: 0.03, shadowColor: '#A6C56F' },
                    isCafe && { borderWidth: 2, shadowColor: '#D7C4B7', shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 }
                ]}>
                    <View style={[styles.weekHeaderRow, { borderBottomColor: isNight ? '#2E3A4D' : borderThemeColor }]}>
                        {['日', '月', '火', '水', '木', '金', '土'].map((w, index) => (
                            <ThemedText key={w} style={[
                                styles.weekHeaderText, 
                                { color: subTextColor },
                                index === 0 && { color: isKawaii ? '#e2a0a0' : isCafe ? '#C57E6B' : '#EF4444' }, 
                                index === 6 && { color: isKawaii ? '#87a9d0' : isCafe ? '#7A919E' : '#3B82F6' }
                            ]}>{w}</ThemedText>
                        ))}
                    </View>
                    {loading ? (
                        <ActivityIndicator size="large" color={accentPrimaryColor} style={{ marginVertical: 40 }} />
                    ) : (
                        <View style={styles.gridContainer}>{renderCalendarGrid()}</View>
                    )}
                </View>

                <View style={[
                    styles.legendContainer, 
                    { backgroundColor: cardBg, borderColor: borderThemeColor },
                    isNight && { borderWidth: 1.5 },
                    isCafe && { borderWidth: 2, shadowColor: '#D7C4B7', shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 }
                ]}>
                    <ThemedText style={[styles.legendSectionTitle, { color: accentTextColor }]}>資源とごみの収集区分</ThemedText>
                    <View style={styles.legendGrid}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: activeLegendMap['可燃ごみ'].color }]}><Ionicons name="flame-outline" size={12} color="#FFF" /></View>
                            <ThemedText style={[styles.legendLabelText, { color: accentTextColor }]}>可燃ごみ</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: activeLegendMap['不燃ごみ'].color }]}><MaterialCommunityIcons name="fire-off" size={14} color="#FFF" /></View>
                            <ThemedText style={[styles.legendLabelText, { color: accentTextColor }]}>不燃ごみ</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: activeLegendMap['資源'].color }]}><Ionicons name="newspaper-outline" size={12} color="#FFF" /></View>
                            <ThemedText style={[styles.legendLabelText, { color: accentTextColor }]}>資源</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: activeLegendMap['プラ'].color }]}><Ionicons name="cube-outline" size={12} color="#FFF" /></View>
                            <ThemedText style={[styles.legendLabelText, { color: accentTextColor }]}>プラ容器包装</ThemedText>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* TAB BAR */}
            <View style={styles.tabBarContainer}>
                <View style={[styles.scanBackgroundCircle, { backgroundColor: tabBarBgColor }]} />
                <View style={[styles.tabBarBackground, { backgroundColor: tabBarBgColor }]} />
                
                <View style={styles.tabBarContent}>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/dashboard')}>
                        <Octicons name="home" size={24} color={isHomeActive ? tabActiveColor : tabInactiveColor} />
                        <ThemedText style={[styles.tabLabelBottom, { color: isHomeActive ? tabActiveColor : tabInactiveColor }]}>ホーム</ThemedText>
                    </Pressable>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/calendar')}>
                        <FontAwesome5 name="calendar-alt" size={22} color={isCalendarActive ? tabActiveColor : tabInactiveColor} />
                        <ThemedText style={[styles.tabLabelBottom, { color: isCalendarActive ? tabActiveColor : tabInactiveColor, fontWeight: isCalendarActive ? 'bold' : '600' }]}>ゴミカレンダー</ThemedText>
                    </Pressable>
                    <View style={styles.scanWrapper}>
                        <Pressable style={[styles.scanButton, { backgroundColor: isNight ? '#ffffff' : '#FFFFFF' }]} onPress={() => router.push('/scan')}>
                            <Ionicons name="scan-outline" size={26} color={tabInactiveColor} />
                        </Pressable>
                        <ThemedText style={[styles.scanLabel, { color: tabInactiveColor }]}>ゴミスキャン</ThemedText>
                    </View>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/reuse')}>
                        <Ionicons name="refresh-circle-outline" size={26} color={tabInactiveColor} />
                        <ThemedText style={[styles.tabLabelBottom, { color: tabInactiveColor }]}>リユース</ThemedText>
                    </Pressable>
                    <Pressable style={styles.tabItemBottom} onPress={() => router.push('/mypage')}>
                        <Ionicons name="person" size={22} color={tabInactiveColor} />
                        <ThemedText style={[styles.tabLabelBottom, { color: tabInactiveColor }]}>マイページ</ThemedText>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
    },
    contentBody: {
        paddingTop: 18,
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: 140,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 50,
        marginTop: 60,
        marginBottom: 18,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    dropdownContainer: {
        borderRadius: 14,
        paddingVertical: 8,
        marginBottom: 18,
        zIndex: 99,
        elevation: 5,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
    },
    dropdownItemText: {
        fontSize: 14,
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
    },
    regionSubText: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    calendarCard: {
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 12,
    },
    weekHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    weekHeaderText: {
        fontSize: 14,
        fontWeight: '600',
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
    },
    legendContainer: {
        borderRadius: 20,
        padding: 20,
        marginTop: 20,
    },
    legendSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
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
        zIndex: 1,
    },
    scanBackgroundCircle: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        width: 72,
        height: 72,
        borderRadius: 36,
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
        marginTop: 4,
        fontWeight: '600',
        textAlign: 'center',
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
        marginTop: 2,
        fontWeight: '700',
        textAlign: 'center',
    },
});