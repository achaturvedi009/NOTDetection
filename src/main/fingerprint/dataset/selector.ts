import { DeviceCategory, OperatingSystem, DeviceIdentityTemplate } from './models';
import { GPU_DATABASE } from './gpu';
import { FONT_PACKS, AUDIO_PROFILES, NETWORK_PROFILES } from './peripherals';

export class DatasetTemplateSelector {

    /**
     * Replaces the static hardcoded DEVICE_TEMPLATES with an intelligent,
     * distribution-based selection algorithm to prevent clustering.
     */
    public static buildDynamicTemplate(seedInt: number, overrideCategory?: DeviceCategory): DeviceIdentityTemplate {
        const category = overrideCategory || this.selectByWeight(seedInt, [
            { value: 'desktop', weight: 0.60 },
            { value: 'laptop', weight: 0.20 },
            { value: 'mobile', weight: 0.20 }
        ]);

        const os = this.selectOS(seedInt, category);
        const gpu = this.selectCompatibleGPU(seedInt, os);

        const fontPackId = os.includes('Windows') ? 'windows_default' :
                           os.includes('macOS') || os.includes('iOS') ? 'macos_default' :
                           os.includes('Android') ? 'android_default' : 'linux_default';

        const audioProfileId = category === 'mobile' ? 'mobile_standard' :
                               os.includes('macOS') ? 'mac_high_res' : 'standard_desktop';

        const networkProfileId = category === 'mobile' ? 'mobile_5g' : 'broadband_wired';

        const resolutions = category === 'desktop' ? [
            { width: 1920, height: 1080, pixelRatio: 1 },
            { width: 2560, height: 1440, pixelRatio: 1 }
        ] : category === 'mobile' ? [
            { width: 393, height: 852, pixelRatio: 3 }, // iPhone roughly
            { width: 412, height: 915, pixelRatio: 2.625 } // Pixel roughly
        ] : [
            { width: 1366, height: 768, pixelRatio: 1 },
            { width: 1440, height: 900, pixelRatio: 2 }
        ];

        return {
            deviceId: `device_${seedInt}`,
            category: category,
            os: os,
            osVersion: os.includes('Windows 11') ? '10.0' : os.includes('macOS') ? '10_15_7' : '14',
            browserFamily: os.includes('iOS') ? 'Safari' : 'Chrome',
            browserVersionRange: ['120.0.6099.129', '121.0.6167.85'],
            cpuArchitecture: os.includes('Mac') || os.includes('iOS') || os.includes('Android') ? 'arm64' : 'x86_64',
            cpuCoreCount: [8, 12, 16],
            memorySizeGB: [8, 16, 32],
            screenResolutions: resolutions,
            colorDepth: 24,
            fontPackId,
            audioProfileId,
            networkProfileId,
            marketShareWeight: 1.0
        };
    }

    private static selectOS(seedInt: number, category: DeviceCategory): OperatingSystem {
        if (category === 'mobile') {
            return this.selectByWeight(seedInt, [
                { value: 'iOS 17', weight: 0.55 },
                { value: 'iOS 16', weight: 0.10 },
                { value: 'Android 14', weight: 0.25 },
                { value: 'Android 13', weight: 0.10 }
            ]);
        }

        return this.selectByWeight(seedInt, [
            { value: 'Windows 10', weight: 0.40 },
            { value: 'Windows 11', weight: 0.35 },
            { value: 'macOS Sonoma', weight: 0.15 },
            { value: 'macOS Ventura', weight: 0.08 },
            { value: 'Linux', weight: 0.02 }
        ]);
    }

    private static selectCompatibleGPU(seedInt: number, os: OperatingSystem) {
        const validGPUs = GPU_DATABASE.filter(g => g.compatibleOS.includes(os));
        if (validGPUs.length === 0) {
            throw new Error(`[DatasetValidator] No compatible GPU found for OS: ${os}`);
        }

        const weights = validGPUs.map(g => ({ value: g, weight: g.marketShareWeight }));
        return this.selectByWeight(seedInt, weights);
    }

    private static selectByWeight<T>(seedInt: number, choices: { value: T, weight: number }[]): T {
        const totalWeight = choices.reduce((sum, c) => sum + c.weight, 0);
        // Normalize seedInt into a float between 0 and totalWeight
        let randomVal = ((seedInt * 13) % 1000) / 1000 * totalWeight;

        for (const choice of choices) {
            if (randomVal < choice.weight) {
                return choice.value;
            }
            randomVal -= choice.weight;
        }
        return choices[choices.length - 1].value;
    }
}
