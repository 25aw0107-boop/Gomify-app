
import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, TextInput, Modal, SafeAreaView, Linking } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function SignInGoogleScreen() {
  const router = useRouter();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
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

  const handleNext = () => {
    setShowGoogleModal(false);
    router.push('/address');
  };

  const handleForgotEmail = () => {
    Linking.openURL('https://accounts.google.com/signin/v2/usernamerecovery');
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
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
        onPress={() => setShowGoogleModal(true)} 
        style={styles.button}
      >
        <AntDesign name="google" size={20} color="#fff" style={styles.buttonIcon} />
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>
          Continue with Google
        </ThemedText>
      </Pressable>

      <View style={styles.spacer} />

      <Modal
        visible={showGoogleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.browserHeader}>
            <Pressable onPress={() => setShowGoogleModal(false)} style={styles.closeButton}>
              <AntDesign name="close" size={20} color="#5f6368" />
            </Pressable>
            <View style={styles.urlBar}>
              <AntDesign name="lock" size={14} color="#1a73e8" />
              <ThemedText style={styles.urlText}>accounts.google.com</ThemedText>
            </View>
            <View style={styles.placeholderIcon} />
          </View>

          <View style={styles.googleFormContainer}>
            <View style={styles.googleLogoContainer}>
              <ThemedText style={[styles.logoLetter, { color: '#4285F4' }]}>G</ThemedText>
              <ThemedText style={[styles.logoLetter, { color: '#EA4335' }]}>o</ThemedText>
              <ThemedText style={[styles.logoLetter, { color: '#FBBC05' }]}>o</ThemedText>
              <ThemedText style={[styles.logoLetter, { color: '#4285F4' }]}>g</ThemedText>
              <ThemedText style={[styles.logoLetter, { color: '#34A853' }]}>l</ThemedText>
              <ThemedText style={[styles.logoLetter, { color: '#EA4335' }]}>e</ThemedText>
            </View>

            <ThemedText style={styles.googleTitle}>Sign in</ThemedText>
            <ThemedText style={styles.googleSubtitle}>to continue to Gomify</ThemedText>

            <TextInput
              style={styles.googleInput}
              placeholder="Email or phone"
              placeholderTextColor="#757575"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Pressable onPress={handleForgotEmail} style={styles.forgotEmail} hitSlop={12}>
              <ThemedText style={styles.linkText}>Forgot email?</ThemedText>
            </Pressable>

            <View style={styles.guestModeContainer}>
              <ThemedText style={styles.guestText}>
                Not your computer? Use Guest mode to sign in privately.{' '}
                <ThemedText style={styles.linkText}>Learn more</ThemedText>
              </ThemedText>
            </View>

            <View style={styles.modalFooterRows}>
              <Pressable style={styles.createAccountBtn}>
                <ThemedText style={styles.linkText}>Create account</ThemedText>
              </Pressable>
              
              <Pressable onPress={handleNext} style={styles.nextButton}>
                <ThemedText style={styles.nextButtonText}>Next</ThemedText>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  buttonIcon: {
    marginRight: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  browserHeader: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    width: '70%',
    justifyContent: 'center',
    gap: 4,
  },
  urlText: {
    fontSize: 13,
    color: '#3c4043',
  },
  placeholderIcon: {
    width: 28,
  },
  googleFormContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  googleLogoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  googleTitle: {
    fontSize: 24,
    color: '#202124',
    textAlign: 'center',
    marginBottom: 8,
  },
  googleSubtitle: {
    fontSize: 16,
    color: '#202124',
    textAlign: 'center',
    marginBottom: 32,
  },
  googleInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#202124',
    marginBottom: 9,
  },
  forgotEmail: {
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  linkText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
  },
  guestModeContainer: {
    marginBottom: 40,
  },
  guestText: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
  },
  modalFooterRows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  createAccountBtn: {
    paddingVertical: 10,
  },
  nextButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
