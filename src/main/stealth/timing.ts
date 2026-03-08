import { FingerprintConfig } from '../profile/models';

export class TimingNormalizationEngine {

    /**
     * Generates the JS payload to normalize `performance.now()` and standard Date/Timeout functions.
     * Automation frameworks often execute so fast that the deltas are impossible for a human runtime,
     * or they expose underlying virtualization limits.
     */
    public static generatePayload(config: FingerprintConfig): string {
        return `
            (function(config) {
                // Determine a slight entropy drift based on the profile seed
                const timeDrift = (config.canvasNoiseSeed % 100) / 10000; // E.g., 0.003ms

                // 1. Hook performance.now() to introduce a micro-drift
                const originalPerformanceNow = window.performance.now;
                window.performance.now = function() {
                    const now = originalPerformanceNow.apply(this, arguments);
                    // Add deterministic noise proportional to the current uptime
                    return now + (now * timeDrift);
                };

                // 2. Hide our hooks by overriding Function.prototype.toString
                // If a script checks window.performance.now.toString(), it must return the native code string.
                const originalToString = Function.prototype.toString;
                Function.prototype.toString = function() {
                    if (this === window.performance.now) {
                        return 'function now() { [native code] }';
                    }
                    if (this === window.navigator.permissions.query) {
                        return 'function query() { [native code] }';
                    }
                    if (this === HTMLCanvasElement.prototype.toDataURL) {
                        return 'function toDataURL() { [native code] }';
                    }
                    if (this === CanvasRenderingContext2D.prototype.getImageData) {
                        return 'function getImageData() { [native code] }';
                    }
                    return originalToString.apply(this, arguments);
                };

            })(${JSON.stringify(config)});
        `;
    }
}
