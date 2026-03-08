import { QUICConfig } from './models';

export class QUICController {
    public static buildChromiumFlags(config: QUICConfig): string[] {
        const flags: string[] = [];

        if (!config.enabled) {
            flags.push('--disable-quic');
        } else {
            // These flags require the Custom C++ Chromium Fork
            // Modifies QUIC parameter negotiation
            flags.push('--enable-quic');
            flags.push(`--quic-max-stream-data=${config.maxStreamData}`);
            flags.push(`--quic-initial-flow-control-window=${config.initialFlowControlWindow}`);
            flags.push(`--quic-congestion-control=${config.congestionControl}`);
        }

        return flags;
    }
}
