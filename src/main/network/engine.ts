import { NetworkConfig } from './models';
import { TLSController } from './tls';
import { HTTP2Controller } from './http2';
import { QUICController } from './quic';
import { TCPIPController } from './tcpip';
import { WebRTCProtectionLayer } from './webrtc';
import { DNSProtectionLayer } from './dns';
import { ProxyEnforcementEngine } from './proxy';
import { NetworkIsolationManager } from './isolation';

export class NetworkIdentityEngine {

    /**
     * Builds the complete array of command line arguments for the Custom Chromium fork
     * to enforce the selected network identity and prevent all IP/DNS leaks.
     */
    public static compileNetworkFlags(profileId: string, config: NetworkConfig): string[] {
        const flags: string[] = [];

        // 1. Enforce Proxy Configuration
        flags.push(...ProxyEnforcementEngine.buildChromiumFlags(config.proxy));

        // 2. Configure TLS Handshake Profile
        flags.push(...TLSController.buildChromiumFlags(config.identityTemplate.tls));

        // 3. Configure HTTP/2 Behavior
        flags.push(...HTTP2Controller.buildChromiumFlags(config.identityTemplate.http2));

        // 4. Configure QUIC Transport Configuration
        flags.push(...QUICController.buildChromiumFlags(config.identityTemplate.quic));

        // 5. Configure TCP/IP Characteristics
        flags.push(...TCPIPController.buildChromiumFlags(config.identityTemplate.tcpip));

        // 6. Enforce WebRTC IP Protection
        flags.push(...WebRTCProtectionLayer.buildChromiumFlags(config.webrtc));

        // 7. Enforce DNS Routing & DoH
        flags.push(...DNSProtectionLayer.buildChromiumFlags(config.dns));

        // 8. Establish Strict Network Isolation
        flags.push(...NetworkIsolationManager.buildChromiumFlags(profileId, config));

        return flags;
    }
}
