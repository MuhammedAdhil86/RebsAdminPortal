import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const API_TARGET = "https://rebs-control-panal-k3qzq.ondigitalocean.app";

// Every path prefix your API calls start with (see ApiEndpoints.js)
const API_PREFIXES = ["/platform", "/tenant", "/teqbae", "/subscriptions"];

const proxy = Object.fromEntries(
  API_PREFIXES.map((prefix) => [
    prefix,
    { target: API_TARGET, changeOrigin: true, secure: true },
  ]),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { proxy },
});
