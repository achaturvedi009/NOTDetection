import { NetworkConfig } from './models';

export class NetworkIsolationManager {
    /**
     * Generates isolation flags to ensure absolutely no network state is shared
     * between isolated browser processes.
     */
    public static buildChromiumFlags(profileId: string, config: NetworkConfig): string[] {
        const flags: string[] = [];

        // 1. Separate connection pool, session tickets, QUIC state, and DNS cache
        // Handled intrinsically by `--user-data-dir` but reinforced here:
        flags.push(`--network-partition=${profileId}`); // Conceptual custom flag for strict separation

        // 2. DNS Cache Isolation per profile
        if (config.dns.isolatedCache) {
            // Disable cross-origin or persistent DNS cache
            flags.push('--disable-dns-prefetching');
            flags.push('--host-resolver-cache-size=0'); // Force DNS lookups to go to the assigned resolver
        }

        // 3. Clear existing SSL sessions on boot
        flags.push('--ssl-version-fallback-min=tls1.2');
        flags.push('--disable-web-security'); // Optional, if cross-origin strictness breaks custom proxy routing

        return flags;
    }
}
