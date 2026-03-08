import * as crypto from 'crypto';
import { FingerprintConfig } from '../profile/models';
import { DEVICE_TEMPLATES, DeviceTemplate } from './template';
import { ConsistencyValidator } from './validator';
import { BehavioralTemplates } from '../behavioral/templates';

export class FingerprintGenerator {

    /**
     * Deterministic Generation Pipeline
     * Step 1: Select device template
     * Step 2: Generate profile seed
     * Step 3: Derive values from template using seed
     * Step 4: Validate with consistency matrix
     */
    public static generateConsistentFingerprint(seedStr?: string): { config: FingerprintConfig, templateId: string, seed: string } {
        // Step 2: Seed Generation
        const seed = seedStr || crypto.randomBytes(16).toString('hex');

        // Use seed to select index deterministically
        const seedInt = parseInt(seed.substring(0, 8), 16);

        // Step 1: Select Template
        const templateIndex = seedInt % DEVICE_TEMPLATES.length;
        const template = DEVICE_TEMPLATES[templateIndex];

        // Step 3: Derive Values
        const config = this.deriveFromTemplate(template, seedInt);

        // Step 4: Validate and auto-correct
        ConsistencyValidator.validateFingerprint(config);

        return { config, templateId: template.id, seed };
    }

    private static deriveFromTemplate(t: DeviceTemplate, seedInt: number): FingerprintConfig {
        const pick = <T>(arr: T[], offset: number = 0): T => arr[(seedInt + offset) % arr.length];

        const osVersion = pick(t.osVersionRange, 1);
        const browserVersion = pick(t.browserVersionRange, 2);

        const userAgentOS = t.os === 'macOS' ? `Intel Mac OS X ${osVersion}` :
                            t.os === 'Windows' ? `Windows NT ${osVersion}; Win64; x64` :
                            `X11; Linux ${osVersion}`;

        const userAgent = `Mozilla/5.0 (${userAgentOS}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Safari/537.36`;

        const screen = pick(t.screenResolutions, 3);
        const renderer = pick(t.webglRendererList, 4);

        const behavioral = BehavioralTemplates.getDeterministicBehavior(seedInt);

        return {
            userAgent: userAgent,
            language: 'en-US',
            languages: ['en-US', 'en'],
            timezone: 'America/New_York', // In production, this maps dynamically to Proxy Geo
            timezoneOffset: 240,
            doNotTrack: (seedInt % 2) === 0,
            hardware: {
                hardwareConcurrency: pick(t.cpuCores, 5),
                deviceMemory: pick(t.ramGB, 6),
                platform: t.platform,
                os: t.os === 'Windows' ? 'Windows NT 10.0' : t.os === 'macOS' ? 'Mac OS X' : 'Linux x86_64',
                osVersion: osVersion,
                browser: t.browser,
                browserVersion: browserVersion
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: 24,
                pixelRatio: screen.pixelRatio,
                isMobile: false,
                hasTouch: false,
                orientation: 'landscape-primary'
            },
            webgl: {
                vendor: t.webglVendor,
                renderer: renderer,
                unmaskedVendor: t.os === 'Windows' ? 'NVIDIA Corporation' : t.os === 'macOS' ? 'Apple' : 'Intel Open Source Technology Center',
                unmaskedRenderer: renderer,
                noiseSeed: (seedInt * 13) % 1000000 // Deterministic noise seed
            },
            media: {
                videoInputs: 1,
                audioInputs: 1,
                audioOutputs: 1,
                deviceIds: [
                    this.deterministicHash(seedInt + 1),
                    this.deterministicHash(seedInt + 2),
                    this.deterministicHash(seedInt + 3)
                ]
            },
            behavioral: behavioral,
            canvasNoiseSeed: (seedInt * 17) % 1000000,
            audioNoiseSeed: (seedInt * 19) % 1000000,
            fontMaskSeed: (seedInt * 23) % 1000000
        };
    }

    private static deterministicHash(input: number): string {
        return crypto.createHash('sha256').update(input.toString()).digest('hex').substring(0, 16);
    }

    private static generateDeviceId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
