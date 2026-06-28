# Buyer Mobile Performance Design

## Objective

Improve perceived and measured mobile performance across buyer pages while preserving every image and video preview. Media must not use lazy loading.

## Evidence

- The supplied Lighthouse reports repeatedly show long main-thread work, render-blocking CSS, unused framework JavaScript, and oversized media.
- The live deployment serves `next-devtools/dev-overlay` code in an 801 KB JavaScript chunk. This proves the current public service is running a development build.
- A fresh local `next build` produces 102 KB shared first-load JavaScript, so production deployment is the highest-impact correction.
- Catalog and wishlist cards already receive insight totals from the server, but every mounted `LotRealtimeStats` currently starts another request and a 15-second polling interval.
- The violation page renders full-resolution uploads through native `<img>` elements and rerenders its entire client tree every second for one countdown.
- The global scroll-reveal observer scans broad selectors after hydration, while buyer route templates already provide a CSS page transition.

## Approved Design

### Production Runtime

Keep the existing standalone Docker build as the deployment contract: `npm run build`, `NODE_ENV=production`, and `node server.js`. Dokploy must deploy from the Dockerfile without a custom `npm run dev` command. Live verification must confirm that delivered chunks no longer contain Next.js dev-overlay code.

### Buyer Statistics

Catalog and wishlist cards use their server-provided initial statistics without polling. They refresh immediately after a wishlist mutation and once when the browser tab becomes visible again. The item detail page records its view immediately and remains live with a 30-second interval.

### Media

Buyer media uses `next/image` with responsive `sizes`, explicit geometry, and eager loading. Above-the-fold product images use `priority`. Video previews remain mounted with metadata preloading and the existing preview-frame behavior. No image or video preview is removed.

### Rendering And Motion

Remove the global scroll-reveal observer and its broad DOM scan. Buyer route templates keep a short transform-and-opacity transition with reduced-motion support. The violation countdown owns its ticking state so the history and media sections do not rerender every second.

## Verification

- Regression tests cover statistics refresh behavior, polling policy, eager media, optimized violation images, and absence of the global observer.
- Run targeted buyer tests, the complete Vitest suite, TypeScript checking, and `next build`; record unrelated baseline failures separately.
- Compare buyer route first-load JavaScript with the 102 KB shared baseline.
- Browser automation is intentionally excluded; verification uses tests, source contracts, build output, HTTP headers, and live asset inspection.
