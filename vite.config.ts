import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import wasm from 'vite-plugin-wasm'

export default defineConfig(() => {
  return {
    root: './src',
    publicDir: '../public',
    base: '/liquid-metal/',
    build: {
      outDir: '../dist',
    },
    plugins: [glsl(), wasm()],
    server: {
      host: true,
    },
  }
})
