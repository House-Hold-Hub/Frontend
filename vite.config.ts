import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Restore env stubs and mocks between tests so cases cannot leak into each other.
    unstubEnvs: true,
    restoreMocks: true,
  },
});
