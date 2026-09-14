# Dibujá Conmigo

Step-by-step drawing tutorials for kids. An animated SVG guide draws each shape one
stroke at a time while the child draws on a canvas on top of it.

31 tutorials across 5 categories and 3 difficulty levels. Vanilla TypeScript, no
framework. Built with Vite, deployed as a static site.

**Live:** https://dibujaconmigo.lopezguerra.com.ar

---

## Running it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

### Scripts

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Dev server with hot reload         |
| `npm run build`     | Typechecks, then builds to `dist/` |
| `npm run preview`   | Serves the built `dist/` locally   |
| `npm test`          | Runs the Vitest suite              |
| `npm run typecheck` | `tsc --noEmit`, no build           |
| `npm run lint`      | ESLint                             |
| `npm run format`    | Prettier, writes in place          |

`npm run build` runs `tsc --noEmit` first, so a type error fails the build rather
than shipping.

---

## Folder structure

```
index.html              Page shell. All element ids live here.
src/
├── main.ts             Composition root — owns ALL shared state
├── types.ts            Tutorial, Step, CategoryId, DifficultyId
├── config.ts           Colours, stroke widths, timings, limits
├── canvas.ts           Drawing surface: pointer input, undo, PNG export
├── guide.ts            SVG guide rendering + step playback
├── playback-state.ts   Pure playback state machine (unit-tested)
├── gallery.ts          Tutorial card rendering
├── filters.ts          Category/difficulty filtering
├── toolbar.ts          Colour, eraser and brush-size controls
├── toast.ts            Transient messages
└── data/
    ├── categories.ts   Filter chips for categories
    ├── difficulties.ts Filter chips for difficulty
    ├── index.ts        Barrel — concatenates all categories in order
    ├── animales.ts     10 tutorials
    ├── naturaleza.ts    7
    ├── vehiculos.ts     4
    ├── divertidas.ts    6
    └── fantasia.ts      4
styles/
├── index.css           Barrel of @imports
├── tokens.css          CSS custom properties — the design system
├── base.css            Reset, body, header, toast
├── gallery.css         Filter chips and tutorial cards
├── board.css           Canvas, guide SVG, step controls
└── toolbar.css         Colour swatches and tool buttons
```

### How the modules talk to each other

There is **no global store and no pub/sub**. Every module is a factory that takes
its DOM elements plus callbacks and returns a small API. `main.ts` is the only
place that owns mutable shared state (`currentTutId`, `activeCategory`,
`activeDifficulty`) and the only module that knows about all the others.

Modules never import each other. If `canvas.ts` needs the current brush colour, it
receives `getDrawSettings()` as a callback at construction — it does not import
`toolbar.ts`.

Keep it that way. It is what makes each module readable and testable on its own.

---

## Adding a new tutorial

### 1. Pick the file

Tutorials live in the file matching their category:

| Category id  | File                     | Display name        |
| ------------ | ------------------------ | ------------------- |
| `animales`   | `src/data/animales.ts`   | Animales 🐾         |
| `naturaleza` | `src/data/naturaleza.ts` | Naturaleza 🌿       |
| `vehiculos`  | `src/data/vehiculos.ts`  | Vehículos 🚗        |
| `divertidas` | `src/data/divertidas.ts` | Cosas Divertidas 🎁 |
| `fantasia`   | `src/data/fantasia.ts`   | Fantasía ✨         |

Difficulty is one of `facil`, `medio` or `dificil` — shown as 1, 2 or 3 dots on the
card.

> `todos` is a filter-bar sentinel only. It is never a tutorial's category or
> difficulty, and the type system will reject it.

### 2. Write the entry

```ts
{
  id: 'ballena',          // unique across ALL files, lowercase, no spaces
  name: 'Ballena',        // shown on the card
  emoji: '🐳',            // shown next to the name
  category: 'animales',   // MUST match the file it lives in
  difficulty: 'facil',
  steps: [
    { d: 'M300,200 A100,60 0 1,1 100,200 A100,60 0 1,1 300,200' },
    { d: 'M100,200 L50,170 L50,230 Z' },
  ],
},
```

Filing it in the wrong file is a **compile error**, not a silent bug — each file is
typed `as const satisfies readonly Tutorial<'animales'>[]`, so a mismatched
`category` fails `npm run typecheck`.

### 3. Path conventions

Every `d` string is an SVG path in a **`0 0 400 400` viewBox**. Keep drawings
roughly within `50..350` on both axes so nothing touches the edges.

- **One `steps[]` entry = one animation step.** The guide draws them in array
  order, one after another. Think of each step as "one thing the child adds".
- A single step may contain **several subpaths** — just concatenate them in the
  same `d` string (see the cat's whiskers, which are six lines in one step).
- Every `d` **must start with `M`** (moveto). A test enforces this.
- Paths are stroked, never filled. Closing a path with `Z` draws the closing line;
  it does not fill the shape.
- Order steps the way a child would draw: big outline first, details last.

### 4. Run the tests — and expect them to fail

```bash
npm test
```

**Adding a tutorial will break five tests, and that is expected.** Here is why.

`src/data/tutorials.test.ts` is a **migration guard**, not a content guard. It
exists to prove that the 31 tutorials survived the port from the original
single-file prototype byte for byte. It hard-asserts:

- exactly 31 tutorials
- exact per-category counts (10 / 7 / 4 / 6 / 4)
- positional order matching the legacy array
- a SHA-256 per tutorial
- one global SHA-256 over the whole dataset

Those five checks compare against `git show legacy-prototype:index.html` — a
pinned git tag holding the original prototype. **They are about history, not about
correctness of new content.**

When you add tutorial #32, update those assertions deliberately: bump the count,
bump the category count, and regenerate the hashes from the failure output (the
test prints a per-tutorial hash table when it fails). Do not delete the tests —
they still protect the original 31 from accidental edits.

The **structural invariants** in the same file are the permanent guard and should
keep passing without any change:

- ids are unique
- every tutorial has at least one step
- every `d` starts with `M`
- `category` and `difficulty` are valid values
- the viewBox is `0 0 400 400`

If one of those fails, your new entry is genuinely wrong.

### 5. Check it in the browser

```bash
npm run dev
```

Confirm the card appears in its category, the difficulty dots are right, and
pressing **Ver cómo se dibuja** animates your steps in the order you intended.

---

## Deploying

The build is a plain static site — `npm run build` produces `dist/`, which any
static host can serve.

`vite.config.ts` sets `base: './'` so asset paths stay relative. That matters: with
absolute paths the build works at a domain root but breaks on a GitHub Pages
project URL like `usuario.github.io/repo/`. Relative paths work in both.

---

## Conventions

- **Code, comments, docs and commit messages are English.** UI strings shown to the
  child are Spanish.
- Conventional commits, no AI attribution beyond the session trailer.
- Two stroke widths exist on purpose and must not be unified: gallery thumbnails
  use `12`, the guide SVG uses `7` with `opacity 0.55`.
- `touch-action: none` on `.board` and `pointer-events: none` on the guide SVG are
  load-bearing for touch drawing on tablets. A test guards both.
