import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["ui-audit.spec.ts", "template-switching.spec.ts"],
  timeout: 120000,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  reporter: "line",
});
