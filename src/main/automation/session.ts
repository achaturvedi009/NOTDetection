import { HumanInteractionController } from '../behavioral/controller';
import { InteractionCommandEngine } from './commands';

/**
 * Manages the specific active browsing session, wrapping Puppeteer pages
 * with the Behavioral constraints.
 */
export class BrowserSessionController {
    public behavior: HumanInteractionController;
    public commands: InteractionCommandEngine;

    constructor(behaviorController: HumanInteractionController) {
        this.behavior = behaviorController;
        this.commands = new InteractionCommandEngine(behaviorController);
    }

    /**
     * Executes a predefined task within the stealth environment.
     */
    public async executeTask(taskName: string, params: any): Promise<any> {
        // In a real system, this would look up a task from a registry.
        // We will hardcode a mock 'search' task for demonstration.
        if (taskName === 'google_search') {
            await this.commands.navigate('https://www.google.com');
            await this.commands.typeText('textarea[name="q"]', params.query || 'anti-detect browser');
            await this.behavior.page.keyboard.press('Enter');
            await this.behavior.page.waitForNavigation({ waitUntil: 'networkidle2' });
            await this.commands.scrollPage(500); // Look at results
            return { success: true, url: this.behavior.page.url() };
        }

        throw new Error(`Task ${taskName} not found.`);
    }
}
