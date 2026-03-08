import { ProfileManager } from '../profile/manager';
import { ProfilePerformanceAnalyzer } from './analyzers/performance';
import { AnalyticsDataWarehouse } from './warehouse';

export class RiskPredictionEngine {
    private warehouse: AnalyticsDataWarehouse;
    private profileManager: ProfileManager;
    private performanceAnalyzer: ProfilePerformanceAnalyzer;

    constructor(warehouse: AnalyticsDataWarehouse, profileManager: ProfileManager) {
        this.warehouse = warehouse;
        this.profileManager = profileManager;
        this.performanceAnalyzer = new ProfilePerformanceAnalyzer(warehouse);
    }

    /**
     * Periodically sweeps active profiles to predict and preempt detection bans
     * before the next session starts, creating a feedback loop into the SelfHealingActionEngine.
     */
    public async predictSystemRisks(): Promise<void> {
        console.log(`[Analytics] Running proactive Risk Prediction Engine...`);
        const profiles = await this.profileManager.getAllProfiles();

        for (const pMeta of profiles) {
            const metrics = await this.performanceAnalyzer.getMetrics(pMeta.id);

            // If the success rate dips severely across recent telemetry
            if (metrics.successRate < 50 && metrics.totalDetections > 5) {
                console.warn(`[Analytics] Predicted high risk for Profile ${pMeta.id} based on historical metrics.`);

                const profile = await this.profileManager.getProfile(pMeta.id);
                if (profile && profile.health.threatLevel !== 'critical') {
                    // Preemptively force a critical threat state to trigger proxy rotation & healing
                    // before the next automation script attempts to use it.
                    profile.health.threatLevel = 'critical';
                    profile.health.flags.push('ANALYTICS_PREDICTIVE_BURN');
                    await this.profileManager.updateProfile(profile);
                }
            }
        }
    }
}
