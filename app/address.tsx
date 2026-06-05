import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';


export default function AddressScreen() {
  const router = useRouter();
  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [building, setBuilding] = useState('');

  const handleSubmit = () => {
    if (!postalCode || !prefecture || !city || !address) {
      Alert.alert('エラー', '全てのフィールドを記入してください');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <AntDesign name="arrow-left" size={24} color="#000" />
      </Pressable>

      <ThemedText type="title" style={styles.title}>
        住所入力
      </ThemedText>
      <ThemedText type="default" style={styles.subtitle}>
        お客様の住所をご入力ください
      </ThemedText>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <ThemedText type="default" style={styles.label}>
            郵便番号 *
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="例: 100-0001"
            placeholderTextColor="#999"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="default" style={styles.label}>
            都道府県 *
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="例: 東京都"
            placeholderTextColor="#999"
            value={prefecture}
            onChangeText={setPrefecture}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="default" style={styles.label}>
            市区町村 *
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="例: 千代田区"
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="default" style={styles.label}>
            本人住所を入れてください *
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="例: 丸の内1丁目1番地"
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="default" style={styles.label}>
            建物名・部屋番号
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="例: ビジネスビル201号室"
            placeholderTextColor="#999"
            value={building}
            onChangeText={setBuilding}
          />
        </View>
      </ScrollView>

      <Pressable 
        onPress={handleSubmit}
        style={styles.submitButton}
      >
        <ThemedText type="defaultSemiBold" style={styles.submitButtonText}>
          次へ進む
        </ThemedText>
      </Pressable>
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
  },
  backButton: {
    padding: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    flex: 1,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
