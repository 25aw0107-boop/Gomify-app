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

    // ✨ 新增：用于在按钮下方渲染错误文字的状态
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSignIn = async () => {
        // 每次点击登录，先清空上一次的错误信息
        setErrorMessage(null);

        if (!email || !password) {
            setErrorMessage('メールアドレスとパスワードを入力してください。');
            return;
        }

        try {
            setLoading(true);

            // 调用 Supabase 账号密码登录接口
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                throw error;
            }

            if (data?.user) {
                // 登录成功，顺利进入主面板
                router.replace('/dashboard');
            }
        } catch (error: any) {
            // ✨ 核心逻辑：精准拦截并翻译错误，放入本地状态中
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
            {/* 强制隐藏原生导航白条 */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* 顶部标题栏（自定义 Header） */}
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

                {/* 表单输入区域 */}
                <View style={styles.form}>
                    {/* 邮箱输入 */}
                    <View style={styles.inputWrapper}>
                        <AntDesign name="mail" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errorMessage) setErrorMessage(null); // 用户重新输入时自动隐藏错误
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>

                    {/* 密码输入 */}
                    <View style={styles.inputWrapper}>
                        <AntDesign name="lock" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (errorMessage) setErrorMessage(null); // 用户重新输入时自动隐藏错误
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

                {/* 登录按钮 */}
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

                {/* ✨ 新增：如果账号密码不对，在这这里以红色显眼文字提示用户 */}
                {errorMessage && (
                    <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                    </View>
                )}

                {/* 底部去注册的快捷导流栏 */}
                <View style={styles.footer}>
                    {/* 🛠️ 修复点：这里原本误写为了 </Ref>导致报错，已修复为标准的 </ThemedText> */}
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