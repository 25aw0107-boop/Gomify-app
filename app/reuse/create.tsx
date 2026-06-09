import React, { useState } from 'react';
import {
    StyleSheet, View, Pressable, TextInput,
    ScrollView, Image, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import * as ImagePicker from 'expo-image-picker';

export default function CreateListingScreen() {
    const router = useRouter();

    // --- 表单状态 ---
    const [images, setImages] = useState<string[]>([]); // 存储选中的图片URI
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [station, setStation] = useState('');
    const [quality, setQuality] = useState('');

    // --- 选择图片逻辑 ---
    const pickImage = async () => {
        // 请求权限
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('抱歉', '我们需要相册权限来上传照片');
            return;
        }

        // 打开选择器
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    // --- 提交逻辑 ---
    const handleSubmit = () => {
        if (!title || !description || images.length === 0) {
            Alert.alert('提示', '请至少上传一张照片并填写标题和说明');
            return;
        }

        // 这里通常是调用你的后端API
        Alert.alert('成功', '物品已提交出品！', [
            { text: '确定', onPress: () => router.back() }
        ]);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* 顶部返回导航 */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. 图片上传区域 */}
                <View style={styles.imageSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {images.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.uploadedImage} />
                        ))}
                        <Pressable style={styles.addImageButton} onPress={pickImage}>
                            <MaterialIcons name="add" size={40} color="#666" />
                        </Pressable>
                    </ScrollView>
                </View>

                {/* 2. 标题输入 */}
                <TextInput
                    style={styles.titleInput}
                    placeholder="タイトル"
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor="#999"
                />

                {/* 3. 说明输入 */}
                <TextInput
                    style={[styles.titleInput, styles.descInput]}
                    placeholder="簡単な紹介"
                    multiline
                    numberOfLines={6}
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                    placeholderTextColor="#999"
                />

                {/* 4. 最寄り駅 & 品質 (行布局) */}
                <View style={styles.rowInputContainer}>
                    <ThemedText style={styles.rowLabel}>最寄り駅</ThemedText>
                    <TextInput
                        style={styles.rowInput}
                        value={station}
                        onChangeText={setStation}
                    />
                </View>

                <View style={styles.rowInputContainer}>
                    <ThemedText style={styles.rowLabel}>品質</ThemedText>
                    <TextInput
                        style={styles.rowInput}
                        value={quality}
                        onChangeText={setQuality}
                    />
                </View>

                {/* 5. 提交按钮 */}
                <Pressable
                    style={[styles.submitButton, (!title || images.length === 0) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                >
                    <MaterialIcons name="add" size={20} color="#999" />
                    <ThemedText style={styles.submitButtonText}>出品する</ThemedText>
                </Pressable>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 30,
        paddingBottom: 50,
    },
    // 图片区域样式
    imageSection: {
        flexDirection: 'row',
        marginBottom: 30,
        marginTop: 10,
    },
    uploadedImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
        marginRight: 15,
    },
    addImageButton: {
        width: 120,
        height: 120,
        backgroundColor: '#EAEAEA',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        borderStyle: 'dashed',
    },
    // 输入框通用样式
    titleInput: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    descInput: {
        height: 150,
    },
    // 行布局样式
    rowInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    rowLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        width: 100,
        color: '#333',
    },
    rowInput: {
        flex: 1,
        backgroundColor: '#EEE',
        borderRadius: 8,
        height: 45,
        paddingHorizontal: 15,
    },
    // 提交按钮
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EBE9DE',
        marginTop: 40,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginLeft: 8,
    },
});