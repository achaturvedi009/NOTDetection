import * as crypto from 'crypto';
import { FingerprintConfig } from '../profile/models';
import { DEVICE_TEMPLATES, DeviceTemplate } from './template';
import { ConsistencyValidator } from './validator';
import { BehavioralTemplates } from '../behavioral/templates';
import { DatasetTemplateSelector } from './dataset/selector';
import { GPU_DATABASE } from './dataset/gpu';

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

        // Step 1: Select Template using High-Fidelity Dataset Engine
        const template = DatasetTemplateSelector.buildDynamicTemplate(seedInt);

        // Step 3: Derive Values
        const config = this.deriveFromDatasetTemplate(template, seedInt);

        // Step 4: Validate and auto-correct
        ConsistencyValidator.validateFingerprint(config);

        // Mobile specific validation
        if (config.screen.isMobile) {
            const { MobileEnvironmentConsistencyEngine } = require('../mobile/consistency');
            MobileEnvironmentConsistencyEngine.validateMobileIdentity(config);
        }

        return { config, templateId: template.deviceId, seed };
    }

    // Legacy support kept intact, migrating derive logic to use Phase 14 Dataset
    private static deriveFromDatasetTemplate(t: any, seedInt: number): FingerprintConfig {
        const pick = <T>(arr: T[], offset: number = 0): T => arr[(seedInt + offset) % arr.length];

        const osVersion = t.osVersion;
        const browserVersion = pick(t.browserVersionRange, 2);

        let userAgentOS = '';
        let platformString = '';
        let formalOsString = '';

        if (t.os.includes('Windows')) {
            userAgentOS = `Windows NT ${osVersion}; Win64; x64`;
            platformString = 'Win32';
            formalOsString = 'Windows NT 10.0';
        } else if (t.os.includes('macOS')) {
            userAgentOS = `Macintosh; Intel Mac OS X ${osVersion}`;
            platformString = 'MacIntel';
            formalOsString = 'Mac OS X';
        } else if (t.os.includes('iOS')) {
            userAgentOS = `iPhone; CPU iPhone OS ${osVersion.replace(/\./g, '_')} like Mac OS X`;
            platformString = 'iPhone';
            formalOsString = 'iOS';
        } else if (t.os.includes('Android')) {
            userAgentOS = `Linux; Android ${osVersion}; Pixel 8`;
            platformString = 'Linux armv8l';
            formalOsString = 'Android';
        } else {
            userAgentOS = `X11; Linux x86_64`;
            platformString = 'Linux x86_64';
            formalOsString = 'Linux';
        }

        const userAgent = `Mozilla/5.0 (${userAgentOS}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Safari/537.36`;

        const screen: any = pick(t.screenResolutions, 3);

        // Grab a matching GPU from the database
        const compatibleGPUs = GPU_DATABASE.filter(g => g.compatibleOS.includes(t.os));
        const gpu = compatibleGPUs.length > 0 ? pick(compatibleGPUs, 4) : GPU_DATABASE[0];

        const isMobile = t.category === 'mobile';
        let behavioral = BehavioralTemplates.getDeterministicBehavior(seedInt);
        if (isMobile) {
            behavioral = BehavioralTemplates.TEMPLATES['mobile'];
        }

        let mobileConfig;
        let sensorConfig;

        if (isMobile) {
            mobileConfig = {
                manufacturer: t.os.includes('iOS') ? 'Apple' : 'Google',
                model: t.os.includes('iOS') ? 'iPhone 14 Pro' : 'Pixel 8',
                battery: {
                    charging: (seedInt % 2 === 0),
                    level: 0.3 + ((seedInt % 70) / 100),
                    chargingTime: 0,
                    dischargingTime: Infinity
                },
                network: {
                    connectionType: 'cellular' as const,
                    effectiveType: '5g' as const,
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
            userAgent: userAgent as string,
            language: 'en-US',
            languages: ['en-US', 'en'],
            timezone: 'America/New_York',
            timezoneOffset: 240,
            doNotTrack: (seedInt % 2) === 0,
            hardware: {
                hardwareConcurrency: pick(t.cpuCoreCount, 5) as number,
                deviceMemory: pick(t.memorySizeGB, 6) as number,
                platform: platformString,
                os: formalOsString,
                osVersion: osVersion,
                browser: t.browserFamily,
                browserVersion: browserVersion as string
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: t.colorDepth,
                pixelRatio: screen.pixelRatio,
                isMobile: isMobile,
                hasTouch: isMobile,
                orientation: isMobile ? 'portrait-primary' : 'landscape-primary'
            },
            webgl: {
                vendor: gpu.vendorString,
                renderer: gpu.rendererString,
                unmaskedVendor: gpu.vendorString,
                unmaskedRenderer: gpu.rendererString,
                noiseSeed: (seedInt * 13) % 1000000
            },
            media: {
                videoInputs: isMobile ? 2 : 1,
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
