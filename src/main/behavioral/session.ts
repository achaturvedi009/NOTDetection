import { BehavioralConfig } from '../profile/models';

export class SessionActivityModel {
    private config: BehavioralConfig;
    private startTime: number;
    private targetDurationMs: number;
    private idleSince: number = 0;

    constructor(config: BehavioralConfig) {
        this.config = config;
        this.startTime = Date.now();

        // Randomize target duration within +/- 20% of the archetype target
        const variance = (Math.random() - 0.5) * 0.4 * config.sessionDurationTargetMs;
        this.targetDurationMs = config.sessionDurationTargetMs + variance;
    }

    public shouldEndSession(): boolean {
        return (Date.now() - this.startTime) > this.targetDurationMs;
    }

    /**
     * Periodically triggers idle states to simulate reading and thinking
     * between active clicks/scrolls.
     */
    public async determineIdleState(): Promise<void> {
        if (Math.random() < this.config.idleProbability) {
            const idleTime = Math.random() * this.config.maxIdleDurationMs + 2000; // Min 2s
            this.idleSince = Date.now();
            console.log(`[SessionModel] Entering idle state for ${Math.round(idleTime/1000)}s...`);
            await this.sleep(idleTime);
            this.idleSince = 0;
            console.log(`[SessionModel] Resuming activity.`);
        }
    }

    public isIdle(): boolean {
        return this.idleSince > 0;
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
