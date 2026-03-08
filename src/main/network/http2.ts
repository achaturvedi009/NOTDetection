import { HTTP2Config } from './models';

export class HTTP2Controller {
    public static buildChromiumFlags(config: HTTP2Config): string[] {
        const flags: string[] = [];

        if (!config.enabled) {
            flags.push('--disable-http2');
        } else {
            // These flags require the Custom C++ Chromium Fork (nghttp2 patching)
            // It modifies SETTINGS frame ordering and priority frames.
            flags.push(`--http2-settings-order=${config.settingsOrdering.join(',')}`);
            flags.push(`--http2-header-compression=${config.headerCompression}`);
            flags.push(`--http2-priority-frames=${config.priorityFramesEnabled}`);
        }

        return flags;
    }
}
