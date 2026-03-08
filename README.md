# Advanced Enterprise Anti-Detect Browser

An enterprise-grade, highly scalable anti-detect browser platform built with Electron, Node.js, and TypeScript. This system orchestrates deeply customized, isolated Chromium profiles that are indistinguishable from real human users on genuine devices. It manages fingerprints, network leaks, behavioral interaction physics, and distributed cluster scaling without relying on any external cloud infrastructure.

## 🚀 Key Features

This platform was developed across 12 rigorous architectural phases, resulting in the following enterprise capabilities:

### 1. Cryptographic Storage & Isolation
- **Encrypted Local Vaults:** Uses `sqlite3` backed by `AES-256-GCM` encryption. A local master key securely encrypts all profile footprints, proxies, and behavioral metrics natively on-disk.
- **Network Partitioning:** Isolated `--user-data-dir` constraints per-profile ensure cookies, caches, IndexedDB, and active network connections are strictly segregated.

### 2. Fingerprint Consistency Engine
- **Deterministic Generation:** Device identities are generated using a 16-byte cryptographic seed applied against real-world OS/Hardware templates (e.g., `macOS + Apple Silicon`, `Windows + NVIDIA`).
- **Runtime Injection:** Overrides `CanvasRenderingContext2D`, `WebGLRenderingContext`, and `Navigator` APIs with sub-pixel noise and non-destructive masking *before* target websites execute.

### 3. Network Identity Engine
- **Transport Layer Spoofing:** Compiles custom Chromium CLI flags to enforce TLS/JA3 curve alignments, HTTP/2 SETTINGS frame ordering, and QUIC protocol logic.
- **Leak Protection:** Forces strictly routed WebRTC candidates via proxies and mandates isolated DNS-over-HTTPS (DoH).

### 4. Behavioral Identity Engine
- **Humanized Physics:** Wraps Puppeteer automation in physical models: Bézier curve mouse trajectories, micro-jitter, randomized scroll inertia, and variable keyboard cadences containing burst-typing and realistic typos.

### 5. Mobile Device Simulation Engine
- **Deep Mobile Spoofing:** Dynamically overrides `maxTouchPoints`, applies native CDP viewport metrics for smartphones (e.g., iPhone 14 Pro, Pixel 8), throttles bandwidth to simulate 4G/5G, and continuously emits sub-pixel `deviceorientation`/`devicemotion` events to simulate a handheld device.

### 6. Stealth & Anti-Detection Hardening
- **WebDriver Evasion:** Automatically scrubs `window.cdc_` variables, removes `navigator.webdriver`, and mocks realistic Plugin and MimeType arrays to avoid headless heuristic checks.
- **Timing Normalization:** Induces deterministic micro-drift in `performance.now()` to defeat execution-speed profiling.

### 7. Distributed Scaling Architecture
- **Cluster Orchestration:** Run the system in `control` mode (master WebSocket server) or `worker` mode. The Control Node load-balances JSON automation workflows across idle hardware based on active memory usage and concurrency caps.

### 8. Lifecycle & Self-Healing Intelligence
- **Profile Aging:** Profiles transition from `new` to `mature`, accumulating realistic cookies and cache sizes over time. Active profiles dynamically "evolve" their minor browser versions natively.
- **Self-Healing:** Continuously monitors for HTTP 403s, JS anomalies, and CAPTCHAs. At critical threat thresholds, the system auto-rebalances fingerprint noise seeds and forces proxy rotations.

### 9. Analytics & Governance
- **IAM & RBAC:** Role-based access control (`system_admin`, `automation_operator`, etc.) backed by scrypt-hashed credentials.
- **Enterprise Policy Engine:** Enforces system-wide constraints on OS generation and allowed proxy types.
- **Telemetry Dashboard:** Live UI streaming OS distributions, proxy health latency via native ICMP, and real-time threat landscapes.

---

## 🛠 Technology Stack

- **Node.js & Electron:** Provides the core runtime, desktop window management, and deep system access (file system, child processes).
- **TypeScript:** Enforces strict typings across the 12 complex identity layers.
- **Puppeteer-Core:** Facilitates the Chrome DevTools Protocol (CDP) connection to drive automation, emulate network conditions, and inject JS payloads.
- **SQLite3 (WAL Mode):** High-throughput, concurrent database management for profiles, analytics, and governance telemetry.
- **esbuild:** Bundles the frontend React-less UI rapidly into a pure browser-compatible format.
- **Crypto:** Native Node `crypto` library powers all AES-GCM data-at-rest encryption and HMAC-SHA256 inter-node communications.

---

## 💻 How It Works

When a profile is launched, the following strict sequence occurs:
1. **Boot:** The `LocalResourceManager` checks RAM and concurrency limits.
2. **Template Matching:** The `ProfileManager` pulls the deterministic 16-byte seed and maps it to a hardware template (e.g., Mac M2).
3. **Network Configuration:** The `NetworkIdentityEngine` applies proxy strings and strict `--disable-webrtc-hw-decoding` flags.
4. **Browser Launch:** A sandboxed `puppeteer-core` session boots.
5. **Stealth Injection:** The `StealthHardeningEngine` and `FingerprintInjector` compile massive JS payloads mocking WebGL, Canvas, Battery, and Timing APIs, deployed natively via CDP `evaluateOnNewDocument`.
6. **Automation Handoff:** The session is wrapped in a `BrowserSessionController` containing the `HumanInteractionController`, meaning any requested `.click()` or `.type()` automatically executes using the physical behavioral engines.

---

## 🚀 Installation & Usage

### Prerequisites
- Node.js (v18 or higher)
- NPM

### Setup
\`\`\`bash
# 1. Install Dependencies
npm install

# 2. Build the Application (Compiles TS and bundles the UI)
npm run build
\`\`\`

### Running the Platform

The platform relies on the `NODE_MODE` environment variable to determine its role:

**Local Enterprise Mode (Default UI):**
Runs the database, UI, and orchestration all on the host machine securely offline.
\`\`\`bash
npm start
# Or explicitly:
NODE_MODE=local npm start
\`\`\`

**Distributed Control Node (Master):**
Runs the WebSocket orchestrator waiting for workers to connect.
\`\`\`bash
NODE_MODE=control npm start
\`\`\`

**Distributed Worker Node:**
Runs headless, connects to the master, and executes payloads natively.
\`\`\`bash
NODE_MODE=worker CONTROL_NODE_URL=ws://127.0.0.1:5543/cluster/v1/ws npm start
\`\`\`

---

## 📦 How to Build Executable Files (Windows, macOS, Linux)

To distribute this application to your team, we use `electron-builder`. This bundles Chromium, Node.js, and your compiled code into a single native executable.

### Step 1: Install Electron Builder
\`\`\`bash
npm install electron-builder --save-dev
\`\`\`

### Step 2: Add Build Scripts to `package.json`
Update your `package.json` to include the build targets:
\`\`\`json
{
  "scripts": {
    "build": "npm run build:main && npm run build:renderer && mkdir -p dist/renderer && cp src/renderer/index.html dist/renderer/index.html",
    "build:main": "npx tsc",
    "build:renderer": "npx esbuild src/renderer/renderer.ts --bundle --outfile=dist/renderer/renderer.bundle.js",
    "start": "electron .",
    "pack": "electron-builder --dir",
    "dist:win": "electron-builder --win portable",
    "dist:mac": "electron-builder --mac dmg",
    "dist:linux": "electron-builder --linux AppImage"
  },
  "build": {
    "appId": "com.enterprise.antidetect",
    "productName": "Enterprise Stealth Browser",
    "directories": {
      "output": "release/"
    },
    "win": {
      "target": "portable"
    },
    "mac": {
      "target": "dmg",
      "hardenedRuntime": true
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
\`\`\`

### Step 3: Generate the Executables

**For Windows (`.exe`):**
*Must be run on a Windows machine (or via Wine on Linux).*
\`\`\`bash
npm run build
npm run dist:win
\`\`\`
*Result:* A `.exe` file will be generated in the `release/` folder. The `portable` target means it can be run directly from a USB stick without requiring administrator installation.

**For macOS (`.dmg`):**
*Must be run on a macOS machine.*
\`\`\`bash
npm run build
npm run dist:mac
\`\`\`
*Result:* A mountable `.dmg` file will be generated in the `release/` folder containing the `.app` bundle.

**For Linux (`.AppImage`):**
*Must be run on a Linux machine.*
\`\`\`bash
npm run build
npm run dist:linux
\`\`\`
*Result:* An `.AppImage` file will be generated in the `release/` folder. You can mark it executable (`chmod +x`) and run it immediately on almost any modern Linux distribution.

---

*Note: In production deployments, ensure the `ANTI_DETECT_MASTER_KEY` environment variable is securely provisioned on host machines to guarantee vault integrity.*
