# SD - The Day Sync Protocol 🚀🔥

A high-octane, side-scrolling 2D tactical shooter featuring a fully-modular **Phaser 3** game engine, **React** overlays, **Zustand** state synchronization, and a robust real-time multiplayer PvP system powered by **Node.js, Express, and Socket.io**.

Engage in intense tactical battles with custom-assembled avatars, complex ballistics, reactive physics-driven grenades, and an advanced AI battle companion—all unified under a gorgeous, custom "molten-fire" cyberpunk visual interface!

---

## 💎 Key Features & Architecture

### 🕹️ Dual Gameplay Isolation (Solo vs. PvP)
*   **Zero Logic Contamination**: The application maintains a strict structural barrier between the solo campaign and multiplayer PvP modes.
    *   **Solo Mode**: Features scripted character intros, progressive campaign levels, custom destructible objects, and your AI follow-companion (Sarge) providing responsive tactical cover.
    *   **PvP Mode**: Completely disables Sarge, story intros, and level-specific logic, switching instead to a dedicated socket network listener room.
*   This absolute isolation guarantees that updates to the PvP state sync, dead reckoning, and lag compensation can never break the offline solo campaign mechanics or vice versa.

### ⚡ Low-Latency PvP Synchronization
We implemented a professional network synchronization pipeline inside the multiplayer engine to deliver an incredibly smooth, fluid competitive experience:
*   **Dead Reckoning & Vector Extrapolation**: Resolves network lag by dynamically extrapolating opponent positions using velocity vectors when position updates are in transit, eliminating stuttering and teleportation.
*   **High-Range Projectile Visibility & Anti-Culling**: Fired bullets and launcher rockets have custom extended lifetimes (up to 5 seconds) to allow cross-map travel. Remote sniper shots calculate real aim angles and project raycasts up to 16,000 pixels (clipping perfectly with walls and local players), eliminating the "invisible wall" visual truncation at viewport edges.
*   **Timestamped Death Sequence Locking**: Employs timestamp verification on `'death'` packets to instantly ignore out-of-order pre-death motion packets, completely resolving vertical avatar body shaking during death scatter animations on opponent screens.
*   **Spawn-Point Coordinate Snapping**: Players instantly snap to spawn coordinates upon transitioning from dead to alive, completely stopping slide-through-wall visual bugs.
*   **Math-Driven Match Timer Overlay**: The gameplay timer is locked in world space and dynamically counter-scales by `1 / camera.zoom` while adjusting its Y-position on every frame. It remains pixel-perfect at the top-middle of the screen, completely unaffected by camera zoom levels or camera scrolling!

### 🎨 Molten-Fire Cyberpunk Theme Refinement
*   **Aesthetic Branding**: Styled with a massive, italicized gradient text title **`SD`** paired with wide letter-spaced **`THE DAY SYNC PROTOCOL`** tags.
*   **Dark-Mode Glassmorphism**: Stripped away boxy rigid borders and solid panels for transparent floating glass cards with rich black-glow drop shadows.
*   **Unified Accents**: Features crimson-to-orange gradient buttons, warm amber form-focus rings, and active text highlights.
*   **Responsive Lobby Y-Offsets**: Button containers and match time selectors are compacted and shifted to safe vertical margins, ensuring they fit beautifully and remain 100% clickable at any screen aspect ratio.

---

## 🛠️ Monorepo Directory Layout

The project is organized as a unified fullstack monorepo for effortless deployment:
```
SD-DAY-SYNC PROTOCOL/
├── package.json         # Root orchestrator (scripts to install, build, & run both tiers)
├── README.md            # You are here!
├── backend/             # Express, JWT Auth, Socket.io, & MongoDB API Server
│   ├── server.js         # Backend entry point
│   └── package.json     # Backend dependencies
└── frontend/            # React UI, Tailwind CSS, & Phaser 3 Game Engine
    ├── src/             # Frontend source code
    │   ├── game/        # Game engine, PvP, and Solo Scenes
    │   └── components/  # React login and HUD overlays
    ├── package.json     # Frontend dependencies
    └── vite.config.js   # Vite compilation configurations
```

---

## 📦 Production Deployment Guide (Render)

This repository is optimized out-of-the-box for two different seamless deployment paths on **Render** (or any monorepo-compatible host):

### 🌟 Path A: Deploy as a Single Unified Web Service (Highly Recommended!)
You can host both the frontend and backend in a **single Render Web Service project**! The Node Express server is fully configured to compile the React frontend into static assets and serve them directly on the same port, completely eliminating CORS issues and saving you server instances!

*   **Service Type**: `Web Service`
*   **Environment**: `Node`
*   **Build Command**: `npm run build` *(Installs backend/frontend, builds React static files into frontend/dist)*
*   **Start Command**: `npm start` *(Starts the Express Node server at backend/server.js)*
*   **Environment Variables**:
    *   `PORT` (defaults to `5000` or automatically injected by Render)
    *   `MONGO_URI` (your MongoDB Atlas connection string)
    *   `JWT_SECRET` (your secure authentication signing key)

---

### Path B: Deploy as Two Separate Services (Dual-Project)
If you prefer to separate the static hosting from your backend API:

#### 1. Backend Web Service
*   **Service Type**: `Web Service`
*   **Environment**: `Node`
*   **Build Command**: `npm run build:backend`
*   **Start Command**: `npm start`
*   **Environment Variables**:
    *   `PORT` (defaults to `5000`)
    *   `MONGO_URI` (your MongoDB Atlas connection string)
    *   `JWT_SECRET` (your secure key)

#### 2. Frontend Static Site
*   **Service Type**: `Static Site`
*   **Build Command**: `npm run build:frontend`
*   **Publish Directory**: `frontend/dist`
*   **Environment Variables**:
    *   `VITE_API_URL` (points to your deployed Backend Web Service URL, e.g., `https://sd-backend.onrender.com`)

---

## 🚀 Local Installation & Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [MongoDB](https://www.mongodb.com/) (running locally or via MongoDB Atlas)

### Step 1: Install Dependencies
Run the unified monorepo install script in the **root directory**:
```bash
npm run install:all
```
*This will automatically install dependencies in both the `/backend` and `/frontend` folders!*

### Step 2: Configure Environment Variables
1. Create a `.env` file in the **`/backend`** folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/sd_combat
   JWT_SECRET=super_secret_combat_token_key_101
   ```

### Step 3: Run the Application Locally
Launch both the backend server and the frontend Vite server concurrently with a single command in the **root directory**:
```bash
npm run dev
```
*   **Frontend**: accessible at `http://localhost:5173`
*   **Backend Server & WebSockets**: running on `http://localhost:5000`

---

## 🎮 Game Controls & Gameplay Guide

*   **WASD**: Character Movement (A/D to run, W/Space to activate jetpack propulsion).
*   **S**: Crouching (reduces character bounding box for cover).
*   **Mouse Move**: Muzzle Aiming.
*   **Left Click**: Shoot Weapon.
*   **R**: Reload current weapon.
*   **1 / 2**: Quick-switch between primary and secondary weapon slots.
*   **G**: Throw Grenade (inherits your character's forward momentum).
*   **Z**: Cycle Zoom Levels (dynamic camera adjustment).

---

## 🛡️ License & Copyright
© 2026 Sagar Dey. All rights reserved. Registered under secure protocol authentication.
