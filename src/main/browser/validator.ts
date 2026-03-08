import { Profile } from '../profile/models';

export class RuntimeEnvironmentValidator {

    /**
     * Executes a pre-flight structural integrity check to ensure the generated flags,
     * network configs, and behavioral systems are properly aligned.
     * Prevents launching profiles that would inherently leak or trigger immediate bans.
     */
    public static validateBeforeLaunch(profile: Profile, executablePath: string): void {
        console.log(`[RuntimeValidator] Executing pre-flight checks for profile ${profile.id}...`);

        // 1. Executable Safety
        if (!executablePath) {
            throw new Error(`[RuntimeValidator] Chromium executable path missing.`);
        }

        // 2. Behavioral Constraint Check
        if (profile.fingerprint.screen.isMobile && profile.fingerprint.behavioral.archetype !== 'mobile') {
            throw new Error(`[RuntimeValidator] FATAL: Profile is marked as Mobile OS but lacks the Mobile Behavioral Archetype. This will cause robotic typing bans.`);
        }

        if (!profile.fingerprint.screen.isMobile && profile.fingerprint.behavioral.archetype === 'mobile') {
            throw new Error(`[RuntimeValidator] FATAL: Desktop OS profile has Mobile Behavioral Archetype assigned.`);
        }

        // 3. WebGL Mismatch
        const glUnmasked = profile.fingerprint.webgl.unmaskedVendor.toLowerCase();
        if (profile.fingerprint.hardware.os === 'macOS' && !glUnmasked.includes('apple')) {
            throw new Error(`[RuntimeValidator] FATAL: macOS profile has non-Apple WebGL Vendor. Fix template generator.`);
        }

        // 4. Proxy Configuration (Ensure no Direct connections on highly sensitive ops)
        if (profile.health.threatLevel === 'critical' && profile.proxy.type === 'direct') {
            throw new Error(`[RuntimeValidator] FATAL: Profile is at CRITICAL risk but configured for a DIRECT proxy. Banned IP exposure highly likely.`);
        }

        console.log(`[RuntimeValidator] Pre-flight checks passed successfully.`);
    }
}
