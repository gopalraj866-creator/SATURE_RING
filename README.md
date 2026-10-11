# Saturn & Rings — Live 3D Simulation → YouTube Stream

Real-time interactive simulation of Saturn and its ring system built with **Three.js**.  
Includes a **GitHub Actions workflow** that streams the simulation directly to YouTube using your stream key.

---

## IMPORTANT – How to run correctly

**Do NOT just double-click `index.html`.**  
Browsers block ES modules when opened as `file://`, so you will see a black screen.

### Correct way (local preview)

```bash
# From the project folder:
npx serve .
# or
python -m http.server 8080
```

Then open the URL it shows (usually http://localhost:3000 or http://localhost:8080).

You should see Saturn + rings + stars immediately.

---

## Features

- Procedural Saturn texture with atmospheric bands
- Multi-layer rings (C · B · Cassini · A) + particle overlay
- Correct axial tilt (26.7°)
- Starfield + distant Sun + orbital path
- Time-scale control, orbit toggle, camera reset
- Automated YouTube streaming via GitHub Actions

---

## Stream to YouTube with GitHub Actions

### 1. Add your Stream Key

1. YouTube Studio → **Go Live** → copy **Stream key**
2. GitHub repo → **Settings → Secrets and variables → Actions**
3. New secret:
   - Name: `YOUTUBE_STREAM_KEY`
   - Value: paste the key

### 2. Start the stream

1. Go to **Actions** tab
2. Select **“Stream Saturn to YouTube”**
3. Click **Run workflow**
4. Choose duration / resolution / FPS
5. Run

The workflow opens the simulation in headless Chromium and pushes it to YouTube via RTMP.

> Free GitHub runners have a ~6 hour limit.  
> For longer streams use a self-hosted runner or VPS.

---

## Manual streaming with OBS (recommended for quality)

1. Serve the page: `npx serve .`
2. In OBS → Add **Browser Source**
3. URL: `http://localhost:3000` (or whatever port)
4. Width × Height: 1920 × 1080
5. Start streaming to YouTube normally

This usually gives better quality and stability than the GitHub Action method.

---

## Controls

| Action            | Input                  |
|-------------------|------------------------|
| Orbit camera      | Left-drag              |
| Zoom              | Scroll                 |
| Pan               | Right-drag             |
| Toggle orbit path | Button                 |
| Change time scale | Button                 |
| Reset camera      | Button                 |

---

## Tech

- Three.js r170 (ES modules)
- Procedural canvas textures (no external images)
- GitHub Actions + Xvfb + Chromium + FFmpeg → YouTube

---

## License

MIT — free for personal & commercial use including live streams.
