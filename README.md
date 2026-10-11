# Saturn & Rings — Live 3D Simulation → YouTube Stream

Real-time interactive simulation of Saturn and its ring system built with **Three.js**.  
This repo includes a **GitHub Actions workflow** that streams the simulation directly to YouTube using your stream key.

---

## Features

- High-quality procedural Saturn texture with atmospheric bands  
- Multi-layer ring system (C · B · Cassini Division · A) + particle overlay  
- Accurate axial tilt (~26.7°)  
- Starfield background + distant Sun + orbital path  
- Adjustable time scale, orbit toggle, camera controls  
- Fully automated YouTube streaming via GitHub Actions  

---

## 1. Quick local preview

```bash
# just open the file
open index.html

# or serve it (recommended)
npx serve .
# → http://localhost:3000
```

---

## 2. Stream to YouTube with GitHub Actions

### Step A – Add your YouTube Stream Key as a secret

1. Go to **YouTube Studio** → **Go Live** → **Stream**  
2. Copy your **Stream key** (looks like `xxxx-xxxx-xxxx-xxxx-xxxx`)  
3. In your GitHub repository:  
   **Settings → Secrets and variables → Actions → New repository secret**  
   - Name: `YOUTUBE_STREAM_KEY`  
   - Value: paste the stream key  

(Optional) If you use a different ingest server, also create:  
`YOUTUBE_RTMP_URL` = `rtmp://a.rtmp.youtube.com/live2` (default)

### Step B – Start the stream

1. Open the **Actions** tab of your repository  
2. Select **“Stream Saturn to YouTube”** on the left  
3. Click **Run workflow**  
4. Choose:  
   - Duration (minutes) – max ~330 on free runners  
   - Resolution (`1920x1080` recommended)  
   - FPS (`30` recommended)  
5. Click the green **Run workflow** button  

The workflow will:
- Start a virtual display  
- Open the Saturn simulation in Chromium (kiosk / full-screen)  
- Capture the screen with FFmpeg  
- Push the live RTMP stream to YouTube  

You will see the stream appear in YouTube Studio within ~20–40 seconds.

### Important notes

| Topic | Detail |
|-------|--------|
| Free runner limit | GitHub-hosted runners max ~6 hours per job |
| 24/7 streaming | Use a self-hosted runner or a cheap VPS |
| YouTube requirements | Channel must be verified + Live Streaming enabled |
| Audio | Silent (null audio) – add music later in OBS if you want |
| First run | May take 1–2 extra minutes while packages install |

---

## 3. Manual streaming (OBS method)

If you prefer classic OBS:

1. Serve the page: `npx serve .`  
2. In OBS → Add **Browser Source** → URL `http://localhost:3000`  
3. Set width/height to 1920×1080  
4. Start streaming to YouTube with your normal stream key  

---

## Controls (when viewing locally)

| Action            | Input                  |
|-------------------|------------------------|
| Orbit camera      | Left-drag / one-finger |
| Zoom              | Scroll / pinch         |
| Pan               | Right-drag             |
| Toggle orbit path | Button                 |
| Change time scale | Button                 |
| Reset camera      | Button                 |

---

## Tech stack

- Three.js r170 (ES modules + import map)  
- Procedural canvas textures (zero external images)  
- GitHub Actions + Xvfb + Chromium + FFmpeg → YouTube RTMP  

---

## License

MIT — free for personal & commercial use, including live streams.
