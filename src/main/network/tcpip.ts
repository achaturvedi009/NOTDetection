import { TCPIPConfig } from './models';

export class TCPIPController {
    public static buildChromiumFlags(config: TCPIPConfig): string[] {
        const flags: string[] = [];

        // These flags require the Custom C++ Chromium Fork
        // which patches the host TCP socket configurations natively using setsockopt
        // on Linux/macOS or similar API hooks on Windows
        flags.push(`--tcp-window-size=${config.tcpWindowSize}`);
        flags.push(`--tcp-ttl=${config.ttl}`);
        flags.push(`--tcp-timestamp=${config.tcpTimestamp}`);

        return flags;
    }
}
