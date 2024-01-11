import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
/**
 https://www.raulmelo.me/en/blog/build-javascript-library-with-multiple-entry-points-using-vite-3#using-vite-32-or-later
 */
export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: {
        main: resolve(__dirname, 'src/main.ts'),
        abc: resolve(__dirname, 'src/abc.ts'),
        bcd: resolve(__dirname, 'src/bcd.ts'),
      },
      formats: ["es", "cjs"],
    }
  },
  plugins: [dts()]
})