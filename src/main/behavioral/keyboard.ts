import { Page, KeyInput } from 'puppeteer-core';
import { BehavioralConfig } from '../profile/models';

export class KeyboardCadenceEngine {
    private page: Page;
    private config: BehavioralConfig;

    constructor(page: Page, config: BehavioralConfig) {
        this.page = page;
        this.config = config;
    }

    /**
     * Types out the provided text string character by character
     * introducing realistic typos, backspaces, and burst patterns.
     */
    public async typeText(text: string): Promise<void> {
        let isBursting = false;
        let burstLength = 0;
        let burstCount = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // 1. Simulate Typo & Correction (2% chance for non-mobile, 8% for mobile)
            const typoChance = this.config.archetype === 'mobile' ? 0.08 : 0.02;
            if (Math.random() < typoChance) {
                // Type incorrect neighboring key on QWERTY
                const typos = ['a', 's', 'd', 'f'];
                const errChar = typos[Math.floor(Math.random() * typos.length)];
                await this.page.keyboard.press(errChar as KeyInput);
                await this.sleep(this.config.typingSpeedBaseMs * 1.5); // Hesitate

                // Backspace
                await this.page.keyboard.press('Backspace' as KeyInput);
                await this.sleep(this.config.typingSpeedBaseMs * 0.8); // Fast correction
            }

            // 2. Type correct character
            await this.page.keyboard.press(char as KeyInput);

            // 3. Cadence Management
            // Determine if entering a rapid burst
            if (!isBursting && Math.random() < 0.2) {
                isBursting = true;
                burstLength = Math.floor(Math.random() * 5) + 3; // Burst next 3-7 chars
                burstCount = 0;
            }

            let delay = this.config.typingSpeedBaseMs + (Math.random() - 0.5) * this.config.typingVarianceMs;

            if (isBursting) {
                delay *= 0.6; // 40% faster during a burst
                burstCount++;
                if (burstCount >= burstLength) isBursting = false;
            } else if (Math.random() < 0.05) {
                // Think pause
                delay += 500 + Math.random() * 1500;
            }

            await this.sleep(Math.max(10, delay));
        }
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
