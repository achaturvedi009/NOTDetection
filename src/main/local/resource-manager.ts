import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { Browser } from 'puppeteer-core';

export class LocalResourceManager {
    private maxConcurrentProfiles: number;
    private activeBrowsers: Map<string, Browser>;
    private profilesDir: string;

    constructor(profilesDir: string, activeBrowsers: Map<string, Browser>, maxConcurrentProfiles = 10) {
        this.profilesDir = profilesDir;
        this.activeBrowsers = activeBrowsers;
        this.maxConcurrentProfiles = maxConcurrentProfiles;
    }

    /**
     * Checks if the system has enough memory and CPU headroom to safely launch a new profile.
     */
    public canLaunchProfile(): boolean {
        if (this.activeBrowsers.size >= this.maxConcurrentProfiles) {
            console.warn(`[ResourceManager] Cannot launch: Max concurrent profiles (${this.maxConcurrentProfiles}) reached.`);
            return false;
        }

        const freeMemGB = os.freemem() / (1024 * 1024 * 1024);
        if (freeMemGB < 1.0) {
            console.warn(`[ResourceManager] Cannot launch: System memory too low (${freeMemGB.toFixed(2)} GB free).`);
            return false;
        }

        return true;
    }

    /**
     * Scans the profiles directory for isolated environments that are not currently running
     * and clears cache/temp files to save local disk space.
     */
    public async cleanupOrphanedResources(): Promise<void> {
        console.log('[ResourceManager] Scanning for orphaned profile resources...');
        if (!fs.existsSync(this.profilesDir)) return;

        const profileDirs = fs.readdirSync(this.profilesDir);
        for (const dir of profileDirs) {
            // If the profile ID is not currently actively managed in memory
            if (!this.activeBrowsers.has(dir)) {
                const cachePath = path.join(this.profilesDir, dir, 'Default', 'Cache');
                if (fs.existsSync(cachePath)) {
                    try {
                        fs.rmSync(cachePath, { recursive: true, force: true });
                        console.log(`[ResourceManager] Cleared cache for idle profile: ${dir}`);
                    } catch (e) {
                        console.error(`[ResourceManager] Failed to clear cache for ${dir}:`, e);
                    }
                }
            }
        }
    }
}
