# 🎨 Design System: MailBlast SaaS

## 1. Design Philosophy
- **Vibe:** Developer-centric, clinical, Supabase-inspired.
- **Goal:** High data density, maximum readability, zero "AI slop" (no heavy gradients, no soft blurred shadows on primary elements).
- **Execution:** Rely on 1px borders for structure. Use the Primary color strictly for calls-to-action (CTAs) and active states.

## 2. Typography
- **Primary Font (Sans-Serif):** `Outfit`, sans-serif.
- **Fallback Fonts (Serif/Mono):** System defaults (Georgia/Times for serif, monospace for code blocks).
- **Global Letter Spacing (Tracking):** `0.025em` (Normal). Gives a slightly airy, modern feel to the text without compromising readability.
- **Implementation:** Set at the `<body>` level via `@layer base`.

## 3. Color System (Tailwind v4 / OKLCH)

### Light Mode (Crisp & White)
- **Background:** Pure White (`oklch(0.9911 0 0)`).
- **Foreground (Text):** Deep Gray/Charcoal (`oklch(0.2046 0 0)`).
- **Primary Accent:** Vivid Emerald/Teal (`oklch(0.8348 0.1302 160.9080)`). Used for main buttons ("Kirim Sekarang") and active progress bars.
- **Destructive:** Soft Red. Used for failed email statuses or delete actions.
- **Borders:** Very light gray (`oklch(0.9037 0 0)`). Used extensively to separate cards and table rows instead of drop shadows.

### Dark Mode (Deep & High Contrast)
- **Background:** Extremely dark charcoal, nearly black (`oklch(0.1822 0 0)`). Reduces eye strain for long sessions.
- **Foreground (Text):** Crisp Off-White (`oklch(0.9288 0.0126 255.5078)`).
- **Primary Accent:** Deep Emerald (`oklch(0.4365 0.1044 156.7556)`). Tuned for dark mode so it doesn't bleed or cause halation against the dark background.
- **Borders:** Subtle dark gray (`oklch(0.2809 0 0)`). 

## 4. UI Components & Geometry
- **Border Radius:** `0.5rem` (8px). A balanced radius—not too sharp (which feels aggressive) and not too rounded (which feels like a consumer toy).
- **Borders over Shadows:** All interactive elements (`*`) default to having an outline/border applied. 
- **Shadows:** Minimalist. Deep shadows (`--shadow-xl`, `--shadow-2xl`) should only be used for modals or floating popovers, never for standard dashboard cards.

## 5. Developer Notes
- We are using the new Tailwind CSS v4 `@theme inline` structure with `oklch()` color spaces for better gamut support.
- When building the **Progress Tracker**, use `bg-primary` for the success bar, and `bg-destructive` for failed segments.
- The layout should be built using standard `<div className="border border-border rounded-lg bg-card text-card-foreground p-6">` wrappers to maintain consistency.