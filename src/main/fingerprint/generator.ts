import { FingerprintConfig } from '../profile/models';

export class FingerprintGenerator {

    /**
     * Generates a fully randomized, yet internally consistent device fingerprint.
     * In an enterprise setup, this would load templates from a curated database
     * of real-world device signals to ensure the resulting fingerprint passes
     * uniqueness scoring without looking anomalous (like a 36-core PC with 1GB RAM).
     */
    public static generateRealisticFingerprint(): FingerprintConfig {
        const isMac = Math.random() > 0.5;
        const os = isMac ? 'Mac OS X' : 'Windows NT 10.0';
        const osVersion = isMac ? '10_15_7' : '10.0';
        const platform = isMac ? 'MacIntel' : 'Win32';

        // Ensure valid combinations for hardware concurrency and memory
        const validCores = [4, 8, 12, 16];
        const cores = validCores[Math.floor(Math.random() * validCores.length)];

        const validRam = [8, 16, 32];
        let memory = validRam[Math.floor(Math.random() * validRam.length)];
        if (cores === 16) memory = 32; // Consistency rule: high cores usually have high RAM

        // Select realistic screen resolution
        const resolutions = [
            { w: 1920, h: 1080 },
            { w: 2560, h: 1440 },
            { w: 1440, h: 900 },
            { w: 1366, h: 768 }
        ];
        const res = resolutions[Math.floor(Math.random() * resolutions.length)];

        // Randomize graphic cards based on OS
        const macGPUs = ['Apple M1', 'Apple M2', 'Intel Iris Plus Graphics 640'];
        const winGPUs = ['NVIDIA GeForce RTX 3060', 'AMD Radeon RX 6700 XT', 'Intel(R) UHD Graphics 770'];
        const gpu = isMac
            ? macGPUs[Math.floor(Math.random() * macGPUs.length)]
            : winGPUs[Math.floor(Math.random() * winGPUs.length)];

        const browserVersion = `114.0.${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 100)}`;
        const userAgent = isMac
            ? `Mozilla/5.0 (Macintosh; Intel Mac OS X ${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Safari/537.36`
            : `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Safari/537.36`;

        return {
            userAgent: userAgent,
            language: 'en-US',
            languages: ['en-US', 'en'],
            timezone: 'America/New_York',
            timezoneOffset: 240,
            doNotTrack: false,
            hardware: {
                hardwareConcurrency: cores,
                deviceMemory: memory,
                platform: platform,
                os: os,
                osVersion: osVersion,
                browser: 'Chrome',
                browserVersion: browserVersion
            },
            screen: {
                width: res.w,
                height: res.h,
                colorDepth: 24,
                pixelRatio: isMac ? 2 : 1 // Retina displays typically have pixelRatio 2
            },
            webgl: {
                vendor: 'Google Inc. (Apple)' /* WebGL unmasked typically varies */,
                renderer: 'ANGLE (Apple, Apple M1, OpenGL 4.1)',
                unmaskedVendor: isMac ? 'Apple' : 'NVIDIA Corporation',
                unmaskedRenderer: gpu,
                noiseSeed: Math.random() * 1000000
            },
            media: {
                videoInputs: 1,
                audioInputs: 1,
                audioOutputs: 1,
                deviceIds: [this.generateDeviceId(), this.generateDeviceId(), this.generateDeviceId()]
            },
            canvasNoiseSeed: Math.random() * 1000000,
            audioNoiseSeed: Math.random() * 1000000,
            fontMaskSeed: Math.random() * 1000000
        };
    }

    private static generateDeviceId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
