import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { useNotifications } from '@/hooks/useNotifications';
import RegistrationReminder from '@/components/RegistrationReminder';

export const unstable_settings = {
  anchor: '(tabs)',
};

function NotificationWrapper({ children }: { children: React.ReactNode }) {
  useNotifications();
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationWrapper>
          <CartProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="category/[name]" options={{ headerShown: false }} />
                <Stack.Screen name="brand/[name]" options={{ headerShown: false }} />
                <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="checkout" options={{ headerShown: false }} />
                <Stack.Screen name="wallet" options={{ headerShown: false }} />
                <Stack.Screen name="wishlist" options={{ headerShown: false }} />
                <Stack.Screen name="addresses" options={{ headerShown: false }} />
                <Stack.Screen name="add-address" options={{ headerShown: false }} />
                <Stack.Screen name="change-password" options={{ headerShown: false }} />
                <Stack.Screen name="search" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="terms" options={{ headerShown: false }} />
                <Stack.Screen name="privacy" options={{ headerShown: false }} />
                <Stack.Screen name="help-center" options={{ headerShown: false }} />
                <Stack.Screen name="shipping" options={{ headerShown: false }} />
                <Stack.Screen name="refund" options={{ headerShown: false }} />
                <Stack.Screen name="blogs" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <RegistrationReminder />
              <StatusBar style="auto" />
            </ThemeProvider>
          </CartProvider>
        </NotificationWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
