export type DeviceCategory = 'desktop' | 'laptop' | 'mobile';
export type OperatingSystem = 'Windows 10' | 'Windows 11' | 'macOS Ventura' | 'macOS Sonoma' | 'Linux' | 'Android 13' | 'Android 14' | 'iOS 16' | 'iOS 17';
export type BrowserFamily = 'Chrome' | 'Firefox' | 'Safari';

export interface FontPack {
    id: string;
    osFamilies: string[];
    fonts: string[];
}

export interface WebGLParameterProfile {
    id: string;
    maxTextureSize: number;
    maxViewportDims: number[];
    maxRenderbufferSize: number;
    shaderPrecisionValues: Record<string, string>;
    supportedExtensions: string[];
}

export interface GPURendererProfile {
    vendorId: string;
    vendorString: string;
    rendererString: string;
    compatibleOS: OperatingSystem[];
    webglProfileId: string;
    marketShareWeight: number; // 0.0 to 1.0
}

export interface AudioProfile {
    id: string;
    sampleRate: number;
    maxChannelCount: number;
    numberOfInputs: number;
    numberOfOutputs: number;
}

export interface NetworkIdentityProfile {
    id: string;
    connectionType: 'wifi' | 'ethernet' | 'cellular';
    effectiveType: '4g' | '5g' | 'broadband';
    latencyDistributionMs: [number, number]; // [min, max]
    bandwidthProfileMbps: number;
}

export interface DeviceIdentityTemplate {
    deviceId: string;
    category: DeviceCategory;
    os: OperatingSystem;
    osVersion: string;
    browserFamily: BrowserFamily;
    browserVersionRange: string[];
    cpuArchitecture: 'x86_64' | 'arm64' | 'armv8l';
    cpuCoreCount: number[];
    memorySizeGB: number[];
    screenResolutions: { width: number, height: number, pixelRatio: number }[];
    colorDepth: number;
    fontPackId: string;
    audioProfileId: string;
    networkProfileId: string;
    marketShareWeight: number;
}
