import { AnalyticsDataWarehouse } from '../warehouse';

export class BehavioralPatternAnalyzer {
    private warehouse: AnalyticsDataWarehouse;

    constructor(warehouse: AnalyticsDataWarehouse) {
        this.warehouse = warehouse;
    }

    /**
     * Evaluates simulated user behavior to ensure interaction frequency and idle times remain human.
     */
    public async analyzeInteractionRealism(profileId: string): Promise<{ totalInteractions: number, idleRatio: number, isAnomalous: boolean }> {
        const events = await this.warehouse.queryEvents('BEHAVIORAL_INTERACTION', undefined, 1000);

        const profileEvents = events.filter(e => e.profileId === profileId);

        let interactions = 0;
        let idleTimeMs = 0;
        let totalActiveTimeMs = 1; // avoid div/0

        let lastTimestamp = 0;

        for (const e of profileEvents) {
            if (e.data.action === 'idle_start') {
                lastTimestamp = e.timestamp;
            } else if (e.data.action === 'idle_end' && lastTimestamp > 0) {
                idleTimeMs += (e.timestamp - lastTimestamp);
            } else if (['click', 'type', 'scroll'].includes(e.data.action)) {
                interactions++;
                totalActiveTimeMs += 100; // rough active estimation per event
            }
        }

        const idleRatio = idleTimeMs / (totalActiveTimeMs + idleTimeMs);

        // If a profile has >100 interactions but 0% idle time, it's flagged as robotic.
        const isAnomalous = interactions > 100 && idleRatio < 0.01;

        return { totalInteractions: interactions, idleRatio, isAnomalous };
    }
}
