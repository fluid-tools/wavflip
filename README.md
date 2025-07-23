Objective: An app for producers to create soundpacks easily via ElevenLabs API.

UI:

- imagine a clean clean apple music/spotify ui just for user’s own experimentation studio.
- cute pill dynamic navbar
- rounded corners preferred
- no layout shift in design
- use flex/grid where possible
- clean legible design
- fonts: geist mono and geist (tight spacing preferred) - https://vercel.com/font
- TailwindCSS v4
    - https://tailwindcss.com/docs/upgrade-guide
    - https://tailwindcss.com/blog/tailwindcss-v4
- shadcn ui - https://ui.shadcn.com/docs/components
    - https://ui.shadcn.com/docs/installation/next
    - https://ui.shadcn.com/docs/dark-mode/next
- dnd kit for drag and drop functionality - https://github.com/clauderic/dnd-kit
- wavesurfer.js (crucial) - [wavesurfer.xyz](http://wavesurfer.xyz) - used for waveform player (generated sounds can be loaded and played and manipulated in conjunction with tonejs). this can be used to preview multiple tracks like in logic pro (but imagine a minimal web ui)
    - allow users to upload their own tracks
    - documentation is also added inside the working directory.
- tonejs (for audio manipulation, transpose, other effects etc.) - https://tonejs.github.io/

Tech Stack

- next.js 15 (latest) (App Router, SSR, RSC) - (https://nextjs.org/docs)
- Better Auth: https://www.better-auth.com/llms.txt
- elevenlabs for sound generation - https://elevenlabs.io/docs/llms.txt
    - ELEVENLABS_API_KEY
- vercel blob for cloud storage - https://vercel.com/docs/vercel-blob

Make a plan to implement this app in steps and keep track of your checkpoints and what you’ve learned, mistakes to avoid, etc.

Plan before implementing.

a full-rounded mvp with a responsive (theme and size responsive) should be completed at the end of our implementation of Phase 1.

### Phase 2

- sqlite db (local file)
    - drizzle orm + drizzle-kit
- storage (local-first offline first)


## important

- use firecrawl for scraping and fetching data from the web. the mcp server is running locally already.
- read all the documentation for the tech stack and the libraries.
- strict requirements:
    - use next.js 15 (App Router, SSR, RSC)
    - use tailwindcss v4
    - use shadcn ui
    - use dnd kit
    - use wavesurfer.js
    - use tonejs
    - use sqlite db
    - use drizzle orm + drizzle-kit


### backend

- next.js api routes & server actions (nodejs)
- hono server (optional, for advanced routing/middleware) - https://hono.dev/llms.txt

## development note
- typecheck after iterations to make sure you dont apply broken edits.
- components/ui contains shadcn components and should not be directly edited.