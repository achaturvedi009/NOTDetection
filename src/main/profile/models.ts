export interface ProxyConfig {
    type: 'http' | 'https' | 'socks4' | 'socks5' | 'direct';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
}

export interface FingerprintConfig {
    userAgent: string;
    canvasNoiseSeed?: number;
    webglVendor?: string;
    webglRenderer?: string;
    audioNoiseSeed?: number;
    hardwareConcurrency?: number;
    deviceMemory?: number;
    platform?: string;
    timezone?: string;
    language?: string;
    screenResolution?: { width: number, height: number };
}

export interface Profile {
    id: string;
    name: string;
    createdAt: Date;
    proxy: ProxyConfig;
    fingerprint: FingerprintConfig;
}
