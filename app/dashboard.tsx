import { ThemedText } from '@/components/themed-text';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, ImageBackground } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();

  return (
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

      <View style={styles.placeholderContainer}>
        <ThemedText type="default" style={styles.placeholderText}>
          Dashboard content will appear here
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  lowerContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
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
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 12,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pointsTextGreen: {
    fontSize: 11,
    color: '#76C800',
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
    marginHorizontal: 24,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
});