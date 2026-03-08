import { Profile, ThreatLevel } from '../profile/models';

export class ThreatClassifier {

    /**
     * Dynamically computes the global risk score and assigns a Threat Level
     * based on detection events, proxy reputation, and lifecycle anomalies.
     */
    public static classifyThreat(profile: Profile): void {
        let baseScore = profile.health.riskScore;

        // Factor in active detections from current/past sessions
        const now = Date.now();
        const recentEvents = profile.health.recentDetections.filter(e =>
            now - new Date(e.timestamp).getTime() < 86400000 // Last 24 hours
        );

        let eventPenalty = 0;
        recentEvents.forEach(e => {
            eventPenalty += e.severity;
        });

        // Decay penalty if events are older
        baseScore += (eventPenalty * 0.5);

        // Proxy reputation penalty
        if (profile.health.proxyReputationScore < 0.5) {
            baseScore += 0.3;
        }

        // Clamp between 0 and 1
        baseScore = Math.max(0, Math.min(baseScore, 1.0));
        profile.health.riskScore = baseScore;

        // Assign Threat Level
        profile.health.threatLevel = this.calculateLevel(baseScore);
    }

    private static calculateLevel(score: number): ThreatLevel {
        if (score < 0.3) return 'low';
        if (score < 0.6) return 'moderate';
        if (score < 0.8) return 'high';
        return 'critical';
    }
}
