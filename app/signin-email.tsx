
import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, TextInput, Modal, SafeAreaView } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function SignInMicrosoftScreen() {
  const router = useRouter();
  const [showMicrosoftModal, setShowMicrosoftModal] = useState(false);
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
    setShowMicrosoftModal(false);
    router.push('/address');
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
          Sign in with Microsoft
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Sign in securely with your Microsoft account.
        </ThemedText>
      </View>

      <View style={styles.spacer} />

      <Pressable 
        onPress={() => setShowMicrosoftModal(true)} 
        style={styles.button}
      >
        <AntDesign name="windows" size={20} color="#fff" style={styles.buttonIcon} />
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>
          Continue with Microsoft
        </ThemedText>
      </Pressable>

      <View style={styles.spacer} />

      <Modal
        visible={showMicrosoftModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMicrosoftModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.browserHeader}>
            <Pressable onPress={() => setShowMicrosoftModal(false)} style={styles.closeButton}>
              <AntDesign name="close" size={20} color="#5f6368" />
            </Pressable>
            <View style={styles.urlBar}>
              <AntDesign name="lock" size={14} color="#107c41" />
              <ThemedText style={styles.urlText}>login.live.com</ThemedText>
            </View>
            <View style={styles.placeholderIcon} />
          </View>

          <View style={styles.microsoftFormContainer}>
            <View style={styles.microsoftLogo}>
              <View style={styles.logoRow}>
                <View style={[styles.logoSquare, { backgroundColor: '#f25022' }]} />
                <View style={[styles.logoSquare, { backgroundColor: '#7fba00' }]} />
              </View>
              <View style={styles.logoRow}>
                <View style={[styles.logoSquare, { backgroundColor: '#00a4ef' }]} />
                <View style={[styles.logoSquare, { backgroundColor: '#ffb900' }]} />
              </View>
              <ThemedText style={styles.microsoftText}>Microsoft</ThemedText>
            </View>

            <ThemedText style={styles.microsoftTitle}>Sign in</ThemedText>

            <TextInput
              style={styles.microsoftInput}
              placeholder="Email, phone, or Skype"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.textRow}>
              <ThemedText style={styles.normalText}>No account? </ThemedText>
              <Pressable>
                <ThemedText style={styles.linkText}>Create one!</ThemedText>
              </Pressable>
            </View>

            <Pressable style={styles.forgotEmail}>
              <ThemedText style={styles.linkText}>Can't access your account?</ThemedText>
            </Pressable>

            <View style={styles.modalFooterRows}>
              <Pressable onPress={() => setShowMicrosoftModal(false)} style={styles.backBtn}>
                <ThemedText style={styles.backBtnText}>Back</ThemedText>
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
    backgroundColor: '#00a4ef',
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
  microsoftFormContainer: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 44,
  },
  microsoftLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'column',
    marginRight: 2,
  },
  logoSquare: {
    width: 10,
    height: 10,
    marginBottom: 2,
  },
  microsoftText: {
    fontSize: 18,
    color: '#737373',
    fontWeight: '600',
    marginLeft: 8,
  },
  microsoftTitle: {
    fontSize: 24,
    color: '#1b1b1b',
    fontWeight: '600',
    marginBottom: 20,
  },
  microsoftInput: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#0067b8',
    paddingHorizontal: 4,
    fontSize: 16,
    color: '#1b1b1b',
    marginBottom: 16,
  },
  textRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  normalText: {
    fontSize: 13,
    color: '#1b1b1b',
  },
  linkText: {
    color: '#0067b8',
    fontSize: 13,
  },
  forgotEmail: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  modalFooterRows: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 36,
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#cccccc',
    paddingVertical: 6,
    paddingHorizontal: 32,
    minWidth: 100,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#1b1b1b',
    fontSize: 15,
  },
  nextButton: {
    backgroundColor: '#0067b8',
    paddingVertical: 6,
    paddingHorizontal: 32,
    minWidth: 100,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
  },
});
