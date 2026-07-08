import React, { useState, useRef } from 'react';
import {
    StyleSheet, View, Pressable, TextInput,
    ScrollView, Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

export default function CreateListingScreen() {
    const router = useRouter();

    // --- 表单状态 ---
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [station, setStation] = useState('');

    // ✨ 物品のタイプ（カテゴリー）の固定選択肢
    const categoryOptions = [
        '家具',
        '衣物',
        '漫画图书',
        'その他'
    ];
    const [category, setCategory] = useState('家具');

    // 品质固定档位选项
    const qualityOptions = [
        '新品同様',
        '未使用に近い',
        '目立った傷なし',
        '傷や汚れあり'
    ];
    const [quality, setQuality] = useState('未使用に近い');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 动画提示框状态 ---
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const triggerToast = (message: string, callback?: () => void) => {
        setToastMessage(message);
        setShowToast(true);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setShowToast(false);
                    if (callback) callback();
                });
            }, 1500);
        });
    };

    // 📸 动作 A：调用相机拍照
    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('エラー', '写真を撮影するにはカメラへのアクセス権限が必要です。');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.6,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImages([...images, result.assets[0].uri]);
            }
        } catch (err) {
            console.error("相机启动失败:", err);
            triggerToast("⚠️ カメラを起動できませんでした");
        }
    };

    // 🖼️ 动作 B：从相册选图
    const pickImageFromLibrary = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('エラー', '画像を選択するには写真へのアクセス権限が必要です。');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.6,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImages([...images, result.assets[0].uri]);
            }
        } catch (err) {
            console.error("相册启动失败:", err);
            triggerToast("⚠️ アルバムを開けませんでした");
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const uploadImagesToStorage = async (localUris: string[]): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        for (const uri of localUris) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('ユーザーがログインしていません');

                const response = await fetch(uri);
                const blob = await response.blob();

                const fileExt = uri.split('.').pop() || 'jpg';
                const randomStr = Math.random().toString(36).substring(7);
                const fileName = `${user.id}/${Date.now()}-${randomStr}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('item-images')
                    .upload(filePath, blob, { contentType: `image/${fileExt}` });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('item-images')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            } catch (error: any) {
                console.error('图片上传失败详情: ', error);
                throw new Error(`画像のアップロードに失敗しました: ${error.message || error}`);
            }
        }

        return uploadedUrls;
    };

    // --- 💾 核心提交逻辑 (已升级联动获取居住区域属性) ---
    const handleSubmit = async () => {
        if (!title || !description || images.length === 0) {
            triggerToast('⚠️ 画像、タイトル、紹介を入力してください');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                Alert.alert('エラー', 'ログインセッションが切れました。再度ログインしてください。');
                return;
            }

            // 🔍 核心改动：先去 profiles 表拉取当前用户的居住城市区域 (city)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('city')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) {
                console.error('获取发布者地域失败:', profileError);
            }

            const userWard = profileData?.city || null; // 例如："新宿区"

            // 上传图片到 Storage
            const remoteImageUrls = await uploadImagesToStorage(images);

            // 🔐 插入数据：把获取到的 userWard 写入到新添加的 'ward' 字段中
            const { error: insertError } = await supabase
                .from('items')
                .insert([
                    {
                        user_id: user.id,
                        title: title,
                        description: description,
                        station: station || null,
                        ward: userWard,    // ✨ 核心：将发布者的行政区标记为商品的隐形属性
                        category: category,
                        quality: quality,
                        images: remoteImageUrls,
                        status: 'available'
                    }
                ]);

            if (insertError) throw insertError;

            triggerToast('🎉 出品が完了しました！', () => {
                setTitle('');
                setDescription('');
                setStation('');
                setImages([]);
                setCategory('家具');
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/reuse');
                }
            });

        } catch (error: any) {
            console.error(error);
            Alert.alert('出品失敗', error.message || 'エラーが発生しました。もう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/reuse')}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.imageSectionTextRow}>
                    <ThemedText style={styles.rowLabelText}>商品の画像（必須）</ThemedText>
                </View>

                <View style={styles.imageSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.uploadedImage} />
                                <Pressable style={styles.deleteBadge} onPress={() => removeImage(index)}>
                                    <Ionicons name="close-circle" size={22} color="#FF4D4F" />
                                </Pressable>
                            </View>
                        ))}

                        <Pressable style={styles.addImageButton} onPress={takePhoto} disabled={isSubmitting}>
                            <MaterialIcons name="photo-camera" size={30} color="#5B9E00" />
                            <ThemedText style={styles.addImageButtonText}>写真を撮る</ThemedText>
                        </Pressable>

                        <Pressable style={[styles.addImageButton, { marginLeft: 12 }]} onPress={pickImageFromLibrary} disabled={isSubmitting}>
                            <MaterialIcons name="collections" size={30} color="#007AFF" />
                            <ThemedText style={styles.addImageButtonText}>アルバム</ThemedText>
                        </Pressable>
                    </ScrollView>
                </View>

                <TextInput
                    style={styles.titleInput}
                    placeholder="タイトル"
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor="#999"
                    editable={!isSubmitting}
                />

                <TextInput
                    style={[styles.titleInput, styles.descInput]}
                    placeholder="商品の状態、購入時期、お渡し方法など"
                    multiline
                    numberOfLines={6}
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                    placeholderTextColor="#999"
                    editable={!isSubmitting}
                />

                <View style={styles.rowInputContainer}>
                    <ThemedText style={styles.rowLabel}>最寄り駅</ThemedText>
                    <TextInput
                        style={styles.rowInput}
                        value={station}
                        onChangeText={setStation}
                        placeholder="例：新宿駅"
                        placeholderTextColor="#BBB"
                        editable={!isSubmitting}
                    />
                </View>

                {/* 商品のタイプ（カテゴリー）の選択パネル区域 */}
                <View style={styles.qualitySectionContainer}>
                    <ThemedText style={styles.rowLabelText}>商品のタイプ（カテゴリ）</ThemedText>
                    <View style={styles.qualityBadgeRow}>
                        {categoryOptions.map((option) => {
                            const isSelected = category === option;
                            return (
                                <Pressable
                                    key={option}
                                    style={[
                                        styles.qualityCapsule,
                                        isSelected && styles.qualityCapsuleActive
                                    ]}
                                    onPress={() => !isSubmitting && setCategory(option)}
                                >
                                    <ThemedText style={[
                                        styles.qualityCapsuleText,
                                        isSelected && styles.qualityCapsuleTextActive
                                    ]}>
                                        {option}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* 品质胶囊单选面板区域 */}
                <View style={styles.qualitySectionContainer}>
                    <ThemedText style={styles.rowLabelText}>商品の状態（品質）</ThemedText>
                    <View style={styles.qualityBadgeRow}>
                        {qualityOptions.map((option) => {
                            const isSelected = quality === option;
                            return (
                                <Pressable
                                    key={option}
                                    style={[
                                        styles.qualityCapsule,
                                        isSelected && styles.qualityCapsuleActive
                                    ]}
                                    onPress={() => !isSubmitting && setQuality(option)}
                                >
                                    <ThemedText style={[
                                        styles.qualityCapsuleText,
                                        isSelected && styles.qualityCapsuleTextActive
                                    ]}>
                                        {option}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <Pressable
                    style={[
                        styles.submitButton,
                        (!title || images.length === 0 || isSubmitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#666" />
                    ) : (
                        <>
                            <MaterialIcons name="add" size={20} color="#666" />
                            <ThemedText style={styles.submitButtonText}>出品する</ThemedText>
                        </>
                    )}
                </Pressable>

            </ScrollView>

            {showToast && (
                <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
                    <ThemedText style={styles.toastText}>{toastMessage}</ThemedText>
                </Animated.View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    scrollContent: { paddingHorizontal: 30, paddingBottom: 50 },
    imageSectionTextRow: { marginTop: 10, marginBottom: 8 },
    imageSection: { flexDirection: 'row', marginBottom: 30 },
    imageWrapper: { position: 'relative', marginRight: 12 },
    uploadedImage: { width: 110, height: 110, borderRadius: 12 },
    deleteBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 11, zIndex: 10 },
    addImageButton: { width: 110, height: 110, backgroundColor: '#FFFFFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed', gap: 6 },
    addImageButtonText: { fontSize: 12, color: '#555', fontWeight: '600' },
    titleInput: { backgroundColor: '#FFF', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    descInput: { height: 150 },
    rowInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    rowLabel: { fontSize: 16, fontWeight: 'bold', width: 90, color: '#333' },
    rowInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 8, height: 45, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E0E0E0' },
    qualitySectionContainer: { marginBottom: 20, marginTop: 10 },
    rowLabelText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    qualityBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    qualityCapsule: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
    qualityCapsuleActive: { backgroundColor: '#5B9E00', borderColor: '#5B9E00' },
    qualityCapsuleText: { fontSize: 13, color: '#666', fontWeight: '500' },
    qualityCapsuleTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
    submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EBE9DE', marginTop: 40, paddingVertical: 14, borderRadius: 25, borderWidth: 1, borderColor: '#DDD' },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#666', marginLeft: 8 },
    toastContainer: { position: 'absolute', bottom: '45%', left: '15%', right: '15%', backgroundColor: 'rgba(0, 0, 0, 0.8)', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
    toastText: { color: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
});