import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://mhcytzjsikzlwdzullnp.supabase.co'; // 👈 正确的项目 URL
const supabaseAnonKey = 'sb_publishable_3bM3591-2oPt62riW8NjGA_MQKK8peL'; // 👈 正确的 Anon Key

// ⚡ 核心安全锁：定制一个在服务器/客户端都绝对不会抛出 undefined 的存储适配器
const safeStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null;
    if (Platform.OS === 'web') return window.localStorage.getItem(key);
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

// 导出安全的客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});