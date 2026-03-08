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
    // Mobile Emulation
    isMobile: boolean;
    hasTouch: boolean;
    orientation: 'portrait-primary' | 'landscape-primary';
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

export interface SensorConfig {
    hasAccelerometer: boolean;
    hasGyroscope: boolean;
    hasAmbientLight: boolean;
    hasProximity: boolean;
    // Initial static values representing device resting on a desk
    alpha: number;
    beta: number;
    gamma: number;
    accelX: number;
    accelY: number;
    accelZ: number;
}

export interface BatteryConfig {
    charging: boolean;
    level: number;
    chargingTime: number;
    dischargingTime: number;
}

export interface MobileNetworkConfig {
    connectionType: 'wifi' | 'cellular' | 'bluetooth' | 'ethernet' | 'none';
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | '5g';
    rtt: number;
    downlink: number;
}

export interface MobileDeviceConfig {
    manufacturer: string;
    model: string;
    battery: BatteryConfig;
    network: MobileNetworkConfig;
}

export interface BehavioralConfig {
    archetype: 'casual' | 'researcher' | 'fast' | 'mobile';
    typingSpeedBaseMs: number;
    typingVarianceMs: number;
    scrollInertiaMultiplier: number;
    mouseJitterStrength: number;
    mouseCurveDeviation: number; // For Bezier curve control points
    idleProbability: number;
    maxIdleDurationMs: number;
    sessionDurationTargetMs: number;
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
    sensors?: SensorConfig;
    mobile?: MobileDeviceConfig;
    behavioral: BehavioralConfig;
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
