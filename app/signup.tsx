import { AntDesign, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, TextInput, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const router = useRouter();
  
  // ----------------------------------------
  // 状态控制：控制当前处于第几步 (1: 账号密码, 2: 住所输入)
  // ----------------------------------------
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // 第一步：账号基本信息状态
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  // 第二步：地址信息状态
  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [building, setBuilding] = useState('');

  // ----------------------------------------
  // 逻辑处理：第一步验证并进入下一步
  // ----------------------------------------
  const handleNextStep = () => {
    if (!email || !password || !name) {
      alert('请填写完整的注册信息！');
      return;
    }
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致！');
      return;
    }
    if (password.length < 6) {
      alert('密码长度至少需要6位！');
      return;
    }
    // 验证通过，不调接口，直接原地切换到地址填写视图
    setStep(2);
  };

  // ----------------------------------------
  // 逻辑处理：第二步最终提交（合二为一的后端写入）
  // ----------------------------------------
  const handleFinalSubmit = async () => {
    if (!postalCode || !prefecture || !city || !address) {
      Alert.alert('エラー', '全てのフィールドを記入してください');
      return;
    }

    try {
      setLoading(true);

      // 【动作 1】向 Supabase Auth 发起账号注册
      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      const user = data?.user;
      if (!user) {
        throw new Error('ユーザーの作成に失敗しました。');
      }

      // 【动作 2】用刚刚生成的 uid，直接将地址数据写入公共 profiles 表中
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id, 
            postal_code: postalCode,
            prefecture: prefecture,
            city: city,
            address: address,
            building: building,
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      // 全部安全成功，放行到首页
      Alert.alert('成功', '登録が完了しました！');
      router.push('/dashboard');
    } catch (error: any) {
      Alert.alert('登録失敗', error.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // 视图渲染：Step 1 - 账号创建界面 (原封不动)
  // ========================================================
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <AntDesign name="arrow-left" size={24} color="#000" />
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>Gomify</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
          <ThemedText type="default" style={styles.description}>
            Sign up to get started with your eco-friendly journey.
          </ThemedText>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <AntDesign name="user" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <AntDesign name="mail" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <AntDesign name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={securePassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setSecurePassword(!securePassword)} style={styles.eyeIcon}>
                <Feather name={securePassword ? "eye-off" : "eye"} size={18} color="#666" />
              </Pressable>
            </View>

            <View style={styles.inputWrapper}>
              <AntDesign name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={secureConfirm}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setSecureConfirm(!secureConfirm)} style={styles.eyeIcon}>
                <Feather name={secureConfirm ? "eye-off" : "eye"} size={18} color="#666" />
              </Pressable>
            </View>
          </View>

          <Pressable onPress={handleNextStep} style={styles.button}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              Sign Up
            </ThemedText>
          </Pressable>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
            <Pressable onPress={() => router.back()}>
              <ThemedText style={styles.linkText}>Sign In</ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========================================================
  // 视图渲染：Step 2 - 住所入力界面 (原封不动)
  // ========================================================
  return (
    <View style={[styles.container, { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 }]}>
      <Pressable
        onPress={() => setStep(1)} // 点击返回上一步修改账号密码
        style={styles.backButtonAddress}
        disabled={loading}
      >
        <AntDesign name="arrow-left" size={24} color="#000" />
      </Pressable>

      <ThemedText type="title" style={styles.titleAddress}>
        住所入力
      </ThemedText>
      <ThemedText type="default" style={styles.subtitleAddress}>
        お客様の住所をご入力ください
      </ThemedText>

      <ScrollView style={styles.formAddress} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroupAddress}>
          <ThemedText type="default" style={styles.labelAddress}>
            郵便番号 *
          </ThemedText>
          <TextInput
            style={styles.inputAddress}
            placeholder="例: 100-0001"
            placeholderTextColor="#999"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        <View style={styles.formGroupAddress}>
          <ThemedText type="default" style={styles.labelAddress}>
            都道府県 *
          </ThemedText>
          <TextInput
            style={styles.inputAddress}
            placeholder="例: 東京都"
            placeholderTextColor="#999"
            value={prefecture}
            onChangeText={setPrefecture}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroupAddress}>
          <ThemedText type="default" style={styles.labelAddress}>
            市区町村 *
          </ThemedText>
          <TextInput
            style={styles.inputAddress}
            placeholder="例: 千代田区"
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroupAddress}>
          <ThemedText type="default" style={styles.labelAddress}>
            本人住所を入れてください *
          </ThemedText>
          <TextInput
            style={styles.inputAddress}
            placeholder="例: 丸の内1丁目1番地"
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroupAddress}>
          <ThemedText type="default" style={styles.labelAddress}>
            建物名・部屋番号
          </ThemedText>
          <TextInput
            style={styles.inputAddress}
            placeholder="例: ビジネスビル201号室"
            placeholderTextColor="#999"
            value={building}
            onChangeText={setBuilding}
            editable={!loading}
          />
        </View>
      </ScrollView>

      <Pressable 
        onPress={handleFinalSubmit}
        style={[styles.submitButtonAddress, loading && styles.submitButtonDisabledAddress]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText type="defaultSemiBold" style={styles.submitButtonTextAddress}>
            次へ進む
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

// ========================================================
// 样式定义：两个页面的 CSS 样式百分之百完整保留，未做任何改变
// ========================================================
const styles = StyleSheet.create({
  // ----- SignUp 页面原始样式 -----
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
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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

  // ----- Address 页面原始样式 -----
  backButtonAddress: {
    padding: 8,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  titleAddress: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleAddress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  formAddress: {
    flex: 1,
    marginBottom: 24,
  },
  formGroupAddress: {
    marginBottom: 20,
  },
  labelAddress: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputAddress: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  submitButtonAddress: {
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  submitButtonDisabledAddress: {
    backgroundColor: '#93c5fd',
  },
  submitButtonTextAddress: {
    color: '#fff',
    fontSize: 16,
  },
});