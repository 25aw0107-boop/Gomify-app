
import { ThemedText } from '@/components/themed-text';
import { AntDesign, Ionicons, MaterialCommunityIcons, Octicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, ImageBackground, ScrollView } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.container}>
        <ImageBackground
          source={require('@/assets/images/Rectangle 8.png')}
          style={styles.heroBackground}
          imageStyle={styles.heroImageRadius}
        >
          <View style={styles.welcomeTextContainer}>
            <ThemedText type="default" style={styles.welcomeText}>
              {"こんにちは\n今日もエコ１日を！"}
            </ThemedText>
          </View>
        </ImageBackground>

        <View style={styles.contentBody}>
          <View style={styles.taskCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={44} color="#76C800" />
            </View>
            <View style={styles.taskTextContainer}>
              <ThemedText style={styles.taskTitle}>今日も分別できましたか？</ThemedText>
              <View style={styles.pointsContainer}>
                <ThemedText style={styles.pointsTextGreen}>ログインボーナス +1P</ThemedText>
                <ThemedText style={styles.pointsTextGreen}>ごみを分別して +1P</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.cardLeft}>
              <ThemedText style={styles.cardTitle}>燃えるゴミの日</ThemedText>
              <View style={styles.cardContentRow}>
                <Ionicons name="flame" size={35} color="#EF4444" style={{ marginTop: 12 }} />
                <ThemedText style={styles.cardDateText}>明日5/16 (木)</ThemedText>
              </View>
            </View>

            <View style={styles.cardRight}>
              <View style={styles.cardHeaderRow}>
                <ThemedText style={styles.cardTitle}>ポイント</ThemedText>
                <Ionicons name="leaf" size={30} color="#76C800" />
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressCircle}>
                  <ThemedText style={styles.progressText}>30 P</ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.reuseContainer}>
            <View style={styles.reuseTitleRow}>
              <ThemedText style={styles.reuseSectionTitle}>リユース品を探す</ThemedText>
              <MaterialCommunityIcons name="sofa-outline" size={24} color="#000" />
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.itemsScroll}
            >
              {[1, 2, 3, 4, 5].map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.heartIcon}>
                    <AntDesign name="heart" size={16} color="#ea9393" />
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.paginationRow}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>

            <Pressable style={styles.listingButton} onPress={() => router.push('/reuse/create')}>
              <ThemedText style={styles.listingButtonText}>使わないものを出品する</ThemedText>
              <AntDesign name="plus" size={18} color="#000" />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.tabBarContainer}>
        <View style={styles.scanBackgroundCircle} />
        <View style={styles.tabBarBackground} />
        
        <View style={styles.tabBarContent}>
          <Pressable style={styles.tabItem} onPress={() => router.push('/dashboard')}>
            <Octicons name="home" size={24} color="#5B9E00" />
            <ThemedText style={[styles.tabLabel, styles.tabLabelActive]}>ホーム</ThemedText>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={() => router.push('/calender')}>
            <FontAwesome5 name="calendar-alt" size={22} color="#555" />
            <ThemedText style={styles.tabLabel}>ゴミカレンダー</ThemedText>
          </Pressable>

          <View style={styles.scanWrapper}>
            <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
              <Ionicons name="scan-outline" size={26} color="#555" />
            </Pressable>
            <ThemedText style={styles.scanLabel}>ゴミスキャン</ThemedText>
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
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  heroBackground: {
    width: 400,
    height: 220,
    paddingTop: 60,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  heroImageRadius: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    resizeMode: 'cover',
  },
  welcomeTextContainer: {
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 32,
  },
  contentBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 110, 
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -30,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 12,
  },
  taskTextContainer: {
    flex: 1,
  },
  cardContentColumn: {
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  gap: 8,
},
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pointsTextGreen: {
    fontSize: 12,
    color: '#76C800',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    gap: 14,
  },
  cardLeft: {
    flex: 1,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'flex-start', 
  },

  cardRight: {
    flex: 1,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: '#76C800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  reuseContainer: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  reuseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reuseSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  itemsScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
  },
  itemCard: {
    width: 160, 
    height: 130,
    backgroundColor: '#EAE8E0',
    borderRadius: 12,
    position: 'relative',
  },
  heartIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C4C4C4',
  },
  dotActive: {
    backgroundColor: '#555555',
  },
  listingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 12,
  },
  listingButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
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
