# dxtnn.site

Personal portfolio of Ibnu Dexton, a developer and visual communication design student based in Tangerang. The whole page is dressed as a terminal, and most of the effort went into the parts that don't look like a template: a physics ID badge, a sushi-belt tech stack, and a footer wordmark with a small crew living on it.

Live at **https://dxtnn.site**

## What's in it

**Terminal UI, two themes.** Every section is a window with a prompt line. Dark and light themes share one set of CSS variables, so components that draw their own colors (the belt, the badge strap, the footer ink) follow the theme without a second stylesheet.

**Stack belt.** The tech stack is a conveyor belt with plain plates, one tab per category. Hover pauses it, dragging spins it with momentum, clicking a plate flies it up into a detail card. It started as a React component and was ported to Vue 3 with the geometry kept intact: the belt is a stadium loop projected with a cheap perspective, and plates are placed by arc length on every frame. Logos are monochrome paths from [simple-icons](https://simpleicons.org), stored in `src/data/stackIcons.js`.

**ID badge.** A lanyard card driven by a small Verlet rope solver (`src/utils/lanyardPhysics.js`). The strap texture is drawn on a canvas at runtime. You can drag it, flip it, and it keeps swinging when idle.

**Footer crew.** The `DXTNN` wordmark is SVG text pushed through an ink filter, with characters that react to hover and click (`src/components/DoodleCrew.vue`).

**Small things that do real work.**
- GitHub contribution heatmap with retry and timeout logic, built for flaky mobile connections and in-app browsers.
- Visitor counter on a Vercel function backed by Upstash Redis.
- A chatbot that answers from a curated fact sheet through a serverless endpoint.
- Smooth scrolling with Lenis on desktop, native scrolling on touch devices.
- A skeleton screen that holds the layout until the intro finishes.

## Performance approach

The page is meant to look the same on a cheap phone as on a desktop, so animations are never switched off, only made cheaper.

- Heavy effects (SVG noise filters, per-frame redraws) run only on devices that can afford them. On touch devices and low-core machines the same scenes use a static texture and a 30 fps cap instead.
- Every `requestAnimationFrame` loop stops when its section leaves the viewport or the tab is hidden.
- `prefers-reduced-motion` downgrades the heavy effects rather than removing the motion.
- Nothing remounts when you switch tabs in the stack section; the belt stays mounted and only swaps its plates.

## Stack

| | |
|---|---|
| Framework | Vue 3 (Options and `<script setup>`), Vue CLI 5 |
| Styling | Hand-written CSS with custom properties, no UI framework |
| Motion | `requestAnimationFrame` simulations, Web Animations API, Lenis |
| Backend | Vercel serverless functions in `api/` |
| Storage | Upstash Redis (REST) |
| Hosting | Vercel |

## Project layout

```
api/                     serverless functions (chat, visitors, redis helper)
public/frontend/         terminal.css, main.js (scroll spy, anchors, intro), vendor libs
src/
  components/            StackConveyor, DoodleCrew, LanyardBadge, AiAssistant, ...
  data/portfolio.json    all site copy: sections, stack, services, projects
  data/stackIcons.js     logo paths for the stack belt
  utils/                 lanyard physics and strap, doodle helpers, audio
  views/pages/           one component per section
```

Almost all text lives in `src/data/portfolio.json`. To change a stack entry, edit its `name`, `icon` and `desc` there; no component changes needed.

## Run it locally

```bash
npm install
npm run serve        # http://localhost:8080
npm run build        # production build to dist/
```

The serverless endpoints (`/api/chat`, `/api/visitors`) only run on Vercel or with the Vercel CLI (`vercel dev`). Without them the page still works; the chatbot and visitor counter just stay quiet.

### Environment variables

| Name | Used by |
|---|---|
| `UPSTASH_REDIS_REST_URL` | visitor counter |
| `UPSTASH_REDIS_REST_TOKEN` | visitor counter |

## Deploy

Push to the connected branch and Vercel builds it. Source maps are disabled in `vue.config.js` because they tripled the deploy size.

## Credits

- Logos from [simple-icons](https://github.com/simple-icons/simple-icons) (CC0).
- Contribution data from [github-contributions-api](https://github.com/grubersjoe/github-contributions-api).
- Smooth scrolling by [Lenis](https://github.com/darkroomengineering/lenis).
- The sushi-belt interaction is adapted from a React menu component.

## Contact

GitHub [@detonnn](https://github.com/detonnn) · more links in the site footer.
