import { FontPack, AudioProfile, NetworkIdentityProfile } from './models';

export const FONT_PACKS: Record<string, FontPack> = {
    'windows_default': {
        id: 'windows_default',
        osFamilies: ['Windows 10', 'Windows 11'],
        fonts: ['Segoe UI', 'Arial', 'Times New Roman', 'Calibri', 'Consolas', 'Comic Sans MS']
    },
    'macos_default': {
        id: 'macos_default',
        osFamilies: ['macOS Ventura', 'macOS Sonoma', 'iOS 16', 'iOS 17'],
        fonts: ['San Francisco', 'Helvetica Neue', 'Menlo', 'Courier', 'Arial', 'Times']
    },
    'linux_default': {
        id: 'linux_default',
        osFamilies: ['Linux'],
        fonts: ['DejaVu Sans', 'Liberation Sans', 'Ubuntu Font', 'FreeSerif']
    },
    'android_default': {
        id: 'android_default',
        osFamilies: ['Android 13', 'Android 14'],
        fonts: ['Roboto', 'Noto Sans', 'Droid Sans']
    }
};

export const AUDIO_PROFILES: Record<string, AudioProfile> = {
    'standard_desktop': {
        id: 'standard_desktop',
        sampleRate: 48000,
        maxChannelCount: 2,
        numberOfInputs: 1,
        numberOfOutputs: 1
    },
    'mac_high_res': {
        id: 'mac_high_res',
        sampleRate: 44100,
        maxChannelCount: 2,
        numberOfInputs: 1,
        numberOfOutputs: 2
    },
    'mobile_standard': {
        id: 'mobile_standard',
        sampleRate: 48000,
        maxChannelCount: 2,
        numberOfInputs: 2, // e.g., front/back mic
        numberOfOutputs: 1
    }
};

export const NETWORK_PROFILES: Record<string, NetworkIdentityProfile> = {
    'broadband_wired': {
        id: 'broadband_wired',
        connectionType: 'ethernet',
        effectiveType: 'broadband',
        latencyDistributionMs: [5, 30],
        bandwidthProfileMbps: 500
    },
    'wifi_standard': {
        id: 'wifi_standard',
        connectionType: 'wifi',
        effectiveType: 'broadband',
        latencyDistributionMs: [15, 60],
        bandwidthProfileMbps: 100
    },
    'mobile_5g': {
        id: 'mobile_5g',
        connectionType: 'cellular',
        effectiveType: '5g',
        latencyDistributionMs: [20, 50],
        bandwidthProfileMbps: 150
    },
    'mobile_4g': {
        id: 'mobile_4g',
        connectionType: 'cellular',
        effectiveType: '4g',
        latencyDistributionMs: [40, 120],
        bandwidthProfileMbps: 25
    }
};
