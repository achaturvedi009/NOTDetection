export type TelemetryCategory =
    | 'SESSION_START'
    | 'SESSION_END'
    | 'BEHAVIORAL_INTERACTION'
    | 'NETWORK_REQUEST'
    | 'DETECTION_SIGNAL'
    | 'PROXY_HEALTH';

export interface TelemetryEvent {
    id: string;
    profileId: string;
    category: TelemetryCategory;
    timestamp: number;
    data: any;
}

export interface ProfilePerformanceMetrics {
    profileId: string;
    successRate: number;
    averageSessionDurationMs: number;
    totalDetections: number;
}

export interface ProxyPerformanceMetrics {
    proxyHost: string;
    successRate: number;
    averageLatencyMs: number;
    failureCount: number;
}

export interface DistributionMetric {
    label: string;
    count: number;
    percentage: number;
}

export interface SystemAnalyticsDashboard {
    totalProfiles: number;
    activeSessions: number;
    criticalRiskProfiles: number;
    browserDistribution: DistributionMetric[];
    osDistribution: DistributionMetric[];
    recentDetections: TelemetryEvent[];
}
