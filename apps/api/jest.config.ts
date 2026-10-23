import type { Config } from "jest";

const config: Config = {
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: "src",
    testRegex: ".*\\.spec\\.ts$",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: {
                    module: "CommonJS",
                    moduleResolution: "node",
                },
            },
        ],
    },
    // Map `.js` bare-specifier imports (ESM TypeScript source) to the TS files.
    // rootDir is src/, so three levels up to reach the repo root.
    moduleNameMapper: {
        "^(\\.{1,2}/.+)\\.js$": "$1",
        // Workspace packages use ESM; redirect to CJS stubs for unit tests.
        "^@physio/db$": "<rootDir>/__mocks__/physio-db.js",
        "^@physio/shared$": "<rootDir>/__mocks__/physio-shared.js",
        "^@physio/payments$": "<rootDir>/__mocks__/physio-payments.js",
        "^@physio/video$": "<rootDir>/__mocks__/physio-video.js",
    },
    coverageDirectory: "../coverage",
    testEnvironment: "node",
};

export default config;
