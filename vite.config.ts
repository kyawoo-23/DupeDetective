import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Browser-safe GitHub access (codeload only allows github.com origins, not localhost). */
const githubProxies = {
  '/__github_api': {
    target: 'https://api.github.com',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/__github_api/, ''),
  },
  '/__github_codeload': {
    target: 'https://codeload.github.com',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/__github_codeload/, ''),
  },
};

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // @babel/types reads process.env at module init; define replacements for the browser bundle.
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.BABEL_TYPES_8_BREAKING': 'false',
  },
  optimizeDeps: {
    include: ['@babel/parser', '@babel/traverse', '@babel/types'],
  },
  server: { proxy: githubProxies },
  preview: { proxy: githubProxies },
}));
