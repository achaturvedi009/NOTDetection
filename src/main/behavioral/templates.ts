import { BehavioralConfig } from '../profile/models';

export class BehavioralTemplates {
    public static readonly TEMPLATES: Record<string, BehavioralConfig> = {
        casual: {
            archetype: 'casual',
            typingSpeedBaseMs: 120,    // Average typist
            typingVarianceMs: 60,      // High variance, pausing to read
            scrollInertiaMultiplier: 1.2, // Relaxed scrolling
            mouseJitterStrength: 3,    // Minor corrections
            mouseCurveDeviation: 40,   // Wide sweeping curves
            idleProbability: 0.3,      // 30% chance to idle after interaction
            maxIdleDurationMs: 15000,  // Up to 15s idle
            sessionDurationTargetMs: 600000 // 10 minutes
        },
        researcher: {
            archetype: 'researcher',
            typingSpeedBaseMs: 90,     // Faster typing
            typingVarianceMs: 40,      // Consistent speed
            scrollInertiaMultiplier: 0.8, // Focused, rapid scrolling
            mouseJitterStrength: 1,    // Precise movements
            mouseCurveDeviation: 15,   // More direct paths
            idleProbability: 0.5,      // 50% chance to pause to read heavily
            maxIdleDurationMs: 45000,  // Up to 45s reading pauses
            sessionDurationTargetMs: 1800000 // 30 minutes
        },
        fast: {
            archetype: 'fast',
            typingSpeedBaseMs: 60,     // Very fast, burst typing
            typingVarianceMs: 20,      // Highly consistent
            scrollInertiaMultiplier: 0.5, // Aggressive scroll
            mouseJitterStrength: 5,    // High jitter due to speed
            mouseCurveDeviation: 10,   // Almost straight lines
            idleProbability: 0.1,      // Rarely idles
            maxIdleDurationMs: 5000,   // Max 5s pause
            sessionDurationTargetMs: 300000 // 5 minutes
        },
        mobile: {
            archetype: 'mobile',
            typingSpeedBaseMs: 200,    // Thumbs typing is slower
            typingVarianceMs: 100,     // Very high variance
            scrollInertiaMultiplier: 2.0, // Thumb flick momentum
            mouseJitterStrength: 0,    // No "mouse" jitter, instant taps
            mouseCurveDeviation: 0,    // Not applicable for touch jumps
            idleProbability: 0.4,
            maxIdleDurationMs: 20000,
            sessionDurationTargetMs: 400000 // ~7 minutes
        }
    };

    /**
     * Deterministically select a behavioral template based on the profile seed.
     */
    public static getDeterministicBehavior(seedInt: number): BehavioralConfig {
        const keys = Object.keys(this.TEMPLATES);
        const index = seedInt % keys.length;
        const base = this.TEMPLATES[keys[index]];

        // Apply micro-entropy to baseline configuration to prevent perfectly identical bots
        return {
            ...base,
            typingSpeedBaseMs: base.typingSpeedBaseMs + (seedInt % 20) - 10,
            scrollInertiaMultiplier: base.scrollInertiaMultiplier + ((seedInt % 10) / 100)
        };
    }
}
