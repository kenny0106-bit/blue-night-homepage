# Blue Night Homepage

Blue Night’s main digital portal, with the AR POSTER experience, the external THE SOUND site, and the interactive TICKET artwork exhibition. This repository is the standalone React/Vite project; the existing THE SOUND/NFC site remains a separate project.

## Local setup

Requirements: Node.js compatible with Vite 8 and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Run `pnpm build` for a production build or `pnpm preview` to serve the built site locally. There are no required environment variables.

## Pages and destinations

- `/` — Blue Night opening scene, main portal, and website standby mode.
- `/ar-poster` — AR poster introduction and live camera scanner.
- `/ticket` — four-edition ticket artwork exhibition with full-ticket 3D flip and tear/reassemble interactions. Ticket reservations are intentionally unavailable placeholders.
- THE SOUND — external link to [blue-night-one.vercel.app](https://blue-night-one.vercel.app/); its source project is not part of this repository.

Vercel’s `vercel.json` rewrites direct route visits and refreshes to the SPA entry point. For implementation details, assets, project status, and handoff notes, see [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md).

## AR poster assets

The scanner requests the rear camera only after the visitor chooses **START SCANNING**. The MindAR database is `public/ar/blue-night-posters.mind`; its target order must match `posterTargets` in `src/main.jsx`: Guitar, Microphone, French Horn. Poster target images are in `public/ar/poster-targets/`, and the matching videos are in `public/ar/poster-videos/`.

One or two tracked poster videos use their original audio and play once; when all three targets are tracked, the videos loop muted and the Little Jazz secret-track experience can play. Browser audio policies may require a user gesture. Camera access requires HTTPS after deployment (`localhost` is suitable for local development).

## Deploying

The project uses the existing `kenny0106-bit/blue-night-homepage` repository and Vercel project. Use the repository root as Vercel’s Root Directory, `pnpm build` as the build command, and `dist` as the output directory. Pushing to `main` should trigger the connected production deployment. The project does not need environment variables.
