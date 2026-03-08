import { FingerprintConfig } from '../profile/models';
import { JSEnvironmentHardener } from './injector';
import { TimingNormalizationEngine } from './timing';
import { ChromiumFlagsSanitizer } from './flags';

export class StealthHardeningEngine {

    /**
     * Compiles the full Javascript payload designed to neutralize WebDriver/CDP
     * automation signatures before any webpage executes.
     */
    public static compileStealthPayload(config: FingerprintConfig): string {
        let payload = '';

        // 1. JavaScript Environment Hardening
        payload += JSEnvironmentHardener.generatePayload(config);

        // 2. Timing Fingerprint Normalization
        payload += TimingNormalizationEngine.generatePayload(config);

        return payload;
    }

    /**
     * Retrieves the Chromium arguments required to strip explicit automation flags.
     */
    public static getSanitizedChromiumFlags(): string[] {
        return ChromiumFlagsSanitizer.getSanitizedFlags();
    }

    /**
     * Retrieves the list of default Puppeteer arguments that must be explicitly ignored.
     */
    public static getIgnoredPuppeteerArgs(): string[] {
        return ChromiumFlagsSanitizer.getPuppeteerIgnoreArgs();
    }
}
