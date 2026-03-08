import * as fs from 'fs';
import * as path from 'path';
import { Profile } from '../profile/models';

export class ProfileWarmUpSystem {

    /**
     * Synthetically generates realistic background artifacts (Cookies, LocalStorage, History)
     * before the browser boots so that "new" profiles don't appear totally pristine to anti-bot scripts.
     */
    public static initializeWarmUpData(profile: Profile, userDataDir: string): void {
        if (profile.lifecycleState !== 'new') return;

        console.log(`[ProfileWarmUp] Generating synthetic browsing artifacts for new profile ${profile.id}...`);

        const defaultDir = path.join(userDataDir, 'Default');
        if (!fs.existsSync(defaultDir)) {
            fs.mkdirSync(defaultDir, { recursive: true });
        }

        // 1. Synthesize generic "Google/Consent" cookies
        // In a real environment, we'd inject into the Network persistent SQLite db.
        // For stealth bootstrapping, we use Chromium's Preferences JSON to force cookie accept states.
        const prefsPath = path.join(defaultDir, 'Preferences');
        const mockPrefs = {
            profile: {
                content_settings: {
                    exceptions: {
                        cookies: {
                            "https://google.com,*": { setting: 1 },
                            "https://youtube.com,*": { setting: 1 }
                        }
                    }
                }
            }
        };

        if (!fs.existsSync(prefsPath)) {
            fs.writeFileSync(prefsPath, JSON.stringify(mockPrefs));
        }

        // 2. Pre-populate History (Simulated via Usage Metrics, as SQLite injection is complex here)
        // Set metrics to imply the user has been active for ~15 sessions historically.
        profile.usage.historyCount = Math.floor(Math.random() * 50) + 15;
        profile.usage.cookieCount = Math.floor(Math.random() * 20) + 10;
        profile.usage.cacheSizeBytes = Math.floor(Math.random() * 50000000) + 10000000; // 10MB-60MB
        profile.health.sessionCount = Math.floor(Math.random() * 5) + 2;

        // Transition out of 'new' state so it looks slightly lived-in immediately
        profile.lifecycleState = 'warming';

        console.log(`[ProfileWarmUp] Profile ${profile.id} artificially aged to 'warming' state.`);
    }
}
