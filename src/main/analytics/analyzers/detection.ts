import { AnalyticsDataWarehouse } from '../warehouse';

export class DetectionIntelligenceAnalyzer {
    private warehouse: AnalyticsDataWarehouse;

    constructor(warehouse: AnalyticsDataWarehouse) {
        this.warehouse = warehouse;
    }

    /**
     * Identifies detection-prone websites and clusters detection types.
     */
    public async analyzeThreatLandscape(): Promise<{ urlClusters: Record<string, number>, topThreats: Record<string, number> }> {
        const events = await this.warehouse.queryEvents('DETECTION_SIGNAL', Date.now() - (86400000 * 7), 2000); // Last 7 days

        const urlClusters: Record<string, number> = {};
        const topThreats: Record<string, number> = {};

        for (const e of events) {
            try {
                // Safely extract hostname for clustering
                const hostname = new URL(e.data.url).hostname;
                urlClusters[hostname] = (urlClusters[hostname] || 0) + 1;
            } catch {
                urlClusters['unknown'] = (urlClusters['unknown'] || 0) + 1;
            }

            const type = e.data.type as string;
            topThreats[type] = (topThreats[type] || 0) + 1;
        }

        return { urlClusters, topThreats };
    }
}
