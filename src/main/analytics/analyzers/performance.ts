import { AnalyticsDataWarehouse } from '../warehouse';
import { ProfilePerformanceMetrics } from '../models';

export class ProfilePerformanceAnalyzer {
    private warehouse: AnalyticsDataWarehouse;

    constructor(warehouse: AnalyticsDataWarehouse) {
        this.warehouse = warehouse;
    }

    public async getMetrics(profileId: string): Promise<ProfilePerformanceMetrics> {
        // In a real database, this would be an aggregation query on the telemetry table
        const events = await this.warehouse.queryEvents(undefined, undefined, 1000);

        const profileEvents = events.filter(e => e.profileId === profileId);

        let sessionStarts = 0;
        let sessionTimeMs = 0;
        let detections = 0;

        profileEvents.forEach(e => {
            if (e.category === 'SESSION_START') sessionStarts++;
            if (e.category === 'SESSION_END' && e.data.durationMs) {
                sessionTimeMs += e.data.durationMs;
            }
            if (e.category === 'DETECTION_SIGNAL') detections++;
        });

        const avgDuration = sessionStarts > 0 ? (sessionTimeMs / sessionStarts) : 0;
        // Mock success rate based on inverse of detection frequency per session
        const successRate = sessionStarts > 0 ? Math.max(0, 1 - (detections / sessionStarts)) * 100 : 100;

        return {
            profileId,
            successRate,
            averageSessionDurationMs: avgDuration,
            totalDetections: detections
        };
    }
}
