import { Profile } from '../profile/models';

export class ProfileAgingSimulationEngine {

    /**
     * Simulates natural data accumulation that happens over the course of a session.
     * Prevents profiles from looking like empty, pristine synthetic environments.
     */
    public static simulateSessionAging(profile: Profile, sessionDurationMs: number): void {
        profile.health.sessionCount += 1;
        profile.usage.totalSessionTimeMs += sessionDurationMs;

        // Simulate natural history and cookie growth during active use
        const pagesVisited = Math.floor(sessionDurationMs / 60000) * (Math.random() * 3 + 1); // 1-3 pages per minute
        profile.usage.historyCount += pagesVisited;

        // Assume ~4 cookies per page visited
        profile.usage.cookieCount += Math.floor(pagesVisited * (Math.random() * 2 + 3));

        // Simulate cache size growth (Assume 500kb - 2MB per page)
        const cacheGrowth = pagesVisited * (Math.random() * 1500000 + 500000);
        profile.usage.cacheSizeBytes += cacheGrowth;
    }
}
