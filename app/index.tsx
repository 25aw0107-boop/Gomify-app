
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, Stack } from 'expo-router'; // Importera Stack här
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export default function HomeScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslate, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const swayAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    swayAnimation.start();

    const timeout = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        swayAnimation.stop();
        setShowSplash(false);
      });
    }, 3000);

    return () => {
      clearTimeout(timeout);
      swayAnimation.stop();
    };
  }, [contentOpacity, contentTranslate, splashOpacity, sway]);

  if (showSplash) {
    return (
      <Animated.View style={[styles.splashScreen, { opacity: splashOpacity }]}> 
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateX: sway.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-24, 0, 24],
                  }),
                },
                {
                  rotate: sway.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: ['-8deg', '0deg', '8deg'],
                  }),
                },
              ],
            }}
          >
            <Image
              source={require('@/assets/images/Go Green Recycle Container.png')}
              style={styles.splashLogo}
              contentFit="contain"
            />
          </Animated.View>
          <ActivityIndicator size="large" color="#20bc5e" style={styles.loadingSpinner} />
          <ThemedText type="default" style={styles.loadingText}>
            Loading...
          </ThemedText>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Denna rad döljer den inbyggda menyraden där det stod "index" */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerImageContainer}>
        <ThemedText
          type="title"
          style={styles.headerTitle}
          lightColor="#000000"
          darkColor="#000000"
        >
          Gomify
        </ThemedText>
        <Image
          source={require('@/assets/images/Go Green Recycle Container.png')}
          style={styles.reactLogo}
          contentFit="contain"
        />
      </View>

      <View style={styles.formContainer}>
        <Pressable
          onPress={() => router.push('/signin-google' as const)}
          style={({ pressed }) => [
            styles.actionButton,
            styles.googleButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.buttonContent}>
            <AntDesign name="google" size={20} color="#4285F4" style={styles.buttonIcon} />
            <ThemedText type="defaultSemiBold" style={styles.googleButtonText}>
              Sign in with Google
            </ThemedText>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/signin-email' as const)}
          style={({ pressed }) => [
            styles.actionButton,
            styles.emailButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons name="email" size={20} color="#ffffff" style={styles.buttonIcon} />
            <ThemedText type="defaultSemiBold" style={styles.emailButtonText}>
              Continue with Email
            </ThemedText>
          </View>
        </Pressable>
      </View>

      <View style={styles.signupContainer}>
        <View style={styles.signupRow}>
          <ThemedText style={styles.signupText}>Don't have an account? </ThemedText>
          <Pressable onPress={() => router.push('/signup')} hitSlop={12}>
            <ThemedText style={styles.signupLink}>Sign up</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 125,
  },
  headerImageContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 40,
    fontSize: 40,
    lineHeight: 48,
  },
  reactLogo: {
    height: 140,
    width: 210,
    marginTop: 0,
  },
  splashLogo: {
    height: 180,
    width: 270,
    marginTop: 20,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 20,
  },
  actionButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  emailButton: {
    backgroundColor: '#2563EB',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  googleButtonText: {
    color: '#4285F4',
  },
  emailButtonText: {
    color: '#ffffff',
  },
  signupContainer: {
    position: 'absolute',
    bottom: 52,
    alignItems: 'center',
    width: '100%',
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
  },
  signupLink: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingSpinner: {
    marginTop: 24,
  },
  splashScreen: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});

