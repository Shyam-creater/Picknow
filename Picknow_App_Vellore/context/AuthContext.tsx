import React, {
  createContext,
  useState,
  useEffect,
  useContext,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSegments, useRouter } from 'expo-router';

interface AuthContextType {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('AuthContext: Failed to parse stored user:', e);
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoading]);

  const login = async (newToken: string, newUser: any) => {
    try {
      setToken(newToken);
      setUser(newUser);

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      // No router.replace here, the useEffect below handles it
    } catch (error) {
      console.error('Error saving login data:', error);
    }
  };

  const logout = () => {
    try {
      // 1. Navigate immediately to prevent flashing of guest states
      router.replace('/(auth)/login');

      // 2. Clear state synchronously
      setToken(null);
      setUser(null);

      // 3. Clear storage in background
      AsyncStorage.multiRemove(['token', 'user']).catch(error => {
        console.error('Error clearing logout data:', error);
      });
    } catch (error) {
      console.error('Error clearing logout data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
