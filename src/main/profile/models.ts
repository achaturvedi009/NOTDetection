export interface ProxyConfig {
    type: 'http' | 'https' | 'socks4' | 'socks5' | 'direct';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
}

export interface ScreenConfig {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
}

export interface WebGLConfig {
    vendor: string;
    renderer: string;
    unmaskedVendor: string;
    unmaskedRenderer: string;
    noiseSeed: number;
}

export interface HardwareConfig {
    hardwareConcurrency: number;
    deviceMemory: number;
    platform: string;
    os: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
}

export interface MediaDeviceConfig {
    videoInputs: number;
    audioInputs: number;
    audioOutputs: number;
    deviceIds: string[];
}

export interface FingerprintConfig {
    userAgent: string;
    language: string;
    languages: string[];
    timezone: string;
    timezoneOffset: number;
    doNotTrack: boolean;
    hardware: HardwareConfig;
    screen: ScreenConfig;
    webgl: WebGLConfig;
    media: MediaDeviceConfig;
    canvasNoiseSeed: number;
    audioNoiseSeed: number;
    fontMaskSeed: number;
}

export interface Profile {
    id: string;
    name: string;
    createdAt: Date;
    proxy: ProxyConfig;
    fingerprint: FingerprintConfig;
}
