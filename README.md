# Saturn & Rings — Live 3D Simulation

Real-time cinematic simulation of Saturn and its ring system.  
Built with the same solid architecture as the working Starlink 3D project (local Three.js, no CDN).

## Quick start (local)

```bash
# From this folder:
npx serve .
# or
python -m http.server 8080
```

Open the URL shown (http://localhost:3000 or :8080).  
You should see Saturn + rings + stars with a moving cinematic camera.

**Do not open index.html by double-clicking** — that often causes WebGL / module errors.

## Features

- Procedural Saturn texture with atmospheric bands
- Multi-layer rings (C · B · Cassini Division · A) + particle layer
- Correct 26.7° axial tilt
- Cinematic camera director (5 automatic shots that cycle)
- Clean live HUD
- Local vendored Three.js (works offline / in restricted environments)

## Streaming to YouTube

### Best quality – OBS Browser Source (recommended)

1. Run `npx serve .`
2. In OBS → Add **Browser Source**
3. URL = `http://localhost:3000`
4. Size = 1920 × 1080
5. Start streaming to YouTube with your normal key

### Automated – GitHub Actions

1. Push this repo to GitHub
2. Add secret `YOUTUBE_STREAM_KEY` (from YouTube Studio → Go Live)
3. Actions → **Stream Saturn Live to YouTube** → Run workflow
4. Choose duration / resolution / FPS

Free runners max ~6 hours. For longer streams use a self-hosted runner or VPS.

## Controls / URL params

| Param     | Example          | Effect                |
|-----------|------------------|-----------------------|
| `?q=low`  | lower quality    | fewer polygons        |
| `?speed=2`| 2× simulation    | faster rotation       |

Camera is fully automatic (cinematic shots). No mouse controls needed for streaming.

## Tech

- Three.js (vendored locally – same as the working Starlink project)
- Procedural canvas textures
- Cinematic camera director
- GitHub Actions + Xvfb + Chromium + FFmpeg → YouTube RTMP

## License

MIT
