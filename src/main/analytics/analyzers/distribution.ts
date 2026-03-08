import { AnalyticsDataWarehouse } from '../warehouse';
import { ProfileManager } from '../../profile/manager';
import { DistributionMetric } from '../models';

export class FingerprintDistributionAnalyzer {
    private warehouse: AnalyticsDataWarehouse;
    private profileManager: ProfileManager;

    constructor(warehouse: AnalyticsDataWarehouse, profileManager: ProfileManager) {
        this.warehouse = warehouse;
        this.profileManager = profileManager;
    }

    public async getOSDistribution(): Promise<DistributionMetric[]> {
        const profiles = await this.profileManager.getAllProfiles();
        const fullProfiles = await Promise.all(profiles.map(p => this.profileManager.getProfile(p.id)));

        const counts: Record<string, number> = {};
        let total = 0;

        for (const p of fullProfiles) {
            if (p && p.fingerprint) {
                const os = p.fingerprint.hardware.os;
                counts[os] = (counts[os] || 0) + 1;
                total++;
            }
        }

        const metrics: DistributionMetric[] = [];
        for (const [os, count] of Object.entries(counts)) {
            metrics.push({
                label: os,
                count: count,
                percentage: total > 0 ? (count / total) * 100 : 0
            });
        }

        return metrics.sort((a, b) => b.count - a.count);
    }
}
