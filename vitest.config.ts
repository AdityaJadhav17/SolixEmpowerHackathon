import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "eval/score.ts"],
      exclude: ["**/*.test.ts"],
      reporter: ["text", "cobertura", "html"],
      thresholds: { lines: 70 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "eval/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: { name: "safety", include: ["tests/safety/**/*.test.ts"] },
      },
    ],
  },
});
