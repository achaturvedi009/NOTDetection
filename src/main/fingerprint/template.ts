export interface DeviceTemplate {
    id: string;
    os: 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS';
    osVersionRange: string[];
    platform: string; // e.g., 'Win32', 'MacIntel'
    browser: 'Chrome' | 'Firefox' | 'Safari';
    browserVersionRange: string[];

    // Hardware Constraints
    cpuCores: number[];
    ramGB: number[];

    // Graphics Constraints
    webglVendor: string; // e.g., 'Google Inc. (NVIDIA)'
    webglRendererList: string[]; // e.g., ['ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)']

    // Screen Constraints
    screenResolutions: { width: number, height: number, pixelRatio: number }[];

    // Font Families typical to the OS
    baseFonts: string[];

    // Mobile specific
    isMobile?: boolean;
    manufacturer?: string;
    modelNames?: string[];
    mobileNetworkModes?: string[];
}

export const DEVICE_TEMPLATES: DeviceTemplate[] = [
    {
        id: 'win11_chrome_nvidia',
        os: 'Windows',
        osVersionRange: ['10.0'], // Windows 11 uses NT 10.0
        platform: 'Win32',
        browser: 'Chrome',
        browserVersionRange: ['114.0.5735.199', '115.0.5790.170', '116.0.5845.96'],
        cpuCores: [8, 12, 16],
        ramGB: [16, 32],
        webglVendor: 'Google Inc. (NVIDIA)',
        webglRendererList: [
            'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)'
        ],
        screenResolutions: [
            { width: 1920, height: 1080, pixelRatio: 1 },
            { width: 2560, height: 1440, pixelRatio: 1 }
        ],
        baseFonts: ['Arial', 'Calibri', 'Consolas', 'Segoe UI', 'Times New Roman']
    },
    {
        id: 'mac_ventura_chrome_apple',
        os: 'macOS',
        osVersionRange: ['10_15_7'], // Big Sur+ keeps 10_15_7 for compat
        platform: 'MacIntel', // Safari on M1 still reports MacIntel
        browser: 'Chrome',
        browserVersionRange: ['114.0.5735.198', '115.0.5790.170', '116.0.5845.96', '120.0.6099.129'],
        cpuCores: [8, 10, 12, 16],
        ramGB: [8, 16, 32, 64],
        webglVendor: 'Google Inc. (Apple)',
        webglRendererList: [
            'ANGLE (Apple, Apple M1, OpenGL 4.1)',
            'ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)',
            'ANGLE (Apple, Apple M1 Max, OpenGL 4.1)',
            'ANGLE (Apple, Apple M2, OpenGL 4.1)',
            'ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)',
            'ANGLE (Apple, Apple M3, OpenGL 4.1)',
            'ANGLE (Apple, Apple M3 Max, OpenGL 4.1)'
        ],
        screenResolutions: [
            { width: 1440, height: 900, pixelRatio: 2 },
            { width: 1512, height: 982, pixelRatio: 2 }, // 14" MBP
            { width: 1728, height: 1117, pixelRatio: 2 }, // 16" MBP
            { width: 2560, height: 1440, pixelRatio: 1 } // External Non-Retina Monitor
        ],
        baseFonts: ['Helvetica', 'San Francisco', 'Monaco', 'Times']
    },
    {
        id: 'win10_chrome_intel',
        os: 'Windows',
        osVersionRange: ['10.0'], // Windows 10
        platform: 'Win32',
        browser: 'Chrome',
        browserVersionRange: ['118.0.5993.118', '119.0.6045.160', '120.0.6099.225'],
        cpuCores: [4, 6, 8],
        ramGB: [8, 16],
        webglVendor: 'Google Inc. (Intel)',
        webglRendererList: [
            'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
            'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
        ],
        screenResolutions: [
            { width: 1366, height: 768, pixelRatio: 1 },
            { width: 1920, height: 1080, pixelRatio: 1 }
        ],
        baseFonts: ['Arial', 'Calibri', 'Consolas', 'Segoe UI', 'Times New Roman']
    },
    {
        id: 'linux_ubuntu_chrome_mesa',
        os: 'Linux',
        osVersionRange: ['x86_64'],
        platform: 'Linux x86_64',
        browser: 'Chrome',
        browserVersionRange: ['114.0.5735.198', '115.0.5790.170'],
        cpuCores: [4, 8, 16],
        ramGB: [8, 16, 32],
        webglVendor: 'Google Inc. (Intel)',
        webglRendererList: [
            'ANGLE (Intel, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL 4.6)'
        ],
        screenResolutions: [
            { width: 1920, height: 1080, pixelRatio: 1 }
        ],
        baseFonts: ['Ubuntu', 'Liberation Sans', 'DejaVu Sans']
    },
    {
        id: 'android14_pixel8_chrome',
        os: 'Android',
        osVersionRange: ['14'],
        platform: 'Linux armv8l',
        browser: 'Chrome',
        browserVersionRange: ['114.0.5735.196', '115.0.5790.136'],
        cpuCores: [8],
        ramGB: [8],
        webglVendor: 'Google Inc. (ARM)',
        webglRendererList: [
            'ANGLE (ARM, Mali-G715, OpenGL ES 3.2)'
        ],
        screenResolutions: [
            { width: 412, height: 915, pixelRatio: 2.625 }
        ],
        baseFonts: ['Roboto', 'Noto Sans'],
        isMobile: true,
        manufacturer: 'Google',
        modelNames: ['Pixel 8', 'Pixel 8 Pro'],
        mobileNetworkModes: ['5g', '4g', 'wifi']
    },
    {
        id: 'ios17_iphone14pro_safari',
        os: 'iOS',
        osVersionRange: ['17_0_1', '17_1'],
        platform: 'iPhone',
        browser: 'Safari',
        browserVersionRange: ['17.0', '17.1'],
        cpuCores: [6], // A16 Bionic
        ramGB: [6],
        webglVendor: 'Apple Inc.',
        webglRendererList: [
            'Apple A16 GPU'
        ],
        screenResolutions: [
            { width: 393, height: 852, pixelRatio: 3 }
        ],
        baseFonts: ['San Francisco', 'Helvetica Neue'],
        isMobile: true,
        manufacturer: 'Apple',
        modelNames: ['iPhone 14 Pro'],
        mobileNetworkModes: ['5g', '4g', 'wifi']
    }
];
