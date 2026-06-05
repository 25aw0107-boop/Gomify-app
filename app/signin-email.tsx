import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function SignInEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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
        <ThemedText
          type="title"
          style={styles.headerTitle}
          lightColor="#20bc5e"
          darkColor="#20bc5e"
        >
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
          Continue with Email
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Enter your email to sign in or create an account.
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
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
    fontFamily: 'IntelOneMono-Bold',
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
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    gap:8,
    fontSize: 16,
    marginTop:10,
    backgroundColor: '#f9f9f9',
  },
  button: {
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    marginBottom:150,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
