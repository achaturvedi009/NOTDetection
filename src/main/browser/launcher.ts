import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { Profile } from '../profile/models';

export class BrowserLauncher {
    private activeProcesses: Map<string, ChildProcess> = new Map();
    private profilesDir: string;

    constructor(userDataBasePath: string) {
        this.profilesDir = userDataBasePath;
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    public async launchProfile(profile: Profile, executablePath: string): Promise<void> {
        if (this.activeProcesses.has(profile.id)) {
            throw new Error(`Profile ${profile.id} is already running.`);
        }

        const userDataDir = path.join(this.profilesDir, profile.id);

        const args: string[] = [
            `--user-data-dir=${userDataDir}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-sync',
            '--disable-background-networking',
            // Fingerprint arguments map (Simulated setup)
            `--user-agent=${profile.fingerprint.userAgent}`
        ];

        // Assign proxy if configured and not 'direct'
        if (profile.proxy && profile.proxy.type !== 'direct') {
            if (profile.proxy.host && profile.proxy.port) {
                let proxyStr = `${profile.proxy.type}://${profile.proxy.host}:${profile.proxy.port}`;
                args.push(`--proxy-server=${proxyStr}`);
            }
        }

        const child = spawn(executablePath, args, { stdio: 'ignore' });

        this.activeProcesses.set(profile.id, child);

        child.on('exit', () => {
            this.activeProcesses.delete(profile.id);
            console.log(`Browser for profile ${profile.id} closed.`);
        });

        child.on('error', (err) => {
            console.error(`Error launching profile ${profile.id}:`, err);
            this.activeProcesses.delete(profile.id);
        });
    }

    public async stopProfile(id: string): Promise<void> {
        const child = this.activeProcesses.get(id);
        if (child) {
            child.kill();
            this.activeProcesses.delete(id);
        }
    }
}
