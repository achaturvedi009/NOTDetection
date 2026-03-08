import { Page } from 'puppeteer-core';
import { MobileDeviceConfig } from '../profile/models';

export class MobileNetworkSimulator {
    /**
     * Emulates realistic mobile network throttling using CDP Emulation API
     */
    public static async applyNetworkConditions(page: Page, network: MobileDeviceConfig['network']): Promise<void> {
        const cdp = await page.target().createCDPSession();

        if (network.connectionType === 'none') {
            await cdp.send('Network.emulateNetworkConditions', {
                offline: true,
                latency: 0,
                downloadThroughput: 0,
                uploadThroughput: 0
            });
            return;
        }

        let latency = 0;
        let download = -1; // -1 means no throttling
        let upload = -1;

        switch (network.effectiveType) {
            case 'slow-2g':
                latency = 500; download = 50 * 1024 / 8; upload = 20 * 1024 / 8; break;
            case '2g':
                latency = 300; download = 250 * 1024 / 8; upload = 50 * 1024 / 8; break;
            case '3g':
                latency = 100; download = 750 * 1024 / 8; upload = 250 * 1024 / 8; break;
            case '4g':
                latency = 20; download = 4 * 1024 * 1024 / 8; upload = 3 * 1024 * 1024 / 8; break;
            case '5g':
                latency = 5; download = 20 * 1024 * 1024 / 8; upload = 10 * 1024 * 1024 / 8; break;
        }

        // Apply slight randomized noise to the baseline values to simulate realistic cellular jitter
        latency += Math.floor(Math.random() * (latency * 0.2));

        await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: latency,
            downloadThroughput: download,
            uploadThroughput: upload,
            connectionType: network.connectionType === 'wifi' ? 'wifi' : 'cellular4g'
        });
    }
}
