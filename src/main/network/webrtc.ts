import { WebRTCConfig } from './models';

export class WebRTCProtectionLayer {
    public static buildChromiumFlags(config: WebRTCConfig): string[] {
        const flags: string[] = [];

        switch (config.mode) {
            case 'disabled':
                flags.push('--webrtc-ip-handling-policy=disable_non_proxied_udp');
                break;
            case 'proxy_routed':
                // Only uses the proxy interface for ICE candidates
                flags.push('--webrtc-ip-handling-policy=default_public_interface_only');
                flags.push('--enforce-webrtc-ip-permission-check');
                break;
            case 'simulated_local':
                flags.push('--webrtc-ip-handling-policy=default');
                // The C++ Fork reads this flag and injects the fake IP into local candidates
                if (config.fakeIp) {
                    flags.push(`--webrtc-fake-ip=${config.fakeIp}`);
                }
                break;
        }

        // Prevent MDNS leaks
        flags.push('--disable-webrtc-hw-decoding');
        flags.push('--disable-webrtc-hw-encoding');
        flags.push('--disable-features=WebRtcHideLocalIpsWithMdns');

        return flags;
    }
}
