import { Profile } from '../profile/models';
import { DEVICE_TEMPLATES } from '../fingerprint/template';

export class DeviceIdentityEvolutionEngine {

    /**
     * Checks if a profile is eligible for a simulated software update
     * (e.g., background Chrome update) and modifies the fingerprint cleanly.
     */
    public static attemptEvolutionEvent(profile: Profile): boolean {
        // Only evolve active or mature profiles occasionally (~2% chance per check)
        if (!['active', 'mature'].includes(profile.lifecycleState)) return false;
        if (Math.random() > 0.02) return false;

        const currentVersion = profile.fingerprint.hardware.browserVersion;
        const os = profile.fingerprint.hardware.os;

        // Find the base template to know the valid upgrade paths
        const template = DEVICE_TEMPLATES.find(t =>
            (os.includes('Windows') && t.os === 'Windows') ||
            (os.includes('Mac') && t.os === 'macOS') ||
            (os.includes('Linux') && t.os === 'Linux') ||
            (os.includes('Android') && t.os === 'Android') ||
            (os.includes('iOS') && t.os === 'iOS')
        );

        if (!template) return false;

        // See if there's a newer version in the template range
        const versions = template.browserVersionRange;
        const currentIndex = versions.indexOf(currentVersion);

        if (currentIndex !== -1 && currentIndex < versions.length - 1) {
            const newVersion = versions[currentIndex + 1];
            profile.fingerprint.hardware.browserVersion = newVersion;

            // Update User-Agent with new version
            profile.fingerprint.userAgent = profile.fingerprint.userAgent.replace(currentVersion, newVersion);

            console.log(`[Identity Evolution] Profile ${profile.id} naturally upgraded to Browser Version ${newVersion}`);
            return true;
        }

        return false;
    }
}
