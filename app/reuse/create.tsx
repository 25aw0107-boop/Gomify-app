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
import { decode } from 'base64-arraybuffer';
import { useAppTheme } from '../tema/ThemeContext';


interface SelectedImage {
    uri: string;
    base64?: string; 
}

export default function CreateListingScreen() {
    const router = useRouter();

    const { selectedDesign } = useAppTheme();
    const isKawaii = selectedDesign === 'cute';
    const isNight = selectedDesign === 'night';
    const isCafe = selectedDesign === 'cafe';

    const cafeTextColor = '#4A3B32'; 
    const cafeAccentColor = '#8B5E3C'; 
    const cafeBackgroundColor = '#F9F6F0';
  
    const kawaiiTextColor = '#6B4E3C';
    const kawaiiAccentColor = '#A4C3A2';
    const kawaiiBackgroundColor = '#FCF5F0';
    const kawaiiPeachPink = '#F4A396';

    const nightPurple = '#9288da';

    const mainBackgroundColor = isNight ? '#000000' : isKawaii ? kawaiiBackgroundColor : isCafe ? cafeBackgroundColor : '#F5F5F5';
    const cardBgColor = isNight ? '#1C2432' : isKawaii ? '#FCF6EA' : isCafe ? '#FFFDF9' : '#FFFFFF';
    const textColor = isNight ? '#FFFFFF' : isKawaii ? kawaiiTextColor : isCafe ? cafeTextColor : '#333333';
    const subTextColor = isNight ? '#E6E19D' : isKawaii ? '#8B5F65' : isCafe ? '#7A6B58' : '#666666';
    
    const borderColor = isNight ? nightPurple : '#E0E0E0';
    
    const activeAccentColor = isNight ? nightPurple : isKawaii ? kawaiiPeachPink : isCafe ? cafeAccentColor : '#5B9E00';
    const activeBtnTextColor = isNight ? '#000000' : '#FFFFFF';

    const [images, setImages] = useState<SelectedImage[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [station, setStation] = useState('');

    const categoryOptions = ['家具', '衣類', '漫画・本', 'その他'];
    const [category, setCategory] = useState('家具');

    const qualityOptions = ['新品同様', '未使用に近い', '目立った傷なし', '傷や汚れあり'];
    const [quality, setQuality] = useState('未使用に近い');

    const [priority, setPriority] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setImages([...images, { uri: asset.uri, base64: asset.base64 || '' }]);
            }
        } catch (err) {
            console.error("カメラの起動に失敗しました。:", err);
            triggerToast("⚠️ カメラを起動できませんでした");
        }
    };

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
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setImages([...images, { uri: asset.uri, base64: asset.base64 || '' }]);
            }
        } catch (err) {
            console.error("アルバムの起動に失敗しました。:", err);
            triggerToast("⚠️ アルバムを開けませんでした");
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };


    const uploadImagesToStorage = async (
        selectedImages: SelectedImage[]
    ): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("ユーザーがログインしていません");
        }

        for (const img of selectedImages) {
            try {
                let fileExt = 'jpg';
                let contentType = 'image/jpeg';


                if (img.uri.startsWith('data:image/')) {
                    const mimeType = img.uri.split(';')[0].split(':')[1];
                    contentType = mimeType;
                    fileExt = mimeType.split('/')[1] || 'jpg';
                } else {
                    const ext = img.uri.split('.').pop();
                    if (ext && ext.length <= 4) {
                        fileExt = ext;
                        contentType = `image/${fileExt}`;
                    }
                }

                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                let uploadError;

                if (img.base64) {

                    const arrayBuffer = decode(img.base64);
                    const { error } = await supabase.storage
                        .from("item-images")
                        .upload(fileName, arrayBuffer, {
                            contentType: contentType,
                            upsert: true,
                        });
                    uploadError = error;
                } else {
                    const response = await fetch(img.uri);
                    const blob = await response.blob();
                    const { error } = await supabase.storage
                        .from("item-images")
                        .upload(fileName, blob, {
                            contentType: blob.type,
                            upsert: true,
                        });
                    uploadError = error;
                }

                if (uploadError) {
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("item-images")
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            } catch (error: any) {
                console.error("画像アップロード失敗:", error);
                throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
            }
        }

        return uploadedUrls;
    };

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

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('city')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) {
                console.error('出品者の地域情報の取得に失敗しました。', profileError);
            }

            const userWard = profileData?.city || null;
            const remoteImageUrls = await uploadImagesToStorage(images);

            const { error: insertError } = await supabase
                .from('items')
                .insert([
                    {
                        user_id: user.id,
                        title: title,
                        description: description,
                        station: station || null,
                        ward: userWard,
                        category: category,
                        quality: quality,
                        priority: priority, // 💡 Sparar värdet från din stora 優先-knapp till databasen!
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
                setPriority(0);
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/reuse');
                }
            });

        } catch (error: any) {
            console.error(error);
            Alert.alert('エラー', error.message || 'エラーが発生しました。もう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };


    const currentTheme = 'original';
let buttonBackgroundColor = '#4CAF50'; 
let buttonTextColor = '#FFFFFF';      

if (isNight) {
    buttonBackgroundColor = '#39FF14'; 
    buttonTextColor = '#1C2432';      
} else if (isKawaii) { 
    buttonBackgroundColor = '#ffddc3'; 
    buttonTextColor = '#FFFFFF';
} else if (isCafe) {  
    buttonBackgroundColor = '#8B8C65'; 
    buttonTextColor = '#FFFFFF';
}

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: mainBackgroundColor }]}
        >
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/reuse/index')}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={28} color={textColor} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.imageSectionTextRow}>
                    <ThemedText style={[styles.rowLabelText, { color: textColor }]}>商品の画像（必須）</ThemedText>
                </View>

                <View style={styles.imageSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {images.map((img, index) => (
                            <View key={index} style={[styles.imageWrapper, { borderColor: borderColor, borderWidth: isNight ? 1 : 0, borderRadius: 12 }]}>
                           
                                <Image source={{ uri: img.uri }} style={styles.uploadedImage} />
                                <Pressable style={styles.deleteBadge} onPress={() => removeImage(index)}>
                                    <Ionicons name="close-circle" size={22} color="#FF4D4F" />
                                </Pressable>
                            </View>
                        ))}

                        <Pressable style={[styles.addImageButton, { backgroundColor: cardBgColor, borderColor: borderColor }]} onPress={takePhoto} disabled={isSubmitting}>
                            <MaterialIcons name="photo-camera" size={30} color={activeAccentColor} />
                            <ThemedText style={[styles.addImageButtonText, { color: subTextColor }]}>写真を撮る</ThemedText>
                        </Pressable>

                        <Pressable style={[styles.addImageButton, { marginLeft: 12, backgroundColor: cardBgColor, borderColor: borderColor }]} onPress={pickImageFromLibrary} disabled={isSubmitting}>
                            <MaterialIcons name="collections" size={30} color={isNight ? nightPurple : "#007AFF"} />
                            <ThemedText style={[styles.addImageButtonText, { color: subTextColor }]}>アルバム</ThemedText>
                        </Pressable>
                    </ScrollView>
                </View>

                <TextInput
                    style={[styles.titleInput, { backgroundColor: cardBgColor, color: textColor, borderColor: borderColor, borderWidth: 1 }]}
                    placeholder="タイトル"
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor={isNight ? '#7A8B9E' : '#999'}
                    editable={!isSubmitting}
                />

                <TextInput
                    style={[styles.titleInput, styles.descInput, { backgroundColor: cardBgColor, color: textColor, borderColor: borderColor, borderWidth: 1 }]}
                    placeholder="商品の状態、購入時期、お渡し方法など"
                    multiline
                    numberOfLines={6}
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                    placeholderTextColor={isNight ? '#7A8B9E' : '#999'}
                    editable={!isSubmitting}
                />

                <View style={styles.rowInputContainer}>
                    <ThemedText style={[styles.rowLabel, { color: textColor }]}>最寄り駅</ThemedText>
                    <TextInput
                        style={[styles.rowInput, { backgroundColor: cardBgColor, color: textColor, borderColor: borderColor }]}
                        value={station}
                        onChangeText={setStation}
                        placeholder="例：新宿駅"
                        placeholderTextColor={isNight ? '#7A8B9E' : '#BBB'}
                        editable={!isSubmitting}
                    />
                </View>

        
                <View style={styles.qualitySectionContainer}>
                    <ThemedText style={[styles.rowLabelText, { color: textColor }]}>商品のタイプ（カテゴリ）</ThemedText>
                    <View style={styles.qualityBadgeRow}>
                        {categoryOptions.map((option) => {
                            const isSelected = category === option;
                            return (
                                <Pressable
                                    key={option}
                                    style={[
                                        styles.qualityCapsule,
                                        { backgroundColor: cardBgColor, borderColor: borderColor },
                                        isSelected && { backgroundColor: activeAccentColor, borderColor: activeAccentColor }
                                    ]}
                                    onPress={() => !isSubmitting && setCategory(option)}
                                >
                                    <ThemedText style={[
                                        styles.qualityCapsuleText,
                                        { color: textColor },
                                        isSelected && { color: activeBtnTextColor, fontWeight: 'bold' }
                                    ]}>
                                        {option}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

      
                <View style={styles.qualitySectionContainer}>
                    <ThemedText style={[styles.rowLabelText, { color: textColor }]}>商品の状態（品質）</ThemedText>
                    <View style={styles.qualityBadgeRow}>
                        {qualityOptions.map((option) => {
                            const isSelected = quality === option;
                            return (
                                <Pressable
                                    key={option}
                                    style={[
                                        styles.qualityCapsule,
                                        { backgroundColor: cardBgColor, borderColor: borderColor },
                                        isSelected && { backgroundColor: activeAccentColor, borderColor: activeAccentColor }
                                    ]}
                                    onPress={() => !isSubmitting && setQuality(option)}
                                >
                                    <ThemedText style={[
                                        styles.qualityCapsuleText,
                                        { color: textColor },
                                        isSelected && { color: activeBtnTextColor, fontWeight: 'bold' }
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
                        { backgroundColor: buttonBackgroundColor },
                        (!title || images.length === 0 || isSubmitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color={buttonTextColor} />
                    ) : (
                        <>
                            <MaterialIcons name="add" size={20} color={buttonTextColor} />
                            <ThemedText style={[styles.submitButtonText, { color: buttonTextColor }]}>
                                出品する
                            </ThemedText>
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
    container: { flex: 1 },
    header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    scrollContent: { paddingHorizontal: 30, paddingBottom: 50 },
    imageSectionTextRow: { marginTop: 10, marginBottom: 8 },
    imageSection: { flexDirection: 'row', marginBottom: 30 },
    imageWrapper: { position: 'relative', marginRight: 12 },
    uploadedImage: { width: 110, height: 110, borderRadius: 12 },
    deleteBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 11, zIndex: 10 },
    addImageButton: { width: 110, height: 110, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', gap: 6 },
    addImageButtonText: { fontSize: 12, fontWeight: '600' },
    titleInput: { borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    descInput: { height: 150 },
    rowInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    rowLabel: { fontSize: 16, fontWeight: 'bold', width: 90 },
    rowInput: { flex: 1, borderRadius: 8, height: 45, paddingHorizontal: 15, borderWidth: 1 },
    qualitySectionContainer: { marginBottom: 20, marginTop: 10 },
    rowLabelText: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    qualityBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    qualityCapsule: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    qualityCapsuleText: { fontSize: 13, fontWeight: '500' },
    toastContainer: { position: 'absolute', bottom: '45%', left: '15%', right: '15%', backgroundColor: 'rgba(0, 0, 0, 0.8)', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
    toastText: { color: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
    

    submitButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 40, 
        paddingVertical: 14, 
        borderRadius: 25, 
        backgroundColor: '#60a962', 
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    submitButtonDisabled: { 
        opacity: 0.8 
    },
    submitButtonText: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginLeft: 8,
        color: '#FFFFFF' 
    },
});