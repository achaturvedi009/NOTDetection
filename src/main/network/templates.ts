import { NetworkIdentityTemplate } from './models';

/**
 * Registry mapping OS and Browser versions to specific network behavior templates.
 * In production, this matches exact packet patterns from Wireshark captures of real browsers.
 */
export class NetworkIdentityTemplateRegistry {
    private static templates: NetworkIdentityTemplate[] = [
        {
            browserVersion: '114.0', // Chrome 114
            os: 'Windows NT 10.0', // Windows 10/11
            tls: {
                ja3SpoofingEnabled: true,
                tlsProfile: 'chrome',
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
                cipherSuites: [
                    'TLS_AES_128_GCM_SHA256',
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
                    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
                    'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
                    'TLS_RSA_WITH_AES_128_GCM_SHA256',
                    'TLS_RSA_WITH_AES_256_GCM_SHA384'
                ],
                extensions: ['server_name', 'extended_master_secret', 'renegotiation_info', 'supported_groups', 'ec_point_formats', 'session_ticket', 'alpn', 'status_request', 'signature_algorithms', 'signed_certificate_timestamp', 'key_share', 'psk_key_exchange_modes', 'supported_versions', 'compress_certificate', 'application_settings'],
                supportedGroups: ['X25519', 'secp256r1', 'secp384r1'],
                signatureAlgorithms: ['ecdsa_secp256r1_sha256', 'rsa_pss_rsae_sha256', 'rsa_pkcs1_sha256'],
                alpn: ['h2', 'http/1.1']
            },
            http2: {
                enabled: true,
                settingsOrdering: ['HEADER_TABLE_SIZE', 'ENABLE_PUSH', 'MAX_CONCURRENT_STREAMS', 'INITIAL_WINDOW_SIZE', 'MAX_FRAME_SIZE', 'MAX_HEADER_LIST_SIZE'],
                headerCompression: 'hpack',
                priorityFramesEnabled: true
            },
            quic: {
                enabled: true,
                maxStreamData: 1048576,
                initialFlowControlWindow: 16777216,
                congestionControl: 'bbr'
            },
            tcpip: {
                tcpWindowSize: 65535,
                ttl: 128, // Windows default TTL
                tcpTimestamp: true
            }
        },
        {
            browserVersion: '114.0', // Chrome 114
            os: 'Mac OS X', // macOS
            tls: {
                ja3SpoofingEnabled: true,
                tlsProfile: 'chrome',
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
                cipherSuites: [
                    'TLS_AES_128_GCM_SHA256',
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
                    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256'
                ],
                extensions: ['server_name', 'extended_master_secret', 'renegotiation_info', 'supported_groups', 'ec_point_formats', 'session_ticket', 'alpn', 'status_request', 'signature_algorithms', 'signed_certificate_timestamp', 'key_share', 'psk_key_exchange_modes', 'supported_versions'],
                supportedGroups: ['X25519', 'secp256r1', 'secp384r1'],
                signatureAlgorithms: ['ecdsa_secp256r1_sha256', 'rsa_pss_rsae_sha256', 'rsa_pkcs1_sha256'],
                alpn: ['h2', 'http/1.1']
            },
            http2: {
                enabled: true,
                settingsOrdering: ['HEADER_TABLE_SIZE', 'ENABLE_PUSH', 'MAX_CONCURRENT_STREAMS', 'INITIAL_WINDOW_SIZE', 'MAX_FRAME_SIZE', 'MAX_HEADER_LIST_SIZE'],
                headerCompression: 'hpack',
                priorityFramesEnabled: true
            },
            quic: {
                enabled: true,
                maxStreamData: 1048576,
                initialFlowControlWindow: 16777216,
                congestionControl: 'bbr'
            },
            tcpip: {
                tcpWindowSize: 65535,
                ttl: 64, // macOS/Linux default TTL
                tcpTimestamp: true
            }
        }
    ];

    public static getTemplate(os: string, browserVersionStr: string): NetworkIdentityTemplate {
        // Fallback matching logic. In a real engine, this parses the major version exactly.
        const majorVersion = browserVersionStr.split('.')[0] + '.0';

        let template = this.templates.find(t => t.os.includes(os) && t.browserVersion === majorVersion);

        if (!template) {
            // Fallback to Windows/Chrome
            console.warn(`[Network Identity] Exact template not found for ${os} / ${majorVersion}. Using fallback.`);
            template = this.templates[0];
        }

        // Return a deep copy to prevent cross-profile mutation
        return JSON.parse(JSON.stringify(template));
    }
}
