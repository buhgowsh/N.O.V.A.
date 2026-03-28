import path from "crwdns10383:0crwdne10383:0";
import tailwindcss from "crwdns10385:0crwdne10385:0";
import { defineConfig } from "crwdns10387:0crwdne10387:0";
import react from "crwdns10389:0crwdne10389:0";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "crwdns10391:0crwdne10391:0")
    }
  }
});