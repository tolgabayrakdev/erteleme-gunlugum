import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notifications';
import { SplashScreen } from '@/components/splash-screen';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize notifications
    notificationService.scheduleWeeklyCheck().catch(console.error);
  }, []);

  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-task" options={{ presentation: 'modal', title: 'Yeni Görev' }} />
        <Stack.Screen name="postpone-modal" options={{ presentation: 'modal', title: 'Görevi Ertele' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
