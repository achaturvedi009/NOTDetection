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

        // Mobile specific validation
        if (config.screen.isMobile) {
            const { MobileEnvironmentConsistencyEngine } = require('../mobile/consistency');
            MobileEnvironmentConsistencyEngine.validateMobileIdentity(config);
        }

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

        // Default to mobile archetype if template is mobile
        let behavioral = BehavioralTemplates.getDeterministicBehavior(seedInt);
        if (t.isMobile) {
            behavioral = BehavioralTemplates.TEMPLATES['mobile'];
        }

        let mobileConfig;
        let sensorConfig;

        if (t.isMobile) {
            const modelName = pick(t.modelNames || ['Unknown Device'], 5);
            const netMode = pick(t.mobileNetworkModes || ['4g'], 6);

            // Derive network type safely based on valid string unions
            let effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' = '4g';
            if (['slow-2g', '2g', '3g', '4g', '5g'].includes(netMode)) {
                effectiveType = netMode as any;
            }

            mobileConfig = {
                manufacturer: t.manufacturer || 'Generic',
                model: modelName,
                battery: {
                    charging: (seedInt % 2 === 0),
                    level: 0.3 + ((seedInt % 70) / 100), // Random 30% to 99%
                    chargingTime: 0,
                    dischargingTime: Infinity
                },
                network: {
                    connectionType: 'cellular' as const,
                    effectiveType: effectiveType,
                    rtt: 50,
                    downlink: 10
                }
            };

            sensorConfig = {
                hasAccelerometer: true,
                hasGyroscope: true,
                hasAmbientLight: true,
                hasProximity: true,
                alpha: seedInt % 360,
                beta: (seedInt % 180) - 90,
                gamma: (seedInt % 180) - 90,
                accelX: (seedInt % 10) * 0.1,
                accelY: ((seedInt + 1) % 10) * 0.1,
                accelZ: 9.81 + ((seedInt + 2) % 10) * 0.1
            };
        }

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
                os: t.os === 'Windows' ? 'Windows NT 10.0' : t.os === 'macOS' ? 'Mac OS X' : t.os === 'iOS' ? 'iOS' : t.os === 'Android' ? 'Android' : 'Linux x86_64',
                osVersion: osVersion,
                browser: t.browser,
                browserVersion: browserVersion
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: 24,
                pixelRatio: screen.pixelRatio,
                isMobile: !!t.isMobile,
                hasTouch: !!t.isMobile,
                orientation: t.isMobile ? 'portrait-primary' : 'landscape-primary'
            },
            webgl: {
                vendor: t.webglVendor,
                renderer: renderer,
                unmaskedVendor: t.os === 'Windows' ? 'NVIDIA Corporation' : t.os === 'macOS' ? 'Apple' : t.os === 'iOS' ? 'Apple Inc.' : t.os === 'Android' ? 'Google Inc. (ARM)' : 'Intel Open Source Technology Center',
                unmaskedRenderer: renderer,
                noiseSeed: (seedInt * 13) % 1000000 // Deterministic noise seed
            },
            media: {
                videoInputs: t.isMobile ? 2 : 1, // Front and back camera typically
                audioInputs: 1,
                audioOutputs: 1,
                deviceIds: [
                    this.deterministicHash(seedInt + 1),
                    this.deterministicHash(seedInt + 2),
                    this.deterministicHash(seedInt + 3)
                ]
            },
            mobile: mobileConfig,
            sensors: sensorConfig,
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
