/** @type {import('tailwindcss').Config} */
export default {
  // shadcn/ui requires darkMode: "class"
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // shadcn/ui CSS variable tokens
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in":    { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up":   { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-down": { from: { opacity: "0", transform: "translateY(-10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in":   { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        "pop":        { "0%": { transform: "scale(1)" }, "50%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        "fade-in":    "fade-in 0.25s ease both",
        "slide-up":   "slide-up 0.30s cubic-bezier(.22,.68,0,1.2) both",
        "slide-down": "slide-down 0.25s ease both",
        "scale-in":   "scale-in 0.20s cubic-bezier(.22,.68,0,1.2) both",
        "pop":        "pop 0.30s ease",
      },
    },
  },
  plugins: [],
};
