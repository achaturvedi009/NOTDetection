import { Page } from 'puppeteer-core';
import { BehavioralConfig } from '../profile/models';
import { MousePhysicsEngine } from './mouse';
import { KeyboardCadenceEngine } from './keyboard';
import { ScrollBehaviorEngine } from './scroll';
import { SessionActivityModel } from './session';
import { NavigationSimulator } from './navigation';

export class HumanInteractionController {
    public page: Page;
    public config: BehavioralConfig;

    public mouse: MousePhysicsEngine;
    public keyboard: KeyboardCadenceEngine;
    public scroll: ScrollBehaviorEngine;
    public session: SessionActivityModel;
    public navigation: NavigationSimulator;

    constructor(page: Page, config: BehavioralConfig) {
        this.page = page;
        this.config = config;

        this.mouse = new MousePhysicsEngine(page, config);
        this.keyboard = new KeyboardCadenceEngine(page, config);
        this.scroll = new ScrollBehaviorEngine(page, config);
        this.session = new SessionActivityModel(config);
        this.navigation = new NavigationSimulator(page, config);
    }

    /**
     * Composite Behavioral Action: Look around a page
     * Simulates scanning, scrolling, and finding interactive elements.
     */
    public async browsePageAndScan(): Promise<void> {
        await this.session.determineIdleState();

        const viewport = this.page.viewport() || { width: 1920, height: 1080 };

        // Randomly sweep the mouse
        const sweeps = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < sweeps; i++) {
            const rx = Math.random() * viewport.width;
            const ry = Math.random() * viewport.height;
            await this.mouse.move(rx, ry);
        }

        // Random scroll down
        const distance = Math.floor(Math.random() * 800) + 200;
        await this.scroll.scrollBy(distance);

        await this.session.determineIdleState();

        // Optional back button
        if (await this.navigation.tryRevisit()) {
            console.log(`[Interaction Controller] Simulating "Back" button navigation.`);
        }
    }
}
