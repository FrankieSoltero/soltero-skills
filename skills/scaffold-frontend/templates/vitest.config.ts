import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Install: npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
// package.json: "test": "vitest run", "test:watch": "vitest"
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
  },
});
