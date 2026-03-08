import { Profile } from '../profile/models';

/**
 * Cloud compatibility stubs.
 * These interfaces ensure the architecture is ready for Phase 7 (Distributed Deployment)
 * while strictly remaining disabled and running through local adapters for Phase 6.
 */

export interface IProfileSync {
    syncUp(profile: Profile): Promise<void>;
    syncDown(profileId: string): Promise<Profile | null>;
}

export interface ITeamCollaboration {
    shareProfile(profileId: string, teamMemberId: string): Promise<void>;
    lockProfile(profileId: string): Promise<boolean>;
    unlockProfile(profileId: string): Promise<void>;
}

/**
 * Local-only implementation that satisfies the interfaces but strictly does nothing
 * to enforce the absolute "No Cloud Infrastructure" rule of the current phase.
 */
export class LocalOnlyAdapter implements IProfileSync, ITeamCollaboration {

    public async syncUp(profile: Profile): Promise<void> {
        console.debug(`[LocalAdapter] Sync up requested for ${profile.id}, but cloud is disabled. Ignoring.`);
        return Promise.resolve();
    }

    public async syncDown(profileId: string): Promise<Profile | null> {
        console.debug(`[LocalAdapter] Sync down requested for ${profileId}, but cloud is disabled. Returning null.`);
        return Promise.resolve(null);
    }

    public async shareProfile(profileId: string, teamMemberId: string): Promise<void> {
        throw new Error("Enterprise deployment is configured for 'Local Mode Only'. Profile sharing is disabled.");
    }

    public async lockProfile(profileId: string): Promise<boolean> {
        // In local mode, the profile is always "locked" to the current local OS user.
        return Promise.resolve(true);
    }

    public async unlockProfile(profileId: string): Promise<void> {
        return Promise.resolve();
    }
}
