import { DNSConfig } from './models';

export class DNSProtectionLayer {
    public static buildChromiumFlags(config: DNSConfig): string[] {
        const flags: string[] = [];

        if (config.dohEnabled) {
            // Force DNS-over-HTTPS natively
            flags.push('--enable-features=dns-over-https');
            flags.push(`--force-doh-server-url=${config.dohProviderUrl}`);
            flags.push('--doh-enabled');
        }

        if (config.bypassHostResolver) {
            // Disables the host OS DNS resolver. All lookups MUST run through Chromium/Proxy
            flags.push('--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1');
        }

        return flags;
    }
}
