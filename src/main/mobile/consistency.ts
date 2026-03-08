import { FingerprintConfig } from '../profile/models';

export class MobileEnvironmentConsistencyEngine {

    /**
     * Validates that the generated mobile fingerprint combinations are logically consistent
     * with the manufacturer and OS definitions.
     */
    public static validateMobileIdentity(config: FingerprintConfig): boolean {
        if (!config.mobile) return true; // Not a mobile profile

        let valid = true;
        const os = config.hardware.os;

        // 1. Android checks
        if (os === 'Android') {
            if (!config.hardware.platform.includes('Linux arm') && !config.hardware.platform.includes('Android')) {
                console.warn('[Consistency] Android device platform string must reflect ARM or Android.');
                config.hardware.platform = 'Linux armv8l';
            }
            if (config.webgl.unmaskedVendor === 'Apple Inc.') {
                console.warn('[Consistency] Android cannot have Apple WebGL Vendor.');
                config.webgl.unmaskedVendor = 'Google Inc. (ARM)';
            }
        }

        // 2. iOS checks
        if (os === 'iOS') {
            if (config.hardware.platform !== 'iPhone' && config.hardware.platform !== 'iPad') {
                console.warn('[Consistency] iOS device platform string must be iPhone/iPad.');
                config.hardware.platform = 'iPhone';
            }
            if (config.webgl.unmaskedVendor !== 'Apple Inc.') {
                console.warn('[Consistency] iOS must have Apple WebGL Vendor.');
                config.webgl.unmaskedVendor = 'Apple Inc.';
            }
            // Safari mobile strictness
            if (config.hardware.browser !== 'Safari') {
                console.warn('[Consistency] iOS devices strictly use WebKit/Safari.');
                config.hardware.browser = 'Safari';
            }
        }

        // 3. Screen and Touch Logic
        if (config.screen.isMobile) {
            config.screen.hasTouch = true;
            if (!config.mobile.model) {
                console.warn('[Consistency] Mobile device missing model string.');
                valid = false;
            }
        }

        return valid;
    }
}
