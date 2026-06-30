---
name: Maszyna color system
description: How gradients, partner colors, and CSS custom properties are structured in the Maszyna app.
---

## Color utilities
All shared color helpers are exported from `src/lib/partner-colors-context.tsx`:
- `hexToRgba(hex, alpha)` — rgba string
- `darkenHex(hex, factor=0.38)` — rgb string at reduced brightness
- `makeGradient(hex, angle=135)` — full linear-gradient string (dark → hex)

Import these in screens rather than re-implementing locally.

## Partner color palette
`PARTNER_COLORS` (9 entries): Navy, Sage, Terracotta, Amber, Plum, Forest, Moss, Rose, Clay. Stored in `localStorage` as `myColor` / `partnerColor`.

## Context values
`usePartnerColors()` provides: `myColor`, `partnerColor`, `myGradient`, `partnerGradient`, `setMyColor`, `setPartnerColor`.

## CSS custom properties
On every `myColor` / `partnerColor` change, the provider injects via `useEffect`:
- `--gradient-profile` = `makeGradient(myColor)` → `.btn-profile` picks this up automatically
- `--color-my` = `myColor`
- `--gradient-partner` = `makeGradient(partnerColor)`
- `--color-partner` = `partnerColor`

## Module gradients (index.css)
- Kitchen/Fuel: `--gradient-kitchen` (`#1E2E22 → #4A7A50`)
- Gain/Workout: `--gradient-workout` (`#0F1E2A → #3D5A6C`, muted navy)
- Dashboard: `--gradient-dashboard` (`#262E12 → #6B7C3A`, olive)
- Planner/Plan: `--gradient-planner` (`#4A1E0A → #96502A`, brown-terracotta)
- Track/Profile: `--gradient-profile` (dynamic via CSS var, driven by `myColor`)

**Why:** Gain↔Plan gradients were swapped (navy→Gain, terracotta→Plan) to match intended module feel.

## Event styles in Planner
`getEventStyle(type, owner)` in `CalendarView` returns `React.CSSProperties` with `rgba`-based gradient, alpha-modulated by event type: training=1.0, meal=0.80, supplements=0.60. Owner drives hex (myColor vs partnerColor).

## Kitchen screen pattern
Owner toggles (Both/Partner/Me) use conditional inline style for active state:
- Both → `btn-kitchen` class
- Partner (Marcin) → `style={{ background: partnerGradient }}`
- Me (Patrycja) → `style={{ background: myGradient }}`
