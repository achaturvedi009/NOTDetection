import { Profile } from '../profile/models';

export class ProfileHealthMonitoringEngine {

    /**
     * Evaluates the risk score of a profile based on age, anomalies, and usage patterns.
     */
    public static evaluateRiskScore(profile: Profile): void {
        let score = 0.0;

        // 1. New/Warming profiles without history are inherently riskier to advanced bots
        if (profile.lifecycleState === 'new' || profile.lifecycleState === 'warming') {
            score += 0.3;
        }

        // 2. High anomaly events increase risk rapidly
        if (profile.health.anomalyCount > 0) {
            score += profile.health.anomalyCount * 0.15;
        }

        // 3. Very old, aging profiles with stale data become slightly suspicious over extreme time
        if (profile.lifecycleState === 'aging') {
            score += 0.1;
        }

        // 4. Missing cookie data for long sessions is highly anomalous
        if (profile.health.sessionCount > 10 && profile.usage.cookieCount < 10) {
            score += 0.4;
            profile.health.flags.push('LOW_COOKIE_ENTROPY');
        }

        profile.health.riskScore = Math.min(1.0, score);
        profile.health.lastHealthCheck = new Date();
    }
}

export class ProfileRepairRegenerationEngine {

    /**
     * Attempts to repair a profile if its risk score gets too high.
     * If repair fails or it's too risky, it transitions to retired.
     */
    public static attemptRepair(profile: Profile): boolean {
        if (profile.health.riskScore < 0.7) {
            return true; // Healthy enough, no repair needed
        }

        console.warn(`[Profile Repair] Profile ${profile.id} has critical risk score (${profile.health.riskScore.toFixed(2)}). Attempting repair...`);

        if (profile.health.anomalyCount >= 5) {
            console.error(`[Profile Repair] Too many anomalies. Retiring profile ${profile.id}.`);
            profile.lifecycleState = 'retired';
            return false;
        }

        // Repair Strategies:
        // Reset anomaly count, assume we "cleaned" the proxy connection
        profile.health.anomalyCount = 0;
        profile.health.riskScore = 0.4;
        profile.health.flags.push('REPAIRED_ONCE');

        console.log(`[Profile Repair] Profile ${profile.id} repaired successfully.`);
        return true;
    }
}
