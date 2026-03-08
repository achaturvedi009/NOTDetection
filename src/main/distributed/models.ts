import { Profile } from '../profile/models';
import { AutomationWorkflow } from '../automation/task-engine';

export interface NodeMetrics {
    freeMemoryGB: number;
    cpuLoadAverage: number;
    activeSessions: number;
    maxConcurrency: number;
}

export interface WorkerNodeRecord {
    id: string;
    hostname: string;
    status: 'connected' | 'disconnected' | 'busy';
    metrics: NodeMetrics;
    lastHeartbeat: number;
}

export interface DistributedTask {
    taskId: string;
    profileId: string; // The profile to fetch/decrypt and launch
    workflow: AutomationWorkflow;
    priority: number;
    status: 'queued' | 'assigned' | 'running' | 'completed' | 'failed';
    assignedNodeId?: string;
    retries: number;
}

export type ProtocolMessageType =
    | 'REGISTER'
    | 'HEARTBEAT'
    | 'TASK_ASSIGN'
    | 'TASK_STATUS'
    | 'PROFILE_SYNC'
    | 'ERROR';

export interface NodeCommunicationPayload {
    type: ProtocolMessageType;
    nodeId: string;
    signature: string; // HMAC for encrypted auth
    data: any;
}
