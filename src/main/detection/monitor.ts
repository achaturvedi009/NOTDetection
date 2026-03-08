import { Page } from 'puppeteer-core';
import { Profile, DetectionEvent } from '../profile/models';

export class DetectionSignalMonitor {
    private page: Page;
    private profile: Profile;

    constructor(page: Page, profile: Profile) {
        this.page = page;
        this.profile = profile;
        this.attachHooks();
    }

    /**
     * Hooks into Puppeteer's Page events to passively sniff for detection signals
     * without actively modifying the page state.
     */
    private attachHooks(): void {
        // Monitor for explicit HTTP blocks (Cloudflare, Datadome, Akamai often throw 403)
        this.page.on('response', async (response) => {
            const status = response.status();
            if (status === 403 || status === 429) {
                const url = response.url();
                // Avoid logging generic image/css 403s; focus on document/script blocks
                if (response.request().resourceType() === 'document') {
                    this.recordDetection('http_403', url, 0.7);
                }
            }
        });

        // Monitor for JS errors that indicate environment mismatch (e.g. script trying to access missing canvas API)
        this.page.on('pageerror', (err: unknown) => {
            if (err instanceof Error) {
                if (err.message.includes('WebGL') || err.message.includes('Canvas')) {
                    this.recordDetection('js_anomaly', this.page.url(), 0.4);
                }
            }
        });

        // Passive polling for visual challenge pages (CAPTCHA)
        const captchaInterval = setInterval(async () => {
            if (this.page.isClosed()) return;
            try {
                const isChallenge = await this.page.evaluate(() => {
                    const title = document.title.toLowerCase();
                    return title.includes('just a moment') || title.includes('attention required') || title.includes('captcha');
                });

                if (isChallenge) {
                    this.recordDetection('captcha', this.page.url(), 0.5);
                }
            } catch (e) { /* context destroyed */ }
        }, 10000);

        // Prevent memory leak by actively clearing the interval and freeing the closures
        this.page.on('close', () => {
            clearInterval(captchaInterval);
        });
    }

    private recordDetection(type: DetectionEvent['type'], url: string, severity: number) {
        console.warn(`[DetectionMonitor] Profile ${this.profile.id} caught signal: ${type} at ${url}`);
        this.profile.health.recentDetections.push({
            timestamp: new Date(),
            type,
            url,
            severity
        });

        // Keep memory bounded
        if (this.profile.health.recentDetections.length > 50) {
            this.profile.health.recentDetections.shift();
        }
    }
}
