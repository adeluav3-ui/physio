import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{ts,tsx}",
        "../../packages/ui/src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "var(--color-primary-50)",
                    100: "var(--color-primary-100)",
                    200: "var(--color-primary-200)",
                    300: "var(--color-primary-300)",
                    400: "var(--color-primary-400)",
                    500: "var(--color-primary-500)",
                    600: "var(--color-primary-600)",
                    700: "var(--color-primary-700)",
                    800: "var(--color-primary-800)",
                    900: "var(--color-primary-900)",
                },
                neutral: {
                    0: "var(--color-neutral-0)",
                    50: "var(--color-neutral-50)",
                    100: "var(--color-neutral-100)",
                    200: "var(--color-neutral-200)",
                    300: "var(--color-neutral-300)",
                    400: "var(--color-neutral-400)",
                    500: "var(--color-neutral-500)",
                    600: "var(--color-neutral-600)",
                    700: "var(--color-neutral-700)",
                    800: "var(--color-neutral-800)",
                    900: "var(--color-neutral-900)",
                },
                success: {
                    50: "var(--color-success-50)",
                    500: "var(--color-success-500)",
                    700: "var(--color-success-700)",
                },
                warning: {
                    50: "var(--color-warning-50)",
                    500: "var(--color-warning-500)",
                    700: "var(--color-warning-700)",
                },
                danger: {
                    50: "var(--color-danger-50)",
                    500: "var(--color-danger-500)",
                    700: "var(--color-danger-700)",
                },
                bg: "var(--color-bg)",
                surface: "var(--color-surface)",
                border: "var(--color-border)",
                text: {
                    DEFAULT: "var(--color-text)",
                    muted: "var(--color-text-muted)",
                    inverse: "var(--color-text-inverse)",
                },
            },
            borderRadius: {
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
            },
            boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
            },
            fontFamily: {
                sans: ["var(--font-sans)"],
                mono: ["var(--font-mono)"],
            },
            transitionTimingFunction: {
                out: "var(--ease-out)",
            },
        },
    },
    plugins: [],
};

export default config;