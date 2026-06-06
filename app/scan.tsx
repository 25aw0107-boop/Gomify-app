import React from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Octicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ScanScreen() {
  const router = useRouter();

  return (
    <View style={styles.mainWrapper}>
      {/* Scrollbar container för korten */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerItem}>
              <Ionicons name="scan-outline" size={30} color="#000" />
              <Text style={styles.headerText}>スキャン</Text>
            </View>
            <View style={styles.headerItem}>
              <Ionicons name="search-outline" size={30} color="#000" />
              <Text style={styles.headerText}>検索</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.introRow}>
            <View style={styles.illustrationContainer}>
              <View style={styles.bubbleIcons}>
                <Feather name="lightbulb" size={16} color="#A3D9C9" style={{ transform: [{ rotate: '-15deg' }] }} />
                <MaterialCommunityIcons name="fan" size={18} color="#A3D9C9" />
                <Text style={styles.questionMark}>?</Text>
              </View>
              <Ionicons name="trash-bin" size={50} color="#4A7c59" />
            </View>

            <View style={styles.introTextContainer}>
              <Text style={styles.introTitle}>これは何ゴミ？</Text>
              <Text style={styles.introDescription}>
                Gomifyですぐ解決。{"\n"}
                スキャンまたは検索で、{"\n"}
                正しい分別方法を確認できます。
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>スキャンして調べる</Text>
          
          <View style={styles.scanActionRow}>
            <Text style={styles.scanInstruction}>
              カメラでアイテムを読み取る{"\n"}
              と、ゴミの種類や捨て方を{"\n"}
              すぐに確認できます
            </Text>
            
            <Pressable style={styles.bigScanButton} onPress={() => console.log('Starta kamera')}>
              <Ionicons name="camera-outline" size={32} color="#fff" />
              <Text style={styles.bigScanButtonText}>スキャン開始</Text>
            </Pressable>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepIconCircle}>
                <Ionicons name="camera" size={18} color="#000" />
              </View>
              <Text style={styles.stepText}>写真を撮る</Text>
            </View>

            <Ionicons name="arrow-forward" size={16} color="#000" style={styles.stepArrow} />

            <View style={styles.stepItem}>
              <View style={styles.stepIconCircle}>
                <Ionicons name="search" size={18} color="#000" />
              </View>
              <Text style={styles.stepText}>AIが{"\n"}アイテムを判別</Text>
            </View>

            <Ionicons name="arrow-forward" size={16} color="#000" style={styles.stepArrow} />

            <View style={styles.stepItem}>
              <View style={styles.stepIconCircle}>
                <Ionicons name="checkmark-circle" size={18} color="#000" />
              </View>
              <Text style={styles.stepText}>分別方法を{"\n"}確認</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitleCenter}>検索して調べる</Text>
          
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="" 
              placeholderTextColor="#999"
            />
            <Pressable style={styles.searchButton}>
              <Text style={styles.searchButtonText}>検索</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      <View style={styles.tabBarContainer}>
        <View style={styles.tabBarBackground} />
        
        <View style={styles.tabBarContent}>
          <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
            <Octicons name="home" size={24} color="#777" />
            <Text style={styles.tabLabel}>ホーム</Text>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={() => router.push('/calendar')}>
            <FontAwesome5 name="calendar-alt" size={22} color="#777" />
            <Text style={styles.tabLabel}>ゴミカレンダー</Text>
          </Pressable>

          <View style={styles.scanWrapper}>
            <Pressable style={styles.activeScanButton} onPress={() => router.push('/scan')}>
              <Ionicons name="scan-outline" size={28} color="#777" />
            </Pressable>
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>ゴミスキャン</Text>
          </View>

          <Pressable style={styles.tabItem} onPress={() => router.push('/reuse')}>
            <MaterialCommunityIcons name="water-recycle" size={26} color="#777" />
            <Text style={styles.tabLabel}>リユース</Text>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={() => router.push('/profile')}>
            <Ionicons name="person" size={22} color="#777" />
            <Text style={styles.tabLabel}>マイページ</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#DCE8D3', 
  },
  scrollContainer: {
    paddingBottom: 120, 
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    gap: 30,
  },
  headerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  bubbleIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: -5,
  },
  questionMark: {
    fontSize: 16,
    color: '#A3D9C9',
    fontWeight: 'bold',
  },
  introTextContainer: {
    flex: 1,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000',
  },
  introDescription: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  sectionTitleCenter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  scanActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  scanInstruction: {
    fontSize: 13,
    color: '#000',
    lineHeight: 20,
    flex: 1,
    paddingRight: 10,
  },
  bigScanButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#76C800', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  bigScanButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    width: 80,
  },
  stepIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#76C800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepText: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
    lineHeight: 13,
  },
  stepArrow: {
    marginBottom: 20,
    marginHorizontal: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 48,
    paddingLeft: 12,
    overflow: 'hidden',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#000',
  },
  searchButton: {
    backgroundColor: '#76C800',
    height: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* TAB BAR STYLES */
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 95,
    backgroundColor: 'transparent',
  },
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#DCE8D3', 
    borderTopWidth: 1,
    borderTopColor: '#C8D5BF',
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    height: 50,
  },
  tabLabel: {
    fontSize: 9,
    color: '#333',
    marginTop: 5,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: 'bold',
  },
  scanWrapper: {
    alignItems: 'center',
    bottom: 14, 
  },
  activeScanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C8D5BF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});