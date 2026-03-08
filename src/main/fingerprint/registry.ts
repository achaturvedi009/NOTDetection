export interface DeviceRecord {
    profileId: string;
    templateId: string;
    seed: string;
    os: string;
    browser: string;
    gpu: string;
    resolution: string;
}

export class DeviceProfileRegistry {
    // In production, this would be backed by StorageLayer (SQLite)
    private records: Map<string, DeviceRecord> = new Map();

    public register(record: DeviceRecord): void {
        this.records.set(record.profileId, record);
    }

    public isSeedUnique(seed: string): boolean {
        for (const record of this.records.values()) {
            if (record.seed === seed) {
                return false;
            }
        }
        return true;
    }

    public getRecords(): DeviceRecord[] {
        return Array.from(this.records.values());
    }
}

// Global instance for orchestration layer
export const deviceRegistry = new DeviceProfileRegistry();
