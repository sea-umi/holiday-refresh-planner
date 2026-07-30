import { defineConfig } from "vite";

// 開発中だけ、画面（Vite）からの /api リクエストを
// Node.jsサーバーへ渡します。APIキーはブラウザへ送られません。
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
