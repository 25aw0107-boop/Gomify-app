import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  // 🔐 1. 核心路由守卫：登录状态检测
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // 规定哪些页面是登录后才能看的受保护页面
    const protectedPages = ['dashboard', 'scan', 'calendar', 'mypage', 'reuse', 'messages'];
    const currentSegment = segments[0] || 'index';

    // 兼容动态路由判断
    const isProtected = protectedPages.some(page => currentSegment.startsWith(page));

    if (session && (currentSegment === 'index' || currentSegment.startsWith('signin') || currentSegment === 'signup')) {
      // 已登录，去主程序
      router.replace('/dashboard');
    } else if (!session && isProtected) {
      // 未登录，拦截踢回首页
      router.replace('/');
    }
  }, [session, initialized, segments]);

  // 加载中动画
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#76C800" />
      </View>
    );
  }

  // ✨ 终极修复：把原先的 <Tabs> 彻底换成 <Stack>
  // 这样系统就不会在底部自动多画一排多余的英文白底栏了！
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 隐藏原生白条
        animation: 'none',   // 丝滑无缝切换
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signin-password" />
      <Stack.Screen name="signin-email" />
      <Stack.Screen name="signin-google" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="mypage" />
      <Stack.Screen name="modal" />

      {/* 嵌套或动态路由部分 */}
      <Stack.Screen name="messages/[id]" />
      <Stack.Screen name="reuse/index" />
      <Stack.Screen name="reuse/create" />
      <Stack.Screen name="reuse/[id]" />
    </Stack>
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="signin-apple" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="signin-google" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="signin-email" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="address" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
