export interface WebRTCConfig {
    mode: 'disabled' | 'fake_ip' | 'proxy_routed';
    fakeIp?: string;
}

export interface DNSConfig {
    dohEnabled: boolean;
    dohProviderUrl: string; // e.g., 'https://cloudflare-dns.com/dns-query'
}

export interface TLSConfig {
    ja3SpoofingEnabled: boolean;
    tlsProfile: 'chrome' | 'firefox' | 'safari' | 'edge';
    minVersion: 'TLSv1.2' | 'TLSv1.3';
}

export interface AdvancedProxyConfig {
    type: 'http' | 'https' | 'socks4' | 'socks5' | 'direct';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    rotationIntervalMs?: number; // Auto-rotate IP functionality
    geolocation?: { lat: number, lon: number, accuracy: number };
}

export interface NetworkConfig {
    webrtc: WebRTCConfig;
    dns: DNSConfig;
    tls: TLSConfig;
    proxy: AdvancedProxyConfig;
}
