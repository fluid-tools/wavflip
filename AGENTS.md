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