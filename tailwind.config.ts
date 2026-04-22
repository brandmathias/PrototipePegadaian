import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2rem",
        xl: "3rem"
      }
    },
    extend: {
      colors: {
        background: "#f9f9f9",
        foreground: "#1a1c1c",
        card: "#ffffff",
        "card-foreground": "#1a1c1c",
        popover: "#ffffff",
        "popover-foreground": "#1a1c1c",
        primary: "#004a23",
        "primary-foreground": "#ffffff",
        secondary: "#735c00",
        "secondary-foreground": "#ffffff",
        muted: "#f3f3f3",
        "muted-foreground": "#3f4940",
        accent: "#fed65b",
        "accent-foreground": "#745c00",
        destructive: "#ba1a1a",
        "destructive-foreground": "#ffffff",
        border: "rgba(191, 201, 189, 0.28)",
        input: "#e8e8e8",
        ring: "#004a23",
        surface: {
          DEFAULT: "#f9f9f9",
          low: "#f3f3f3",
          lowest: "#ffffff",
          mid: "#eeeeee",
          high: "#e8e8e8",
          highest: "#e2e2e2"
        },
        tertiary: {
          DEFAULT: "#712331",
          container: "#8f3a47",
          foreground: "#ffbac0"
        }
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem"
      },
      boxShadow: {
        ambient: "0 4px 32px rgba(26, 28, 28, 0.04)",
        lift: "0 24px 64px rgba(0, 74, 35, 0.12)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.18)"
      },
      fontFamily: {
        headline: ["var(--font-manrope)"],
        body: ["var(--font-inter)"]
      },
      backgroundImage: {
        sovereign: "linear-gradient(135deg, #004a23 0%, #006432 100%)",
        gilded: "linear-gradient(180deg, #004a23 0%, #00381a 100%)",
        pattern:
          "radial-gradient(circle at top left, rgba(0, 74, 35, 0.12), transparent 30%), radial-gradient(circle at bottom right, rgba(115, 92, 0, 0.14), transparent 35%)"
      }
    }
  },
  plugins: []
};

export default config;
