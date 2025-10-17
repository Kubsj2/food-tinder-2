import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme';

function ProtectedSlot() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' && !inAuthGroup) router.replace('/(auth)/login');
    if (status === 'authenticated' && inAuthGroup) router.replace('/(tabs)');
  }, [status, inAuthGroup]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProtectedSlot />
      </AuthProvider>
    </ThemeProvider>
  );
}
