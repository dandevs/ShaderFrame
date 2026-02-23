import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react({
        babel: {
          plugins: [
            // Decorators must run before class properties when using legacy decorators
            [
              "@babel/plugin-proposal-decorators",
              { legacy: true }
            ],
            // Enable class property handling (required for decorated props)
            [
              "@babel/plugin-proposal-class-properties",
              { loose: true }
            ]
          ]
        }
      })
    ]
  }
})
