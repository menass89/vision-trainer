import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'expo-crypto': fileURLToPath(new URL('./src/test/expoCryptoMock.ts', import.meta.url)),
      'react-native': fileURLToPath(new URL('./src/test/reactNativeMock.ts', import.meta.url)),
    },
  },
});
