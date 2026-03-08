import { FingerprintConfig } from '../profile/models';

export class ConsistencyValidator {
    /**
     * Rules Engine: Validates that a generated fingerprint does not contain impossible combinations.
     * Throws an error or automatically corrects invalid parameters.
     */
    public static validateFingerprint(config: FingerprintConfig): boolean {
        let valid = true;

        // Rule 1: OS matches platform
        if (config.hardware.os === 'Windows NT 10.0' && config.hardware.platform !== 'Win32') {
            console.warn('[Consistency Engine] OS/Platform mismatch detected (Windows).');
            config.hardware.platform = 'Win32';
        }
        if (config.hardware.os.includes('Mac OS') && config.hardware.platform !== 'MacIntel') {
            console.warn('[Consistency Engine] OS/Platform mismatch detected (macOS).');
            config.hardware.platform = 'MacIntel';
        }

        // Rule 2: WebGL Vendor must logically match renderer
        const unmaskedRenderer = config.webgl.unmaskedRenderer.toLowerCase();
        if (unmaskedRenderer.includes('nvidia') && !config.webgl.unmaskedVendor.toLowerCase().includes('nvidia')) {
            console.warn('[Consistency Engine] WebGL Vendor/Renderer mismatch detected (NVIDIA).');
            config.webgl.unmaskedVendor = 'NVIDIA Corporation';
        }
        if (unmaskedRenderer.includes('apple') && !config.webgl.unmaskedVendor.toLowerCase().includes('apple')) {
            console.warn('[Consistency Engine] WebGL Vendor/Renderer mismatch detected (Apple).');
            config.webgl.unmaskedVendor = 'Apple';
        }

        // Rule 3: Memory logically supports the screen resolution and cores
        if (config.screen.width > 2560 && config.hardware.deviceMemory < 8) {
            console.warn('[Consistency Engine] 4K screen with <8GB RAM is highly anomalous. Correcting RAM.');
            config.hardware.deviceMemory = 16;
        }

        // Rule 4: Browser version exists for OS in User-Agent
        if (config.hardware.os === 'Windows NT 10.0' && !config.userAgent.includes('Windows NT 10.0')) {
            console.warn('[Consistency Engine] User Agent OS signature does not match hardware OS.');
            valid = false;
        }

        return valid;
    }

    /**
     * Entropy Scoring System: Estimates how common or rare a fingerprint is compared to real-world devices.
     * Scale 0.0 (Extremely Rare/Anomalous) to 1.0 (Very Common).
     */
    public static calculateEntropyScore(config: FingerprintConfig): number {
        let score = 1.0;

        // Rare Core/Memory Combos
        if (config.hardware.hardwareConcurrency === 12 && config.hardware.deviceMemory === 8) {
            score -= 0.3; // 12-core systems usually have 16GB+ RAM
        }

        // Uncommon Resolutions
        if (config.screen.width === 1366 && config.screen.height === 768 && config.hardware.deviceMemory > 8) {
            score -= 0.2; // 1366x768 usually belongs to budget laptops (<=8GB RAM)
        }

        // Mac Resolutions
        if (config.hardware.platform === 'MacIntel' && config.screen.pixelRatio === 1) {
            score -= 0.5; // Almost all modern Macs are Retina (pixelRatio 2)
        }

        return Math.max(0, Math.min(score, 1.0)); // Clamp between 0 and 1
    }
}
