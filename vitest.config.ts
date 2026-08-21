import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The RLS suite provisions a scratch Postgres cluster in beforeAll.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
