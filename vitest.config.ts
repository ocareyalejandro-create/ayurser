import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Engine logic is pure — a Node environment is all we need.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
