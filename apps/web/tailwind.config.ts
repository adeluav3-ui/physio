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
                    50:  "var(--color-primary-50)",
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
                    0:   "var(--color-neutral-0)",
                    50:  "var(--color-neutral-50)",
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
                /* status — use ONLY for safety / clinical status + text labels */
                ok: {
                    bg:   "var(--color-ok-bg)",
                    text: "var(--color-ok-text)",
                },
                warn: {
                    bg:   "var(--color-warn-bg)",
                    text: "var(--color-warn-text)",
                },
                danger: {
                    bg:   "var(--color-danger-bg)",
                    text: "var(--color-danger-text)",
                    /* legacy aliases */
                    50:  "var(--color-danger-bg)",
                    500: "var(--color-danger-500)",
                    700: "var(--color-danger-text)",
                },
                success: {
                    50:  "var(--color-ok-bg)",
                    500: "var(--color-success-500)",
                    700: "var(--color-ok-text)",
                },
                warning: {
                    50:  "var(--color-warn-bg)",
                    500: "var(--color-warning-500)",
                    700: "var(--color-warn-text)",
                },
                bg:      "var(--color-bg)",
                surface: "var(--color-surface)",
                border:  "var(--color-border)",
                text: {
                    DEFAULT: "var(--color-text)",
                    muted:   "var(--color-text-muted)",
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
                sans: ["var(--font-sans)", "Figtree", "system-ui", "-apple-system", "sans-serif"],
                mono: ["var(--font-mono)", "ui-monospace", "monospace"],
            },
            transitionTimingFunction: {
                out: "var(--ease-out)",
            },
            minHeight: {
                "touch": "44px",
            },
        },
    },
    plugins: [],
};

export default config;
