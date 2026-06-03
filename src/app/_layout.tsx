import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';
import { surface } from '@/theme/tokens';
import { useAppFonts } from '@/theme/useAppFonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useAppFonts();
  const hydrated = useAppStore((state) => state.hydrated);
  const hydrate = useAppStore((state) => state.hydrate);
  const onboardingComplete = useAppStore((state) => state.settings.onboardingComplete);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const ready = (loaded || error) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Route gate: a returning user skips onboarding; a fresh user can't slip past it.
  // `needsRedirect` is computed during render so we can withhold the tree until the
  // redirect settles — otherwise the deep-linked screen paints for one frame first.
  const inOnboarding = segments[0] === 'onboarding';
  const needsRedirect =
    ready && ((!onboardingComplete && !inOnboarding) || (onboardingComplete && inOnboarding));

  useEffect(() => {
    if (!needsRedirect) return;
    router.replace(onboardingComplete ? '/(tabs)' : '/onboarding');
  }, [needsRedirect, onboardingComplete, router]);

  if (!ready || needsRedirect) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: surface.base }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: surface.base },
            animation: 'fade',
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="session"
            options={{ presentation: 'fullScreenModal', gestureEnabled: true, animation: 'none' }}
          />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="science"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
