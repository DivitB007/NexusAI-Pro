import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Safely expose the API_KEY and DB URL from the build environment to the client
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.NETLIFY_DATABASE_URL': JSON.stringify(env.NETLIFY_DATABASE_URL)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});