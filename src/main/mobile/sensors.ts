import { Page } from 'puppeteer-core';
import { SensorConfig } from '../profile/models';

export class MobileSensorEngine {
    private page: Page;
    private config: SensorConfig;
    private isRunning: boolean = false;

    constructor(page: Page, config: SensorConfig) {
        this.page = page;
        this.config = config;
    }

    /**
     * Emits DeviceOrientation and DeviceMotion events directly into the window context
     * periodically to simulate a device resting in a hand or on a desk.
     */
    public startSimulation(): void {
        this.isRunning = true;
        this.simulateSensors();
    }

    public stopSimulation(): void {
        this.isRunning = false;
    }

    private async simulateSensors(): Promise<void> {
        while (this.isRunning) {
            try {
                // Add micro-noise to the static resting position
                const noisyAlpha = this.config.alpha + (Math.random() - 0.5) * 0.1;
                const noisyBeta = this.config.beta + (Math.random() - 0.5) * 0.1;
                const noisyGamma = this.config.gamma + (Math.random() - 0.5) * 0.1;

                const noisyAccelX = this.config.accelX + (Math.random() - 0.5) * 0.05;
                const noisyAccelY = this.config.accelY + (Math.random() - 0.5) * 0.05;
                const noisyAccelZ = this.config.accelZ + (Math.random() - 0.5) * 0.05;

                await this.page.evaluate((alpha, beta, gamma, ax, ay, az) => {
                    const orientationEvent = new Event('deviceorientation');
                    Object.assign(orientationEvent, { alpha, beta, gamma, absolute: true });
                    window.dispatchEvent(orientationEvent);

                    const motionEvent = new Event('devicemotion');
                    Object.assign(motionEvent, {
                        acceleration: { x: ax, y: ay, z: az },
                        accelerationIncludingGravity: { x: ax, y: ay, z: az + 9.81 },
                        rotationRate: { alpha: 0, beta: 0, gamma: 0 },
                        interval: 16
                    });
                    window.dispatchEvent(motionEvent);
                }, noisyAlpha, noisyBeta, noisyGamma, noisyAccelX, noisyAccelY, noisyAccelZ);

                // Typical mobile sensor polling rate (~60Hz)
                await new Promise(r => setTimeout(r, 100));
            } catch (e) {
                // Page might be navigating/closed
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
}
