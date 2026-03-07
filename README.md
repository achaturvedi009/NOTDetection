# Advanced Anti-Detect Browser

Enterprise-grade anti-detect browser platform with advanced fingerprint spoofing, identity isolation, proxy integration, and automation APIs.

## Architecture

This application uses a modular architecture built on Electron and Node.js. It features a scalable foundation designed to support custom Chromium engine integrations.

For a detailed breakdown of the system architecture, module responsibilities, and data flows, please see [ARCHITECTURE.md](ARCHITECTURE.md).

## Quick Start

### Installation

\`\`\`bash
npm install
\`\`\`

### Build & Run

\`\`\`bash
# Compile TypeScript files
npm run build

# Start the application
npm start
\`\`\`

## Current Phase

Phase 1 Foundation:
- Electron boilerplate setup.
- SQLite + AES-256 Encryption Storage Layer.
- Profile Manager (creation, assignment, isolation).
- Base UI Dashboard.
