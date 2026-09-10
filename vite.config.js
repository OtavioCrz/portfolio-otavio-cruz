import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  /* Raiz absoluta: o site mora na raiz de otaviocruz.com.br, e a
     pré-renderização (build SSR) precisa das mesmas URLs de assets do
     cliente — com base relativa elas sairiam como caminhos de arquivo. */
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    assetsInlineLimit: 0,
  },
})
