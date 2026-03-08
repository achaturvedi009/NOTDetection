import { Profile } from '../profile/models';
import { BrowserSessionController } from '../automation/session';
import { ThreatClassifier } from './threat-classifier';
import { FingerprintGenerator } from '../fingerprint/generator';

export class SelfHealingActionEngine {

    /**
     * Periodically called during a session (or post-session) to assess threat levels
     * and apply autonomous mitigations if necessary.
     */
    public static async evaluateAndHeal(profile: Profile, session?: BrowserSessionController): Promise<boolean> {
        ThreatClassifier.classifyThreat(profile);

        const level = profile.health.threatLevel;

        if (level === 'low') {
            return true; // Healthy
        }

        console.log(`[SelfHealing] Profile ${profile.id} is at ${level.toUpperCase()} risk. Executing mitigation strategies...`);

        if (level === 'moderate') {
            this.applyBehavioralCorrection(profile, session);
        } else if (level === 'high') {
            this.applyFingerprintRebalance(profile);
            this.penalizeProxyReputation(profile);
            this.applyBehavioralCorrection(profile, session);
        } else if (level === 'critical') {
            console.error(`[SelfHealing] Profile ${profile.id} is burned. Triggering full reset & proxy rotation.`);
            this.rotateProxy(profile);
            this.applyFingerprintRebalance(profile);

            // If we're mid-session, we might need to abort the task.
            if (session) {
                // In a real system, you'd throw an AbortError to halt the task engine gracefully
                console.warn(`[SelfHealing] Active session detected during critical healing. Automation workflow should be paused.`);
            }
        }

        // Re-evaluate after healing
        profile.health.anomalyCount = 0; // Reset anomalies post-heal
        ThreatClassifier.classifyThreat(profile);

        return true;
    }

    private static applyBehavioralCorrection(profile: Profile, session?: BrowserSessionController): void {
        console.log(`[SelfHealing] Adjusting Behavioral Entropy to be more conservative...`);
        // Slow down typing, increase idle times
        profile.fingerprint.behavioral.typingSpeedBaseMs += 50;
        profile.fingerprint.behavioral.idleProbability = Math.min(0.9, profile.fingerprint.behavioral.idleProbability + 0.2);

        // If mid-session, apply immediately
        if (session) {
            session.behavior.config = profile.fingerprint.behavioral;
        }
    }

    private static applyFingerprintRebalance(profile: Profile): void {
        console.log(`[SelfHealing] Rebalancing deterministic noise seeds to shift canvas/webgl identity...`);
        // We do not change OS or Hardware (that would be impossible and flag us).
        // Instead, we slightly bump the noise seeds. This retains the exact same hardware template
        // but shifts the hashed output of Canvas and WebGL, shedding the previous ban fingerprint.
        profile.fingerprint.canvasNoiseSeed += 1000;
        profile.fingerprint.audioNoiseSeed += 1000;
        profile.health.flags.push('FINGERPRINT_REBALANCED');
    }

    private static penalizeProxyReputation(profile: Profile): void {
        console.log(`[SelfHealing] Degrading assigned proxy reputation...`);
        profile.health.proxyReputationScore = Math.max(0, profile.health.proxyReputationScore - 0.3);
    }

    private static rotateProxy(profile: Profile): void {
        console.log(`[SelfHealing] Rotating Proxy configuration...`);
        // In a live system, this would call out to a Proxy Pool API to checkout a new IP
        profile.health.proxyReputationScore = 1.0;
        profile.health.flags.push('PROXY_ROTATED');
    }
}
