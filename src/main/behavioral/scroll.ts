import { Page } from 'puppeteer-core';
import { BehavioralConfig } from '../profile/models';

export class ScrollBehaviorEngine {
    private page: Page;
    private config: BehavioralConfig;

    constructor(page: Page, config: BehavioralConfig) {
        this.page = page;
        this.config = config;
    }

    /**
     * Synthesize human scrolling patterns including inertia, partial stops,
     * overscroll correction, and reading pauses.
     */
    public async scrollBy(deltaY: number): Promise<void> {
        let remaining = deltaY;
        let direction = Math.sign(deltaY);

        while (Math.abs(remaining) > 0) {
            // Variable chunk sizes simulating mouse wheel clicks or trackpad swiping
            const maxStep = 100 * this.config.scrollInertiaMultiplier;
            const chunk = Math.min(Math.random() * maxStep + 20, Math.abs(remaining));
            remaining -= chunk * direction;

            // Trigger scroll via mouse wheel delta
            await this.page.mouse.wheel({ deltaY: chunk * direction });

            // Randomly pause mid-scroll (e.g. trackpad finger lift, or reading a section)
            if (Math.random() < 0.2) {
                // Pause 100-300ms
                await this.sleep(100 + Math.random() * 200);
            }

            // Occasional Overscroll and Correction
            if (Math.abs(remaining) < 50 && Math.random() < 0.1) {
                // Scroll slightly past target
                const overscroll = 30 + Math.random() * 50;
                await this.page.mouse.wheel({ deltaY: overscroll * direction });
                await this.sleep(400); // Realize mistake
                // Snap back
                await this.page.mouse.wheel({ deltaY: -overscroll * direction });
            }

            // Normal inertia delay between rapid scrolls
            await this.sleep(30 + Math.random() * 40);
        }
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
