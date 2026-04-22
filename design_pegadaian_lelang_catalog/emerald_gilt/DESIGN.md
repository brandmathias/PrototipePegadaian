# Design System Strategy: The Sovereign Curator

## 1. Overview & Creative North Star
The "Sovereign Curator" is the creative north star for this design system. We are moving away from the "government form" aesthetic and toward a "High-End Editorial Auction" experience. The goal is to balance the absolute authority of a state-owned enterprise with the prestige of a luxury jewelry and asset auction house.

This system breaks the traditional "flat grid" template by using **Tonal Depth** and **Intentional Asymmetry**. We treat the UI not as a digital screen, but as a series of physical, premium surfaces—like heavy-stock paper and frosted glass—layered to guide the user’s eye toward high-value items.

## 2. Colors: Tonal Authority
Our palette is rooted in the "Deep Green" of institutional trust and the "Gold" of intrinsic value. However, we apply these with surgical precision to avoid a "gaudy" appearance.

### The Color Strategy
*   **Primary (#004a23):** Used for primary actions and brand anchoring. 
*   **Secondary (#735c00):** Used sparingly as a "Certificate of Authenticity" accent.
*   **Surface Hierarchy:** We utilize the `surface-container` tiers to create a "nested" UI.
    *   **Background (#f9f9f9):** The canvas.
    *   **Surface-Container-Low (#f3f3f3):** For large sectioning (e.g., filter sidebars).
    *   **Surface-Container-Lowest (#ffffff):** For interactive cards and main content areas to make them "pop" against the light grey.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts. A `surface-container-low` sidebar sitting against a `background` provides all the definition needed. Lines create visual noise; tonal shifts create elegance.

### The "Glass & Gradient" Rule
To elevate the experience, use **Glassmorphism** for floating headers or sticky auction bid bars. 
*   **Token:** Use `surface` at 80% opacity with a `backdrop-filter: blur(12px)`.
*   **Signature Textures:** Apply a subtle linear gradient from `primary` (#004a23) to `primary_container` (#006432) on hero buttons to give them a three-dimensional "pressed gold" feel that flat colors cannot achieve.

## 3. Typography: Editorial Precision
The system pairs the high-character **Manrope** for displays with the utilitarian **Inter** for data-heavy auction details.

*   **Display & Headline (Manrope):** These are our "Auctioneer" voices. Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) for high-value hero items. It feels authoritative and modern.
*   **Title & Body (Inter):** These are our "Appraiser" voices. Use `title-md` (1.125rem) for product names. For technical specs (karat weight, dimensions), use `body-sm` (0.75rem) to maintain a clean, organized look despite high information density.
*   **Label (Inter):** Used for status tags (e.g., "Live Now," "Sold"). Always uppercase with `0.05em` letter spacing to mimic premium watch brand typography.

## 4. Elevation & Depth: Tonal Layering
We reject the heavy, muddy shadows of 2010-era web design. Depth in this system is achieved through light and layering.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a natural "lift" based on color theory rather than drop shadows.
*   **Ambient Shadows:** If a card must float (e.g., a hovered auction item), use a shadow tinted with `on-surface` (#1a1c1c) at 4% opacity with a 32px blur. It should feel like a soft glow, not a dark edge.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use for "Quick Bid" overlays. The semi-transparent surface allows the product image to bleed through, keeping the user grounded in the catalog while they interact.

## 5. Components: The Auction Toolkit

### Product Cards
*   **Rule:** No dividers. Use `spacing-6` (1.5rem) to separate the image from the text.
*   **Style:** `surface-container-lowest` background, `rounded-lg` (0.5rem) corners.
*   **Content:** The price should use `title-lg` in `primary` (#004a23) to establish immediate financial hierarchy.

### The "Sovereign" Button
*   **Primary:** Background `primary`, text `on_primary`. Use a subtle inner shadow (top-down) to give a tactile, embossed feel.
*   **Secondary:** No fill. Use a `Ghost Border` and `primary` text. This is for secondary actions like "View Details."
*   **Radius:** Standardize on `md` (0.375rem) for a sharp, professional look. Avoid "pill" shapes which feel too casual for government-enterprise use.

### Filter Controls
*   **Chips:** Use `surface-container-high` for unselected states. When selected, transition to `secondary_container` (#fed65b) with `on_secondary_container` text.
*   **Inputs:** Minimalist approach. Only a bottom-border using `outline_variant` (20% opacity) that animates to `primary` on focus.

### Additional Signature Components
*   **Lot Status Badge:** A small, floating glassmorphic tag in the top-right of product images using `surface_container_highest` at 70% opacity.
*   **Countdown Timer:** Use `tertiary_container` (#8f3a47) for urgent "Ending Soon" notices, providing a sophisticated red-tone contrast to the green brand colors.

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a structural element. If you feel a section needs a line, try adding `spacing-12` (3rem) instead.
*   **DO** use asymmetrical layouts for Hero sections—place a large product image slightly off-grid to create a high-end "Editorial" feel.
*   **DO** ensure all text on `secondary_container` (Gold) meets AA contrast ratios by using the `on_secondary_container` (#745c00) token.

### Don't
*   **DON'T** use 100% black (#000000). Always use `on_surface` (#1a1c1c) to keep the look sophisticated and soft.
*   **DON'T** use standard "Material Design" ripples for buttons. Use a subtle opacity shift (e.g., 90%) on hover to maintain a "quiet" professional atmosphere.
*   **DON'T** clutter product cards with too many icons. Trust the typography and the "Deep Green" color to lead the user.