import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
  },
  server: {
    port: 8080,
  },
  define: {
    'import.meta.env.GAME_SERVER': '(\"ws://localhost:2567\")'
  },
});
