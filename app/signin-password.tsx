import { AntDesign, Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';

export default function SignInPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [securePassword, setSecurePassword] = useState(true);
    const [loading, setLoading] = useState(false);

 
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSignIn = async () => {

        setErrorMessage(null);

        if (!email || !password) {
            setErrorMessage('メールアドレスとパスワードを入力してください。');
            return;
        }

        try {
            setLoading(true);

   
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                throw error;
            }

            if (data?.user) {
         
                router.replace('/dashboard');
            }
        } catch (error: any) {
           
            if (error.message === 'Invalid login credentials') {
                setErrorMessage('メールアドレスまたはパスワードが間違っています。');
            } else {
                setErrorMessage(error.message || 'エラーが発生しました');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
      
            <Stack.Screen options={{ headerShown: false }} />

          
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton} disabled={loading}>
                    <AntDesign name="arrow-left" size={24} color="#000" />
                </Pressable>
                <ThemedText type="title" style={styles.headerTitle}>Gomify</ThemedText>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
                <ThemedText type="default" style={styles.description}>
                    Sign in with your email and password to continue.
                </ThemedText>

              
                <View style={styles.form}>
               
                    <View style={styles.inputWrapper}>
                        <AntDesign name="mail" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errorMessage) setErrorMessage(null); 
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>

               
                    <View style={styles.inputWrapper}>
                        <AntDesign name="lock" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (errorMessage) setErrorMessage(null); 
                            }}
                            secureTextEntry={securePassword}
                            autoCapitalize="none"
                            editable={!loading}
                        />
                        <Pressable onPress={() => setSecurePassword(!securePassword)} style={styles.eyeIcon}>
                            <Feather name={securePassword ? "eye-off" : "eye"} size={18} color="#666" />
                        </Pressable>
                    </View>
                </View>

                <Pressable
                    onPress={handleSignIn}
                    style={[styles.button, loading && styles.buttonDisabled]}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                            Sign In
                        </ThemedText>
                    )}
                </Pressable>

           
                {errorMessage && (
                    <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                    </View>
                )}

              
                <View style={styles.footer}>
            
                    <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
                    <Pressable onPress={() => router.push('/signup')}>
                        <ThemedText style={styles.linkText}>Sign Up</ThemedText>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 36,
        marginHorizontal: 16,
    },
    form: {
        gap: 16,
        marginBottom: 32,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e8e8e8',
        borderRadius: 14,
        height: 54,
        paddingHorizontal: 16,
        position: 'relative',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#000',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    button: {
        height: 54,
        backgroundColor: '#76C800',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    buttonDisabled: {
        backgroundColor: '#bce480',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // ✨ 新增：错误提示排版布局
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingHorizontal: 16,
    },
    errorIcon: {
        marginRight: 6,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 16,
    },
    footerText: {
        fontSize: 14,
        color: '#666',
    },
    linkText: {
        color: '#76C800',
        fontSize: 14,
        fontWeight: '700',
    },
});