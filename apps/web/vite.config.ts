import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      "@birthub/contracts": path.resolve(__dirname, "../../packages/contracts/src/index.ts"),
      "@birthub/design-system/styles.css": path.resolve(__dirname, "../../packages/design-system/src/styles.css"),
      "@birthub/design-system": path.resolve(__dirname, "../../packages/design-system/src/index.ts")
    }
  }
});
