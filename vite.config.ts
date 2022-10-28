import { defineConfig } from 'vite'
import raw from 'vite-plugin-raw'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => `index.js`,
    },
  },
  plugins: [raw({ match: /\.svg$/ })],
})
