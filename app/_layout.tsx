import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
   <Stack
      screenOptions={{
        animation: 'none', 
        headerShown: false, 
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="scan" />
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
