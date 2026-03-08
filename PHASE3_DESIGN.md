# Phase 3: Network Identity & Automation Architecture Design

## Overview
Phase 3 establishes the foundation for the Network Identity Layer and outlines advanced automation and mobile emulation paths for Phase 4.

## 1. Network Identity Layer (`src/main/network/`)
The network identity layer is responsible for ensuring the traffic leaving the browser instance consistently matches the expected identity of the simulated device.

### WebRTC Leak Protection
- **Mechanism:** WebRTC configuration must prevent real IP exposure via STUN/TURN servers.
- **Implementation Strategy:** Provide three modes: `disable`, `fake_ip`, and `proxy_routed`.
- **Hooks:** Via Chromium CLI flags (`--enforce-webrtc-ip-permission-check`) and CDP injection to override `RTCPeerConnection.prototype.createOffer`.

### DNS Leak Prevention & DNS-over-HTTPS (DoH)
- **Mechanism:** All DNS resolution must bypass the host OS and route through secure, proxy-aligned resolvers.
- **Implementation Strategy:** Configure Chromium via `--host-resolver-rules` and force DoH via `--enable-features=dns-over-https`.

### TLS and JA3 Fingerprinting
- **Mechanism:** The TLS handshake structure must match the `userAgent` (e.g., simulating Firefox TLS curves when navigating as Firefox, even if using a Chromium engine).
- **Implementation Strategy:** In JS/Puppeteer, we will configure the proxy interceptor layer to rewrite TLS Client Hello packets. (Note: True low-level manipulation will ultimately require the custom C++ Chromium network stack build, but Node-based proxying will serve as our orchestrator).

### Advanced Proxy Routing
- **Mechanism:** Secure proxy tunnels per-profile.
- **Implementation Strategy:** Create an internal proxy service that forwards authenticated `SOCKS5` or `HTTP` traffic per isolated process.

## 2. Advanced Automation API (`src/main/api/`)
- **Mechanism:** Expose REST or WebSocket endpoints allowing external scripts (Puppeteer, Playwright, Selenium) to orchestrate profiles programmatically.
- **Implementation Strategy:** Run a local Express/Fastify server attached to the Electron main process, exposing endpoints like `POST /api/v1/profiles` and `POST /api/v1/profiles/:id/start`.

## 3. Mobile Device Emulation
- **Mechanism:** Spoof mobile behaviors beyond just the User Agent.
- **Implementation Strategy:** Leverage CDP to enable `page.emulate()` features:
  - Touch event support (`hasTouch: true`).
  - Mobile viewport constraints.
  - Sensor mocking (Gyroscope, Accelerometer).
