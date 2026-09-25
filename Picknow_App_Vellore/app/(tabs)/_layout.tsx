import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp, rf } from '@/constants/responsive';

export default function TabLayout() {
  const { totalQuantity } = useCart();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F38000',
        tabBarInactiveTintColor: '#8E949A',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
        ),
        tabBarStyle: {
          position: 'relative',
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: '#FFFFFF',
          height: hp(8) + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : hp(1.2),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          paddingTop: hp(0.6),
        },
        tabBarLabelStyle: {
          fontSize: rf(10),
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          paddingBottom: insets.bottom > 0 ? 0 : hp(0.6),
        },
        tabBarIconStyle: {
          marginTop: insets.bottom > 0 ? 0 : hp(0.6),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={rf(26)} name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={rf(26)} name={focused ? "grid" : "grid-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: totalQuantity > 0 ? totalQuantity : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#FF3B30',
            fontSize: rf(10),
            lineHeight: rf(14),
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bag-handle" : "bag-handle-outline"}
              size={rf(26)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={rf(26)} name={focused ? "wallet" : "wallet-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={rf(26)}
              name={focused ? "person" : "person-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
