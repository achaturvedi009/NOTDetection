import { TLSConfig } from './models';

export class TLSController {
    public static buildChromiumFlags(config: TLSConfig): string[] {
        const flags: string[] = [];

        if (config.ja3SpoofingEnabled) {
            // These flags require the Custom C++ Chromium Fork
            // which patches BoringSSL to re-order ClientHello packets based on CLI arguments
            flags.push(`--tls-cipher-suites=${config.cipherSuites.join(',')}`);
            flags.push(`--tls-extensions=${config.extensions.join(',')}`);
            flags.push(`--tls-supported-groups=${config.supportedGroups.join(',')}`);
            flags.push(`--tls-signature-algorithms=${config.signatureAlgorithms.join(',')}`);
            flags.push(`--tls-alpn=${config.alpn.join(',')}`);

            // Native Chromium flags
            flags.push(`--ssl-version-min=${config.minVersion.replace('TLSv', 'tls')}`);
            flags.push(`--ssl-version-max=${config.maxVersion.replace('TLSv', 'tls')}`);
        }

        return flags;
    }
}
