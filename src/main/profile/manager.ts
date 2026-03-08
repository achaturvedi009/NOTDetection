import { v4 as uuidv4 } from 'uuid';
import { StorageLayer } from '../storage/database';
import { Profile, ProxyConfig, FingerprintConfig } from './models';
import { FingerprintGenerator } from '../fingerprint/generator';

export class ProfileManager {
    private storage: StorageLayer;

    constructor(storage: StorageLayer) {
        this.storage = storage;
    }

    public async createProfile(name: string, proxy?: ProxyConfig, fingerprint?: FingerprintConfig): Promise<Profile> {
        const id = uuidv4();

        // Default proxy if none provided
        const defaultProxy: ProxyConfig = proxy || { type: 'direct' };

        // Default advanced fingerprint using Phase 2 Generator if none provided
        const defaultFingerprint: FingerprintConfig = fingerprint || FingerprintGenerator.generateRealisticFingerprint();

        const newProfile: Profile = {
            id,
            name,
            createdAt: new Date(),
            proxy: defaultProxy,
            fingerprint: defaultFingerprint
        };

        await this.storage.insertProfile(id, name, newProfile);
        return newProfile;
    }

    public async getProfile(id: string): Promise<Profile | null> {
        const data = await this.storage.getProfile(id);
        if (!data) return null;

        // Parse date
        if (data.createdAt) {
            data.createdAt = new Date(data.createdAt);
        }

        return data as Profile;
    }

    public async getAllProfiles(): Promise<{id: string, name: string}[]> {
        return await this.storage.getAllProfiles();
    }

    public async deleteProfile(id: string): Promise<void> {
        await this.storage.deleteProfile(id);
    }
}
