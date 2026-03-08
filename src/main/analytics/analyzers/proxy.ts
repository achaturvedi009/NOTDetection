import { AnalyticsDataWarehouse } from '../warehouse';

export class ProxyPerformanceAnalyzer {
    private warehouse: AnalyticsDataWarehouse;

    constructor(warehouse: AnalyticsDataWarehouse) {
        this.warehouse = warehouse;
    }

    /**
     * Evaluates proxy health by analyzing PROXY_HEALTH telemetry events
     * and computing moving averages of latency and timeout failures.
     */
    public async analyzeProxyHealth(proxyHost: string): Promise<{ averageLatency: number, failureRate: number }> {
        const events = await this.warehouse.queryEvents('PROXY_HEALTH', Date.now() - 86400000, 500); // Last 24hrs

        const hostEvents = events.filter(e => e.data.host === proxyHost);

        if (hostEvents.length === 0) return { averageLatency: -1, failureRate: 0 };

        let totalLatency = 0;
        let failures = 0;

        hostEvents.forEach(e => {
            if (e.data.status === 'failed') {
                failures++;
            } else if (e.data.latency) {
                totalLatency += e.data.latency;
            }
        });

        const successEvents = hostEvents.length - failures;
        const averageLatency = successEvents > 0 ? (totalLatency / successEvents) : -1;
        const failureRate = failures / hostEvents.length;

        return { averageLatency, failureRate };
    }
}
