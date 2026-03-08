import { HumanInteractionController } from '../behavioral/controller';

/**
 * High-level wrapper over Puppeteer that strictly routes all interaction
 * through the humanized physical models.
 */
export class InteractionCommandEngine {
    private behavior: HumanInteractionController;

    constructor(behavior: HumanInteractionController) {
        this.behavior = behavior;
    }

    public async navigate(url: string): Promise<void> {
        console.log(`[InteractionEngine] Navigating to ${url}...`);
        await this.behavior.page.goto(url, { waitUntil: 'networkidle2' });
        this.behavior.navigation.recordNavigation(url);
        await this.behavior.session.determineIdleState(); // Read the page load
    }

    public async clickElement(selector: string): Promise<void> {
        // Wait for element to be visible
        const element = await this.behavior.page.waitForSelector(selector, { visible: true });
        if (!element) throw new Error(`Element ${selector} not found.`);

        // Get exact coordinates to simulate human movement
        const box = await element.boundingBox();
        if (!box) throw new Error(`Element ${selector} has no bounding box.`);

        // Target the center of the element, with a slight random offset
        const targetX = box.x + (box.width / 2) + (Math.random() * 10 - 5);
        const targetY = box.y + (box.height / 2) + (Math.random() * 10 - 5);

        // Move cursor realistically and click
        if (this.behavior.touch) {
            await this.behavior.touch.tap(targetX, targetY);
        } else {
            await this.behavior.mouse.click(targetX, targetY);
        }

        await this.behavior.session.determineIdleState();
    }

    public async typeText(selector: string, text: string): Promise<void> {
        await this.clickElement(selector); // Focus the field humanly
        await this.behavior.keyboard.typeText(text); // Type with cadence/typos
        await this.behavior.session.determineIdleState();
    }

    public async scrollPage(distance: number): Promise<void> {
        await this.behavior.scroll.scrollBy(distance);
        await this.behavior.session.determineIdleState();
    }
}
