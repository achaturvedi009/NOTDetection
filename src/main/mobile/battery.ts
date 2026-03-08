import { BatteryConfig } from '../profile/models';

export class BatterySimulator {
    /**
     * Generates the JavaScript payload to mock the `navigator.getBattery()` API.
     * Gradually simulates discharging or charging depending on the config.
     */
    public static generatePayload(config: BatteryConfig): string {
        return `
            (function(batteryConfig) {
                if (!navigator.getBattery) return;

                let currentLevel = batteryConfig.level;
                let isCharging = batteryConfig.charging;

                const mockBattery = {
                    charging: isCharging,
                    chargingTime: batteryConfig.chargingTime,
                    dischargingTime: batteryConfig.dischargingTime,
                    level: currentLevel,
                    onchargingchange: null,
                    onchargingtimechange: null,
                    ondischargingtimechange: null,
                    onlevelchange: null,
                    addEventListener: function(type, listener) {
                        this['on' + type] = listener;
                    }
                };

                navigator.getBattery = function() {
                    return Promise.resolve(mockBattery);
                };

                // Simulate battery drain/charge every 60 seconds
                setInterval(() => {
                    if (isCharging && currentLevel < 1.0) {
                        currentLevel = Math.min(1.0, currentLevel + 0.01);
                    } else if (!isCharging && currentLevel > 0.0) {
                        currentLevel = Math.max(0.0, currentLevel - 0.01);
                    }
                    mockBattery.level = currentLevel;
                    if (typeof mockBattery.onlevelchange === 'function') {
                        mockBattery.onlevelchange(new Event('levelchange'));
                    }
                }, 60000);

            })(${JSON.stringify(config)});
        `;
    }
}
