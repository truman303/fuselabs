# FuseLab Digital — Site Plan

A simple, elegant static marketing site for FuseLab Digital, inspired by the
"pixel-burst" motif in the logo. Dark, editorial, boutique — not a typical
tech-startup template. One signature moment on the hero, executed with GSAP.

## 1. Design Concept

**Aesthetic direction: "Digital Craft"** — refined, editorial dark theme with
generous negative space, restrained composition, and one memorable animated
hero. The feel is closer to a design studio or magazine than a SaaS landing
page.

### 1.1 Palette

| Token         | Value     | Purpose                                   |
| ------------- | --------- | ----------------------------------------- |
| `--ink`       | `#0A0B0F` | Near-black background                     |
| `--bone`      | `#F2EEE5` | Warm off-white primary text               |
| `--fuse-cyan` | `#00AEEF` | Signature accent (from logo)              |
| `--smoke`     | `#6B7280` | Muted / secondary text                    |
| `--ember`     | `#FF6B3D` | Rare secondary accent for emphasis        |
| `--hairline`  | `#1C1F26` | Very subtle borders / grid lines          |

### 1.2 Typography (Google Fonts — deliberately non-generic)

- **Display**: `Fraunces` — variable, with optical sizing. Editorial gravitas.
- **Body**: `Instrument Sans` — refined, humanist, modern.
- **Mono**: `JetBrains Mono` — small section labels and technical markers.

No Inter, no Space Grotesk, no system fonts.

### 1.3 Composition

- Asymmetric layout with a prominent vertical rhythm.
- Section numbering in mono (`01 / MANIFESTO`, etc.) as editorial markers.
- Oversized display type set against generous whitespace.
- Hairline horizontal rules between sections using `--hairline`.

## 2. Hero Animation (GSAP core only)

The signature moment. The logo shows pixels "bursting" out of a frame — that is
the concept to animate.

1. **Scatter start**: ~120 small squares pre-placed at randomized positions
   across the hero, `autoAlpha: 0`, random rotation and scale.
2. **Fusion**: Staggered from `"random"` they fly into a tight pixel-burst
   composition that mirrors the logo mark (cyan accents inside, darker neutrals
   around). `back.out(1.7)` for cyan, `power3.out` for neutrals.
3. **Frame draw**: A thin cyan rectangle "frame" strokes in around the cluster
   using `strokeDasharray` / `strokeDashoffset` animated with core GSAP (no
   paid DrawSVG plugin).
4. **Wordmark reveal**: `FUSELAB` split into chars, staggered `yPercent: 100 → 0`
   with `autoAlpha`. `Digital` fades in below on a longer `sine.out`.
5. **Tagline**: Short line slides up underneath.
6. **Idle loop**: 3–4 accent pixels subtly flicker / pulse (`repeat: -1`,
   `yoyo: true`, randomized delays).
7. **Reduced motion**: Wrapped in `gsap.matchMedia()` — when
   `(prefers-reduced-motion: reduce)` matches, we jump straight to the end
   state with `duration: 0` and skip the idle loop.

Implementation lives in a client-side TypeScript file imported with
`client:load`-equivalent pattern (Astro `<script>` tag). SVG-based so it scales
cleanly and is crisp on retina.

## 3. Site Structure

Single page, anchor-linked sections. Simple, focused, all copy from the README
lives here.

1. **Nav** — minimal wordmark left, anchor links right, contact CTA right-most.
   Fixed-top with a subtle backdrop blur once scrolled.
2. **Hero** — GSAP pixel-fusion animation + tagline + primary CTA.
3. **Manifesto** (`01 / MANIFESTO`) — opening paragraph set in large display
   type. This is the "why".
4. **Approach** (`02 / APPROACH`) — "extra mile / team players / selective /
   emotionally involved / boutique" presented as a numbered editorial list with
   generous spacing.
5. **Founders** (`03 / FOUNDERS`) — Deon Heunis and Leo Redelignhuys with the
   Swipe iX / WeChatBuilder / Media24 / MultiChoice track record. Two-column
   layout on desktop.
6. **Partnership** (`04 / WHAT WE PARTNER ON`) — problem-solving, platform
   optimization, digital growth. Short, punchy cards.
7. **Contact** (`05 / CONTACT`) — CTA heading, email link, optional social
   placeholders. Minimal footer beneath with copyright.

## 4. Tech Stack

- **Astro** — static output (no adapter needed initially; Cloudflare Pages
  works fine with the static build).
- **GSAP core** — no paid plugins. All effects achievable with core + CSS
  tricks (stroke-dashoffset for the SVG "draw").
- **CSS** — hand-written with CSS variables. No Tailwind — keeps the site small
  and lets typography breathe.
- **TypeScript** — strict mode.
- **Assets** — logo PNG and favicon copied from `supporting/` into `public/`.

## 5. Work Breakdown

Scope is tight enough that subagents would add overhead. Four phases in the
main thread:

1. **Scaffold**
   - `npm create astro@latest` (minimal template, strict TS, no integrations)
   - Install `gsap`
   - Configure `astro.config.ts` with `site`
   - Copy `supporting/logo.png` and `supporting/favicon.ico` into `public/`
   - Create `src/layouts/Base.astro` with fonts, CSS reset, and design tokens
   - Create `src/styles/tokens.css` for the palette / typography / spacing scale

2. **Hero + GSAP**
   - `src/components/Hero.astro` with the SVG pixel grid markup
   - `src/scripts/pixelFusion.ts` — the animation, wrapped in matchMedia
   - Tagline + CTA markup and styling

3. **Content sections** — small focused components:
   - `Nav.astro`
   - `Manifesto.astro`
   - `Approach.astro`
   - `Founders.astro`
   - `Partnership.astro`
   - `Contact.astro` (includes footer)

4. **Polish**
   - Subtle scroll reveals (GSAP, respects reduced motion)
   - Reduced-motion audit across all animations
   - Linter pass + `npx astro check`
   - `npx astro build` verification

## 6. Open Questions (resolved)

- Static single-page site with anchors — confirmed.
- Dark theme — confirmed.
- Astro scaffold via `npm create astro@latest` — confirmed.
