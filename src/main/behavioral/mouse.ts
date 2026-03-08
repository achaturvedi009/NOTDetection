import { Page } from 'puppeteer-core';
import { BehavioralConfig } from '../profile/models';

export class MousePhysicsEngine {
    private page: Page;
    private config: BehavioralConfig;
    private currentX: number = 0;
    private currentY: number = 0;

    constructor(page: Page, config: BehavioralConfig) {
        this.page = page;
        this.config = config;
    }

    /**
     * Move the mouse from its current position to (targetX, targetY)
     * using a Bezier curve with randomized control points and velocity interpolation.
     */
    public async move(targetX: number, targetY: number): Promise<void> {
        if (this.config.archetype === 'mobile') {
            // Mobile devices don't "hover" or drag cursors gracefully, they tap.
            await this.page.mouse.move(targetX, targetY);
            this.currentX = targetX;
            this.currentY = targetY;
            return;
        }

        const startX = this.currentX;
        const startY = this.currentY;

        const distance = Math.hypot(targetX - startX, targetY - startY);
        // Steps depend on distance and archetype speed
        const steps = Math.max(10, Math.floor(distance / (this.config.mouseCurveDeviation || 20)));

        // Generate Control Points for Quadratic/Cubic Bezier Curve
        const controlX = (startX + targetX) / 2 + (Math.random() - 0.5) * distance * 0.5 * (this.config.mouseCurveDeviation / 100);
        const controlY = (startY + targetY) / 2 + (Math.random() - 0.5) * distance * 0.5 * (this.config.mouseCurveDeviation / 100);

        for (let t = 0; t <= 1; t += 1 / steps) {
            // Apply ease-in-out to velocity
            const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            // Bezier Calculation
            const x = (1 - easeT) ** 2 * startX + 2 * (1 - easeT) * easeT * controlX + easeT ** 2 * targetX;
            const y = (1 - easeT) ** 2 * startY + 2 * (1 - easeT) * easeT * controlY + easeT ** 2 * targetY;

            // Apply Jitter
            const jitterX = (Math.random() - 0.5) * this.config.mouseJitterStrength;
            const jitterY = (Math.random() - 0.5) * this.config.mouseJitterStrength;

            await this.page.mouse.move(Math.round(x + jitterX), Math.round(y + jitterY));

            // Random micro-pause (simulating CPU rendering delay or hand stall)
            if (Math.random() < 0.05) await this.sleep(10 + Math.random() * 20);
        }

        // Snap to exact target to finish
        await this.page.mouse.move(targetX, targetY);
        this.currentX = targetX;
        this.currentY = targetY;
    }

    public async click(targetX: number, targetY: number): Promise<void> {
        await this.move(targetX, targetY);

        // Hesitation before click
        await this.sleep(100 + Math.random() * 200);

        // Down/Up interval
        await this.page.mouse.down();
        await this.sleep(50 + Math.random() * 100);
        await this.page.mouse.up();
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
