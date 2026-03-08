export class ChromiumFlagsSanitizer {
    /**
     * Puppeteer and similar frameworks inject flags that explicitly declare the browser
     * is automated. We must actively strip these from default args and inject counters.
     */
    public static getSanitizedFlags(): string[] {
        const flags: string[] = [];

        // 1. Defeat explicit Automation flags
        flags.push('--disable-blink-features=AutomationControlled');

        // 2. Suppress standard developer/testing warnings that bots look for
        flags.push('--disable-infobars');
        flags.push('--no-default-browser-check');
        flags.push('--no-sandbox'); // Required in some envs, but should be managed safely in enterprise

        // 3. Normalization of environment variables
        // Prevent fingerprinting based on background tabs being throttled differently
        flags.push('--disable-background-timer-throttling');
        flags.push('--disable-backgrounding-occluded-windows');
        flags.push('--disable-renderer-backgrounding');

        // 4. Force legitimate-looking screen settings internally
        flags.push('--force-color-profile=srgb');

        return flags;
    }

    /**
     * Puppeteer's defaultArgs include highly detectable flags.
     * We need to tell Puppeteer to strictly ignore them.
     */
    public static getPuppeteerIgnoreArgs(): string[] {
        return [
            '--enable-automation',
            '--disable-extensions', // We often want extensions enabled to look like a real user
            '--disable-default-apps',
            '--disable-component-extensions-with-background-pages'
        ];
    }
}
