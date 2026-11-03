# Mnemo — skill notes that stick

Save what you learn, organised by **skill**, in a rich editor with real code and terminal blocks — then revise it with **spaced repetition**, **flashcards** and a progress **dashboard**.

## Features

- **Skills** — one per technology or subject, each with its own colour, icon, mastery score and revision queue.
- **Rich editor** (Tiptap, Quill-style toolbar) — headings, bold/italic/underline/strike, text colour, highlights, sub/superscript, alignment, bullet/numbered/check lists, quotes, links, images (upload, URL or paste a screenshot), tables and dividers. Type `/` for a block menu.
- **Code snippets** — syntax highlighting for 30+ languages, language picker and one-click copy.
- **Terminal command blocks** — Bash, Zsh, PowerShell or CMD, styled like a terminal window with per-line prompts. Comments and `\` continuations are detected, pasted prompts (`$ `, `PS> `) are stripped, and every command has its own copy button.
- **Callouts** — Info, Tip, Remember, Warning, Gotcha, Note.
- **Revision**
  - SM-2 spaced repetition per note and per flashcard (Again / Hard / Good / Easy, with the next interval shown on each button).
  - Sessions for *due*, *all*, *weak spots* or *important* notes, with a recall-first step before the note is shown.
  - **Recall mode** blurs bold text, highlights and code until you click them.
  - **Quick revise** shows every key takeaway in a skill on one page; the **cheat sheet** collects every command and snippet in a skill (copy all, export to Markdown).
- **Dashboard** — due count, streak, today's progress, 53-week activity heatmap, mastery breakdown, per-skill progress, a 14-day review forecast, and trends for 7/30/90 days.
- **AI (optional)** — drafts key takeaways and flashcards from a note using Claude (`claude-opus-5-5`). Only runs when you click *Generate with AI*.
- **Search & command palette** (`Ctrl K`) across titles, tags, takeaways and note content.
- **Safety** — local draft autosave, unsaved-changes warning, JSON backup/restore, Markdown export per note.
- Light/dark/system themes, reduced-motion setting, responsive layout.

## Getting started

Requires Node.js 20.9+ and a MongoDB database (Atlas works).

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:3000
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `MONGODB_DB` | no | Database name (overrides the one in the URI) |
| `ANTHROPIC_API_KEY` | no | Enables AI takeaways and flashcards |

If your network refuses `mongodb+srv` DNS lookups (`querySrv ECONNREFUSED`, common on Windows), the app automatically retries through public DNS.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (includes type-checking) |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript only |

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl K` | Search & commands |
| `N` / `R` | New note / start revising |
| `Ctrl S` | Save note (in the editor) |
| `/` | Block menu (in the editor) |
| `Ctrl Alt C` / `Ctrl Alt T` | Code block / terminal block |
| `Space` | Reveal note or flip flashcard |
| `1`–`4` | Rate Again / Hard / Good / Easy |
| `E` | Edit the open note |
| `?` | All shortcuts |

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Tiptap 3 · MongoDB/Mongoose 9 · SWR · Motion · Recharts · Radix UI · Anthropic SDK.

```
app/            routes (pages + /api route handlers)
components/     UI: editor, reader, charts, views, shell
lib/            shared logic (spaced repetition, dates, document utils)
lib/server/     database models, validation, API helpers, AI
```
