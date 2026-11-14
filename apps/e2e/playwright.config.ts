import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
    testDir: "./tests",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [["html", { outputFolder: "../../docs/playwright-report" }], ["list"]],
    use: {
        baseURL: BASE_URL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "mobile",
            use: {
                ...devices["iPhone 14"],
                viewport: { width: 390, height: 844 },
            },
        },
        {
            name: "desktop",
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1280, height: 800 },
            },
        },
    ],
    snapshotDir: "../../docs/screenshots",
    outputDir: "../../docs/playwright-output",
});
