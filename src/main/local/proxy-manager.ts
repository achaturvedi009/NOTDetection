import { spawn } from 'child_process';
import { AdvancedProxyConfig } from '../network/models';

export class LocalProxyManager {

    /**
     * Conducts a local latency test to the proxy host using native OS ping.
     * Operates completely offline without reaching out to external IP/Geo APIs.
     */
    public static async testProxyLatency(config: AdvancedProxyConfig): Promise<number> {
        if (!config.host || config.type === 'direct') return 0;

        return new Promise((resolve) => {
            const isWin = process.platform === 'win32';

            const cmd = 'ping';
            const args = isWin ? ['-n', '1', config.host!] : ['-c', '1', config.host!];

            const startTime = Date.now();

            // Use spawn with argument arrays to prevent OS Command Injection vulnerabilities
            const pingProcess = spawn(cmd, args);

            pingProcess.on('close', (code) => {
                if (code !== 0) {
                    console.warn(`[LocalProxyManager] Proxy ${config.host} is unreachable via ICMP.`);
                    resolve(-1); // Unreachable or ping blocked
                } else {
                    const latency = Date.now() - startTime;
                    resolve(latency);
                }
            });

            pingProcess.on('error', () => {
                console.warn(`[LocalProxyManager] Failed to spawn ping process.`);
                resolve(-1);
            });
        });
    }

    /**
     * Locally estimates GeoLocation based on the profile's provided timezone
     * rather than querying external APIs (which violates offline constraints).
     */
    public static estimateGeoFromTimezone(timezone: string): { lat: number, lon: number, accuracy: number } {
        // Fallback static map for purely offline, local inference.
        // In a full enterprise offline db, this would query a local MaxMind/GeoIP SQLite database.
        const geoMap: Record<string, {lat: number, lon: number}> = {
            'America/New_York': { lat: 40.7128, lon: -74.0060 },
            'America/Los_Angeles': { lat: 34.0522, lon: -118.2437 },
            'Europe/London': { lat: 51.5074, lon: -0.1278 },
            'Asia/Tokyo': { lat: 35.6762, lon: 139.6503 }
        };

        const loc = geoMap[timezone] || { lat: 0, lon: 0 };
        return {
            lat: loc.lat,
            lon: loc.lon,
            accuracy: 1000 // meters
        };
    }
}
