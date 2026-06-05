import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function SignInGoogleScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <AntDesign name="arrow-left" size={24} color="#000" />
      </Pressable>

      <View style={styles.headerImageContainer}>
        <ThemedText type="title" style={styles.headerTitle}>
          Gomify
        </ThemedText>
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Image
            source={require('@/assets/images/Go Green Open Recycle Container.png')}
            style={styles.image}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Sign in with Google
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Sign in securely with your Google account.
        </ThemedText>
      </View>

      <View style={styles.spacer} />

      <Pressable 
        onPress={() => router.push('/address')}
        style={styles.button}
      >
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>
          Continue
        </ThemedText>
      </Pressable>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    display: 'flex',
    flexDirection: 'column',
  },
  backButton: {
    padding: 8,
    marginTop: 12,
    marginBottom: 24,
  },
  headerImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 40,
    lineHeight: 48,
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    height: 170,
    width: 250,
  },
  content: {
    alignItems: 'center',
    minHeight: 140,
  },
  spacer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  button: {
    height: 52,
    backgroundColor: '#4285F4',
    borderRadius: 14,
    marginBottom: 300,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
