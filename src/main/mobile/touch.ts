import { Page } from 'puppeteer-core';
import { BehavioralConfig } from '../profile/models';

export class TouchSimulationEngine {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Synthesize human tap interactions. Dispatches TouchStart, TouchEnd natively via CDP.
     */
    public async tap(x: number, y: number): Promise<void> {
        const cdp = await this.page.target().createCDPSession();

        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x, y }]
        });

        // Tap duration (short)
        await new Promise(r => setTimeout(r, 50 + Math.random() * 50));

        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: []
        });
    }

    public async longPress(x: number, y: number): Promise<void> {
        const cdp = await this.page.target().createCDPSession();

        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x, y }]
        });

        // Long press duration
        await new Promise(r => setTimeout(r, 600 + Math.random() * 200));

        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: []
        });
    }
}
