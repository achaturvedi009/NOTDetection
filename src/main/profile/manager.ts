import { v4 as uuidv4 } from 'uuid';
import { StorageLayer } from '../storage/database';
import { Profile, ProxyConfig, FingerprintConfig } from './models';
import { FingerprintGenerator } from '../fingerprint/generator';
import { deviceRegistry } from '../fingerprint/registry';
import { ConsistencyValidator } from '../fingerprint/validator';

export class ProfileManager {
    private storage: StorageLayer;

    constructor(storage: StorageLayer) {
        this.storage = storage;
    }

    public async createProfile(name: string, proxy?: ProxyConfig, fingerprint?: FingerprintConfig): Promise<Profile> {
        const id = uuidv4();

        // Default proxy if none provided
        const defaultProxy: ProxyConfig = proxy || { type: 'direct' };

        // Default advanced fingerprint using Phase 2.5 Consistency Generator if none provided
        let defaultFingerprint: FingerprintConfig;
        if (fingerprint) {
            defaultFingerprint = fingerprint;
        } else {
            // Generate until we get a unique seed with good entropy
            let isUnique = false;
            let result;
            while (!isUnique) {
                result = FingerprintGenerator.generateConsistentFingerprint();
                if (deviceRegistry.isSeedUnique(result.seed) && ConsistencyValidator.calculateEntropyScore(result.config) > 0.5) {
                    isUnique = true;
                    defaultFingerprint = result.config;

                    // Register the fingerprint
                    deviceRegistry.register({
                        profileId: id,
                        templateId: result.templateId,
                        seed: result.seed,
                        os: result.config.hardware.os,
                        browser: result.config.hardware.browser,
                        gpu: result.config.webgl.unmaskedRenderer,
                        resolution: `${result.config.screen.width}x${result.config.screen.height}`
                    });
                }
            }
        }

        const newProfile: Profile = {
            id,
            name,
            createdAt: new Date(),
            proxy: defaultProxy,
            fingerprint: defaultFingerprint!,
            lifecycleState: 'new',
            health: {
                riskScore: 0.0,
                sessionCount: 0,
                anomalyCount: 0,
                lastHealthCheck: new Date(),
                flags: []
            },
            usage: {
                historyCount: 0,
                cookieCount: 0,
                cacheSizeBytes: 0,
                totalSessionTimeMs: 0
            }
        };

        await this.storage.insertProfile(id, name, newProfile);
        return newProfile;
    }

    public async bulkCreateProfiles(baseName: string, count: number): Promise<Profile[]> {
        const created: Profile[] = [];
        for (let i = 0; i < count; i++) {
            const profile = await this.createProfile(`${baseName} - ${i + 1}`);
            created.push(profile);
        }
        return created;
    }

    public async updateProfile(profile: Profile): Promise<void> {
        await this.storage.insertProfile(profile.id, profile.name, profile); // Overwrite in SQLite
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
