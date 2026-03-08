import { Profile } from '../profile/models';
import { ProfileAgingSimulationEngine } from './aging';

export class ProfileLifecycleController {

    /**
     * Evaluates a profile's current age/usage and transitions it through
     * realistic lifecycle stages.
     */
    public static evaluateLifecycleTransition(profile: Profile): void {
        const { state, sessionCount, totalTime } = {
            state: profile.lifecycleState,
            sessionCount: profile.health.sessionCount,
            totalTime: profile.usage.totalSessionTimeMs
        };

        if (state === 'new' && sessionCount > 0) {
            profile.lifecycleState = 'warming';
            console.log(`[Lifecycle] Profile ${profile.id} transitioned to WARMING.`);
        }
        else if (state === 'warming' && sessionCount >= 5 && totalTime > 1800000) { // 5 sessions, >30 mins
            profile.lifecycleState = 'active';
            console.log(`[Lifecycle] Profile ${profile.id} transitioned to ACTIVE.`);
        }
        else if (state === 'active' && sessionCount >= 50) {
            profile.lifecycleState = 'mature';
            console.log(`[Lifecycle] Profile ${profile.id} transitioned to MATURE.`);
        }
        else if (state === 'mature' && sessionCount >= 150) {
            profile.lifecycleState = 'aging';
            console.log(`[Lifecycle] Profile ${profile.id} transitioned to AGING.`);
        }
        // Retirement is handled explicitly by the Health/Risk module
    }

    /**
     * Fired when a browser session is closed to log aging and evaluate transitions.
     */
    public static onSessionEnd(profile: Profile, sessionDurationMs: number): void {
        ProfileAgingSimulationEngine.simulateSessionAging(profile, sessionDurationMs);
        this.evaluateLifecycleTransition(profile);
    }
}
