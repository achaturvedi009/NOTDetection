export interface WebRTCConfig {
    mode: 'disabled' | 'proxy_routed' | 'simulated_local';
    fakeIp?: string;
}

export interface DNSConfig {
    dohEnabled: boolean;
    dohProviderUrl: string; // e.g., 'https://cloudflare-dns.com/dns-query'
    bypassHostResolver: boolean;
    isolatedCache: boolean;
}

export interface TLSConfig {
    ja3SpoofingEnabled: boolean;
    tlsProfile: 'chrome' | 'firefox' | 'safari' | 'edge';
    minVersion: 'TLSv1.2' | 'TLSv1.3';
    maxVersion: 'TLSv1.2' | 'TLSv1.3';
    cipherSuites: string[];
    extensions: string[];
    supportedGroups: string[];
    signatureAlgorithms: string[];
    alpn: string[];
}

export interface HTTP2Config {
    enabled: boolean;
    settingsOrdering: string[];
    headerCompression: 'hpack';
    priorityFramesEnabled: boolean;
}

export interface QUICConfig {
    enabled: boolean;
    maxStreamData: number;
    initialFlowControlWindow: number;
    congestionControl: 'cubic' | 'bbr';
}

export interface TCPIPConfig {
    tcpWindowSize: number;
    ttl: number;
    tcpTimestamp: boolean;
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

export interface NetworkIdentityTemplate {
    browserVersion: string;
    os: string;
    tls: TLSConfig;
    http2: HTTP2Config;
    quic: QUICConfig;
    tcpip: TCPIPConfig;
}

export interface NetworkConfig {
    webrtc: WebRTCConfig;
    dns: DNSConfig;
    proxy: AdvancedProxyConfig;
    identityTemplate: NetworkIdentityTemplate;
}
