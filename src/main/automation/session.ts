import { HumanInteractionController } from '../behavioral/controller';
import { InteractionCommandEngine } from './commands';
import { DetectionSignalMonitor } from '../detection/monitor';
import { SelfHealingActionEngine } from '../detection/self-healing';
import { Profile } from '../profile/models';

/**
 * Manages the specific active browsing session, wrapping Puppeteer pages
 * with the Behavioral constraints.
 */
export class BrowserSessionController {
    public behavior: HumanInteractionController;
    public commands: InteractionCommandEngine;
    public readonly sessionStartMs: number;
    private detectionMonitor: DetectionSignalMonitor;
    public profile: Profile;

    constructor(behaviorController: HumanInteractionController, profile: Profile) {
        this.behavior = behaviorController;
        this.commands = new InteractionCommandEngine(behaviorController, profile.id);
        this.sessionStartMs = Date.now();
        this.profile = profile;

        // Initialize active detection monitoring
        this.detectionMonitor = new DetectionSignalMonitor(this.behavior.page, this.profile);

        // Emit Telemetry: Session Start
        const analytics = (global as any).analyticsWarehouse;
        if (analytics) {
            analytics.recordEvent(this.profile.id, 'SESSION_START', { os: this.profile.fingerprint.hardware.os, browser: this.profile.fingerprint.hardware.browser });
        }
    }

    public getSessionDurationMs(): number {
        return Date.now() - this.sessionStartMs;
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
