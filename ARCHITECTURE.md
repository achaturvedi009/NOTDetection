# System Architecture

This project is structured in a highly modular way to support enterprise scalability. The backend uses Node.js (via Electron's main process), and the frontend is a lightweight HTML/TS UI.

## Directory Structure

\`\`\`
src/
├── main/
│   ├── api/          # Automation REST/WebSocket API endpoints (Future phase)
│   ├── browser/      # Browser Engine Layer handling child process spawning & isolated dirs
│   ├── fingerprint/  # Fingerprint Engine spoofing logic (Canvas, WebGL, Audio)
│   ├── profile/      # Profile Manager for lifecycle & configuration validation
│   ├── proxy/        # Proxy Manager for connection assignment and rotation
│   ├── security/     # Security Layer for payload encryption/decryption (AES-256)
│   ├── storage/      # Storage Layer interfacing with SQLite (Encrypted Database)
│   ├── main.ts       # Electron main process entry
│   └── preload.ts    # Secure IPC bridge between Main and Renderer
└── renderer/         # UI Layer (Dashboard for Profile Management)
\`\`\`

## Module Responsibilities & Data Flow

### 1. Security Layer (\`src/main/security/\`)
- **Responsibility:** Handles symmetric encryption of sensitive data (AES-256-GCM) using a master password.
- **Data Flow:** All data passed into the `StorageLayer` first passes through `EncryptionManager` to ensure zero plain-text data rests on disk.

### 2. Storage Layer (\`src/main/storage/\`)
- **Responsibility:** Manages the SQLite database operations using `sqlite3`.
- **Data Flow:** Receives encrypted payloads from the `ProfileManager` and securely saves them to the `.anti_detect_browser/db/` directory.

### 3. Profile Manager (\`src/main/profile/\`)
- **Responsibility:** Creates and reads profile configurations. Assigns unique UUIDs, proxies, and fingerprint settings.
- **Data Flow:** Accepts API or UI requests via IPC, builds a standard profile object, and forwards it to the Storage Layer.

### 4. Browser Engine Layer (\`src/main/browser/\`)
- **Responsibility:** Spawns sandboxed OS processes. Integrates with the custom Chromium build by passing CLI flags and fingerprint configs.
- **Data Flow:** The `BrowserLauncher` retrieves profile constraints and launches an isolated instance mapping to `.anti_detect_browser/profiles/`.

### 5. UI Layer (\`src/renderer/\`)
- **Responsibility:** Provides the dashboard for operators to visually manage profiles.
- **Data Flow:** Uses `window.electronAPI` (Preload bridge) to request profile creation, deletion, or launching without having direct access to native Node modules.

## Future Extensibility
The modular nature ensures that adding complex Anti-Detect protections (e.g., `Fingerprint Engine` overriding WebGL and WebRTC) can be safely injected via command-line arguments and custom Chromium extensions inside the `Browser Engine Layer`.
