import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { changeLocation } from './rollup/modifiers/manifest'
import { extractMarketplaceTranslation } from './rollup/modifiers/translations'
import StaticCopy from './rollup/static-copy-plugin'
import TranslationsLoader from './rollup/translations-loader-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }
  return defineConfig({
    base: './',
    plugins: [
      react(),
      TranslationsLoader(),
      StaticCopy({
        targets: [
          { src: resolve(__dirname, 'src/assets/*'), dest: './' },
          { src: resolve(__dirname, 'src/manifest.json'), dest: '../', modifier: changeLocation },
          {
            src: resolve(__dirname, 'src/translations/en.json'),
            dest: '../translations',
            modifier: extractMarketplaceTranslation
          }
        ]
      })
    ],
    resolve: {
      alias: {
        '@styles': resolve(__dirname, 'src/app/shared/styles')
      }
    },
    root: 'src',
    test: {
      include: ['../{test,spec}/**/*.{test,spec}.{js,ts,jsx}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      globals: true,
      environment: 'jsdom'
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/index.html'),
          editor: resolve(__dirname, 'src/editor.html')
        },
        output: {
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`
        },
        watch: {
          include: 'src/**'
        }
      },
      outDir: resolve(__dirname, 'dist/assets'),
      emptyOutDir: true
    }
  })
}
