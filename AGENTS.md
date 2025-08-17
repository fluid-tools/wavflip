# Agent Guidelines for WAVFLIP

## Build/Lint/Test Commands
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm start` - Start production server
- No test framework configured - verify changes manually
- **IMPORTANT**: Always typecheck after iterations to avoid broken edits

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, use proper types
- **Imports**: Use `@/` path alias for internal imports, group external imports first
- **Components**: Use React function components with TypeScript interfaces
- **Styling**: Tailwind CSS v4 with `cn()` utility from `@/lib/utils` for conditional classes
- **UI Components**: Follow shadcn/ui patterns with Radix UI primitives - DO NOT edit `/components/ui` directly
- **Design**: Clean Apple Music/Spotify-like UI, rounded corners, no layout shift, use flex/grid
- **Fonts**: Geist and Geist Mono with tight spacing preferred
- **Naming**: PascalCase for components, camelCase for functions/variables
- **State**: Use Jotai for state management, React Query for server state
- **Error Handling**: Use proper TypeScript error types, handle async operations
- **File Structure**: Components in `/components`, utilities in `/lib`, app routes in `/app`
- **Exports**: Use named exports for utilities, default exports for pages/components

## Key Dependencies & Requirements
- **Core**: Next.js 15 (App Router, SSR, RSC), React 19, TypeScript, Tailwind CSS v4
- **UI**: shadcn/ui, Radix UI, Lucide icons, @dnd-kit for drag & drop
- **Audio**: Tone.js (manipulation), WaveSurfer.js (waveform player) - CRUCIAL for audio features
- **AI**: ElevenLabs API for sound generation, Vercel AI SDK
- **State**: Jotai, TanStack Query
- **Storage**: Vercel Blob for cloud storage, SQLite + Drizzle ORM for local-first data
- **Auth**: Better Auth for authentication

## important

never ever modify the `/components/ui` directory. it's for shadcn/ui components.

## Cursor rules (apply intelligently)

- Architecture & state: `.cursor/rules/architecture-state.mdc`
- Data Access Layer (DAL): `.cursor/rules/data-access-layer.mdc`
- API contracts + Zod: `.cursor/rules/api-contracts-zod.mdc`
- React Query mutations: `.cursor/rules/react-query-mutations.mdc`
- Waveform data patterns: `.cursor/rules/waveform-data.mdc`

These encode our preferred patterns: next-safe-action for mutations with Zod schemas, React Query for reads, DAL isolation, and runtime validation on both server and client.

## External references

- Next.js Data Security (Data Access Layer): [link](https://nextjs.org/docs/app/guides/data-security#data-access-layer)
- next-safe-action docs: [link](http://next-safe-action.dev/)
- Zod docs: [link](https://zod.dev/)

## WaveSurfer docs (local)

- Start here: [`local-docs/wavesurfer-docs/wavesurfer.xyz_docs_.md`](local-docs/wavesurfer-docs/wavesurfer.xyz_docs_.md)
- See also class-specific references under `local-docs/wavesurfer-docs/` for plugins and options.
- use https://wavesurfer.xyz/docs/ for reference when in doubt for latest online docs from web.