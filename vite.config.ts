import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig(() => {
  return {
    root: './src',
    publicDir: '../public',
    base: '/liquid-metal/',
    build: {
      outDir: '../dist',
    },
    plugins: [glsl(), wasm(), topLevelAwait()],
    server: {
      host: true,
    },
  }
})
