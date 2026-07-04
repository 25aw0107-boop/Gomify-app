import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
const [session, setSession] = useState<Session | null>(null);
const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(session ?? null);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setSession(null);
          setLoading(false);
        }
      }
    };

    // VILKTIGT: Du måste faktiskt köra funktionen här!
    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

 useEffect(() => {
  if (loading) return;

  const protectedPages = [
    'dashboard',
    'scan',
    'calendar',
    'mypage',
    'reuse',
    'messages',
  ];

  const currentSegment = segments[0] || 'index';

  const isProtected = protectedPages.some(page =>
    currentSegment.startsWith(page)
  );

  if (!session && isProtected) {
    router.replace('/');
  }
}, [loading, session, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // 隐藏原生白条
        animation: 'none',   // 丝滑无缝切换
      }}
    >
      {/* 注册你项目里平铺的所有 15 个页面路径 */}
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
  );
}