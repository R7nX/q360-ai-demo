/**
 * Vitest + React plugin: node environment, jest-dom setup, `@` alias, coverage for lib and API routes.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/api/**", "app/feature2/**"],
      exclude: ["**/*.test.*", "node_modules"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
