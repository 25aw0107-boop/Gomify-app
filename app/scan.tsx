
import { ThemedText } from '@/components/themed-text';
import { AntDesign, Ionicons, MaterialCommunityIcons, Octicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, TextInput, Image } from 'react-native';

export default function ScanScreen() {
  const router = useRouter();

  return (
    <View style={styles.mainWrapper}>
      <LinearGradient
        colors={['#DCE8D3', '#FFFFFF']}
        style={styles.gradientBackground}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.12 }}
      />

      <View style={styles.headerContainer}>
        <Pressable style={styles.backButton} onPress={() => router.push('/dashboard')}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </Pressable>
        
        <View style={styles.headerRow}>
          <View style={styles.headerItem}>
            <Ionicons name="scan-outline" size={24} color="#000" />
            <ThemedText style={styles.headerText}>スキャン</ThemedText>
          </View>
          <View style={styles.headerItem}>
            <Ionicons name="search-outline" size={24} color="#000" />
            <ThemedText style={styles.headerText}>検索</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        
        <View style={styles.card}>
          <View style={styles.introRow}>
            <Image 
              source={require('@/assets/images/korehagomi.png')} 
              style={styles.introImage}
            />
            <View style={styles.introTextContainer}>
              <ThemedText style={styles.introTitle}>これは何ゴミ？</ThemedText>
              <ThemedText style={styles.introDescription}>
                Gomifyですぐ解決。{"\n"}
                スキャンまたは検索で、{"\n"}
                正しい分別方法を確認できます。
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>スキャンして調べる</ThemedText>
          
          <View style={styles.scanActionRow}>
            <ThemedText style={styles.scanInstruction}>
              カメラでアイテムを読み取る{"\n"}
              と、ゴミの種類や捨て方を{"\n"}
              すぐに確認できます
            </ThemedText>
            
            <Pressable style={styles.bigScanButton} onPress={() => console.log('Kamera startad')}>
              <Ionicons name="camera-outline" size={32} color="#fff" />
              <ThemedText style={styles.bigScanButtonText}>スキャン開始</ThemedText>
            </Pressable>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepIconCircle}>
                <Ionicons name="camera" size={16} color="#000" />
              </View>
              <ThemedText style={styles.stepText}>写真を撮る</ThemedText>
            </View>

            <Ionicons name="arrow-forward" size={14} color="#76C800" style={styles.stepArrow} />

            <View style={styles.stepItem}>
              <View style={styles.stepIconCircle}>
                <Ionicons name="search" size={16} color="#000" />
              </View>
              <ThemedText style={styles.stepText}>AIが{"\n"}アイテムを判別</ThemedText>
            </View>

            <Ionicons name="arrow-forward" size={14} color="#76C800" style={styles.stepArrow} />

            <View style={styles.stepItem}>
              <View style={styles.stepIconCircle}>
                <Ionicons name="checkmark-circle" size={16} color="#000" />
              </View>
              <ThemedText style={styles.stepText}>分別方法を{"\n"}確認</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitleCenter}>検索して調べる</ThemedText>
          
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="" 
            />
            <Pressable style={styles.searchButton}>
              <ThemedText style={styles.searchButtonText}>検索</ThemedText>
            </Pressable>
          </View>
        </View>

      </View>

      <View style={styles.tabBarContainer}>
        <View style={styles.scanBackgroundCircle} />
        <View style={styles.tabBarBackground} />
        
        <View style={styles.tabBarContent}>
          <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
            <Octicons name="home" size={24} color="#555" />
            <ThemedText style={styles.tabLabel}>ホーム</ThemedText>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={() => router.push('/calender')}>
            <FontAwesome5 name="calendar-alt" size={22} color="#555" />
            <ThemedText style={styles.tabLabel}>ゴミカレンダー</ThemedText>
          </Pressable>

          <View style={styles.scanWrapper}>
            <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
              <Ionicons name="scan-outline" size={26} color="#5B9E00" />
            </Pressable>
            <ThemedText style={[styles.scanLabel, styles.tabLabelActive]}>ゴミスキャン</ThemedText>
          </View>

          <Pressable style={styles.tabItem} onPress={() => router.push('/modal')}>
            <Ionicons name="refresh-circle-outline" size={26} color="#555" />
            <ThemedText style={styles.tabLabel}>リユース</ThemedText>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={() => router.push('/mypage')}>
            <Ionicons name="refresh-circle-outline" size={26} color="#555" />
            <ThemedText style={styles.tabLabel}>マイページ</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  headerContainer: {
    paddingTop: 24,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 28,
  },
  headerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3, 
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  introImage: {
    width: 75,
    height: 75,
    resizeMode: 'contain',
  },
  introTextContainer: {
    flex: 1,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  introDescription: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
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
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },
  bigScanButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#76C800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigScanButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  stepItem: {
    alignItems: 'center',
    width: 85,
  },
  stepIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#76C800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  stepText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    lineHeight: 13,
    height: 26,
  },
  stepArrow: {
    marginBottom: 34,
    marginHorizontal: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
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
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 60,
  },
  tabLabel: {
    fontSize: 9,
    color: '#555',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabLabelActive: {
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
