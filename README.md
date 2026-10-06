# Blue Night Homepage

Standalone Vite + React portal for the Blue Night digital experiences. This is an early test version intended for desktop and exhibition-tablet testing.

## Requirements

- Node.js compatible with Vite 8
- pnpm (the repository includes `pnpm-lock.yaml`)

## Local development

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Create a production build with `pnpm build`, then optionally preview it with `pnpm preview`.

## Routes and destinations

- `/` — opening animation and main portal
- `/ar-poster` — AR poster introduction and camera-scanning preview
- NFC — `https://blue-night-one.vercel.app/`
- TICKETS — currently a coming-soon placeholder

The entrance data is in `src/main.jsx` in the `entrances` array. Replace the placeholder `href` for TICKETS when its destination is ready. Vercel is configured to serve the SPA entry point on direct route visits, including `/ar-poster`.

## Opening and standby video

The opening and website standby use `public/blue-night-standby.mp4`. The video is muted for autoplay and retains its original aspect ratio. It plays once as the opening scene and is reused by the website-level standby overlay.

The portal enters standby after 15 seconds without input anywhere in the page. The global activity listeners cover pointer/mouse, touch, scroll/wheel, keyboard, text input, and clicks. The small **STANDBY** masthead control enters the same standby state immediately. Change `IDLE_TIMEOUT_MS` near the top of `src/main.jsx` to adjust the delay.

## AR camera preview

The `/ar-poster` intro requests the rear-facing camera only after **START SCANNING** is pressed. MindAR image tracking recognizes the Guitar poster using the compiled target at `public/ar/guitar.mind`; its video is `public/ar/guitar.mp4`. The original poster target image is `public/ar/guitar.jpg` and is preserved unchanged. The video plane is attached to target 0 and is stopped/hidden when tracking is lost.

Camera access requires HTTPS in deployed environments (`localhost` is permitted for local development). To add another poster later, compile its image into a MindAR target file, add that target and matching video under `public/ar/`, then add a target/video mapping in `PosterRecognitionLayer` in `src/main.jsx`. No environment variables are required.

## GitHub and Vercel

This directory is intended to be its own GitHub repository. When importing it into Vercel, use the Vite framework preset (normally auto-detected), leave **Root Directory** at the repository root, use `pnpm build` as the build command, and `dist` as the output directory. The included `vercel.json` preserves SPA routing on direct visits and refreshes.
