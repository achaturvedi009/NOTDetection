import { BrowserLauncher } from '../browser/launcher';
import { ProfileManager } from '../profile/manager';
import { BrowserSessionController } from './session';
import { ProfileLifecycleController } from '../lifecycle/controller';
import { DeviceIdentityEvolutionEngine } from '../lifecycle/evolution';
import { ProfileHealthMonitoringEngine, ProfileRepairRegenerationEngine } from '../lifecycle/health';

/**
 * High-level orchestrator for automated profiles.
 */
export class ProfileAutomationController {
    private profileManager: ProfileManager;
    private launcher: BrowserLauncher;
    private activeSessions: Map<string, BrowserSessionController> = new Map();

    constructor(profileManager: ProfileManager, launcher: BrowserLauncher) {
        this.profileManager = profileManager;
        this.launcher = launcher;
    }

    public async startProfile(profileId: string): Promise<BrowserSessionController> {
        if (this.activeSessions.has(profileId)) {
            return this.activeSessions.get(profileId)!;
        }

        const profile = await this.profileManager.getProfile(profileId);
        if (!profile) throw new Error(`Profile ${profileId} not found.`);

        if (profile.lifecycleState === 'retired') {
            throw new Error(`Profile ${profileId} is retired and cannot be launched.`);
        }

        // Phase 8: Evolution Check
        if (DeviceIdentityEvolutionEngine.attemptEvolutionEvent(profile)) {
            await this.profileManager.updateProfile(profile);
        }

        // For automation, we typically fallback to a known chromium path, but we'll use a placeholder here
        const execPath = process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome';

        const behaviorController = await this.launcher.launchProfile(profile, execPath);

        const sessionController = new BrowserSessionController(behaviorController);
        this.activeSessions.set(profileId, sessionController);

        return sessionController;
    }

    public async stopProfile(profileId: string): Promise<void> {
        const session = this.activeSessions.get(profileId);
        if (session) {
            const duration = session.getSessionDurationMs();

            await this.launcher.stopProfile(profileId);
            this.activeSessions.delete(profileId);

            // Phase 8: Profile Lifecycle & Health updates on closure
            const profile = await this.profileManager.getProfile(profileId);
            if (profile) {
                ProfileLifecycleController.onSessionEnd(profile, duration);
                ProfileHealthMonitoringEngine.evaluateRiskScore(profile);
                ProfileRepairRegenerationEngine.attemptRepair(profile);

                // Save evolved state to DB
                await this.profileManager.updateProfile(profile);
            }
        }
    }

    public async executeTask(profileId: string, taskName: string, params: any): Promise<any> {
        const session = this.activeSessions.get(profileId);
        if (!session) {
            throw new Error(`Cannot execute task: Profile ${profileId} is not running.`);
        }
        return await session.executeTask(taskName, params);
    }
}
