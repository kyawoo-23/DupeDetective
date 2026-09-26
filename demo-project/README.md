# UI Components Demo

A self-contained React 18 + Tailwind CSS v4 + Vite demo project built to showcase realistic **AI-generated component drift** — the same component written 2–3 times across different sprints by different developers (or AI sessions) with slight naming, prop, or styling variations.

It is the canonical test fixture for **DupeDetective**.

---

## What's inside

### Original components
| Component | File |
|---|---|
| Sticky navigation bar | `src/components/Navbar.tsx` |
| Button group with toggle | `src/components/ButtonGroup.tsx` |
| Stat / content / action cards | `src/components/Cards.tsx` |
| Form with validation | `src/components/ContactForm.tsx` |
| Sortable + filterable data table | `src/components/DataTable.tsx` |
| Delete-confirmation modal | `src/components/Modal.tsx` |

### Duplicate families (intentional drift)

| Family | Files | How they differ |
|---|---|---|
| **Button** | `Button.tsx` · `ActionButton.tsx` · `SubmitButton.tsx` | `variant` vs `type_` vs hardcoded; `sm/md/lg` vs `small/normal/large` |
| **Card** | `Card.tsx` · `InfoCard.tsx` · `SummaryCard.tsx` | Icon slot added, then trend/stat added — incremental feature creep |
| **Badge / label** | `Badge.tsx` · `StatusPill.tsx` · `Tag.tsx` | `status` vs `color` vs `accent` props; different text transforms |
| **Loader** | `Spinner.tsx` · `LoadingIndicator.tsx` | SVG path vs CSS `border-t` trick |
| **Text input** | `TextInput.tsx` · `FormField.tsx` · `InputField.tsx` | `onChange(string)` vs `onChange(event)` vs spreads `HTMLInputAttributes` |
| **Modal** | `Modal.tsx` · `ConfirmDialog.tsx` · `AlertModal.tsx` | Feature-specific wrappers around the same `<dialog>` pattern |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9+ (bundled with Node)

---

## Getting started

```bash
# 1. Enter the project folder
cd demo-project

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other commands

```bash
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
npm run zip      # Create demo-project.zip in the parent directory
```

---

## Project structure

```text
demo-project/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx          # React entry point
    ├── index.css         # Tailwind v4 + design tokens
    ├── App.tsx           # Root component — renders all sections
    └── components/
        ├── Navbar.tsx
        ├── ButtonGroup.tsx
        ├── Cards.tsx
        ├── ContactForm.tsx
        ├── DataTable.tsx
        ├── Modal.tsx
        │
        ├── Button.tsx          ─┐
        ├── ActionButton.tsx     ├─ Button duplicates
        ├── SubmitButton.tsx    ─┘
        │
        ├── Card.tsx            ─┐
        ├── InfoCard.tsx         ├─ Card duplicates
        ├── SummaryCard.tsx     ─┘
        │
        ├── Badge.tsx           ─┐
        ├── StatusPill.tsx       ├─ Badge/label duplicates
        ├── Tag.tsx             ─┘
        │
        ├── Spinner.tsx         ─┐
        ├── LoadingIndicator.tsx ─┘ Loader duplicates
        │
        ├── TextInput.tsx       ─┐
        ├── FormField.tsx        ├─ Input duplicates
        ├── InputField.tsx      ─┘
        │
        ├── ConfirmDialog.tsx   ─┐
        └── AlertModal.tsx      ─┘ Modal duplicates
```

---

## Zip the project

The easiest way is the npm script — run it from inside `demo-project/`:

```bash
npm run zip
# Creates demo-project.zip one level up, excluding node_modules and dist
```

Or run the raw command manually from the **parent directory**:

```bash
# macOS / Linux
zip -r demo-project.zip demo-project \
  --exclude "demo-project/node_modules/*" \
  --exclude "demo-project/dist/*" \
  --exclude "demo-project/.git/*"
```

```powershell
# Windows (PowerShell 5+) — remove node_modules/dist first, then:
Compress-Archive -Path demo-project -DestinationPath demo-project.zip -Force
# Or with 7-Zip: 7z a demo-project.zip demo-project -x!node_modules -x!dist
```
