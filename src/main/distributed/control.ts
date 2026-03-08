import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as crypto from 'crypto';
import { WorkerNodeRecord, DistributedTask, NodeCommunicationPayload } from './models';
import { ProfileManager } from '../profile/manager';

export class ControlNodeOrchestrator {
    private wss: WebSocketServer;
    private clusterSecret: string;
    private profileManager: ProfileManager;

    private nodes: Map<string, { record: WorkerNodeRecord, ws: WebSocket }> = new Map();
    private taskQueue: DistributedTask[] = [];
    private activeTasks: Map<string, DistributedTask> = new Map();

    constructor(server: http.Server, clusterSecret: string, profileManager: ProfileManager) {
        this.wss = new WebSocketServer({ server, path: '/cluster/v1/ws' });
        this.clusterSecret = clusterSecret;
        this.profileManager = profileManager;

        this.setupServer();
        this.startScheduler();
        this.startFailureRecoveryMonitor();
    }

    private setupServer(): void {
        this.wss.on('connection', (ws) => {
            console.log(`[ControlNode] New connection attempt...`);

            ws.on('message', async (message: string) => {
                try {
                    const payload: NodeCommunicationPayload = JSON.parse(message);

                    // Verify HMAC
                    const expectedSig = crypto.createHmac('sha256', this.clusterSecret).update(JSON.stringify(payload.data)).digest('hex');
                    if (expectedSig !== payload.signature) {
                        console.error(`[ControlNode] Invalid signature from node ${payload.nodeId}`);
                        ws.close();
                        return;
                    }

                    this.handleNodeMessage(payload.nodeId, ws, payload);
                } catch (e) {
                    console.error(`[ControlNode] Message parse error:`, e);
                }
            });

            ws.on('close', () => {
                this.handleNodeDisconnect(ws);
            });
        });
    }

    private handleNodeMessage(nodeId: string, ws: WebSocket, payload: NodeCommunicationPayload) {
        switch (payload.type) {
            case 'REGISTER':
            case 'HEARTBEAT':
                this.nodes.set(nodeId, {
                    ws,
                    record: {
                        id: nodeId,
                        hostname: `Worker-${nodeId.substring(0,6)}`,
                        status: 'connected',
                        metrics: payload.data,
                        lastHeartbeat: Date.now()
                    }
                });
                break;

            case 'TASK_STATUS':
                const task = this.activeTasks.get(payload.data.taskId);
                if (!task) return;

                task.status = payload.data.status;
                if (task.status === 'completed') {
                    console.log(`[ControlNode] Task ${task.taskId} completed successfully on Node ${nodeId}.`);
                    this.activeTasks.delete(task.taskId);

                    // Phase 8 Sync: Update master database with evolved profile state
                    if (payload.data.evolvedProfile) {
                        this.profileManager.updateProfile(payload.data.evolvedProfile).catch(console.error);
                    }
                } else if (task.status === 'failed') {
                    console.warn(`[ControlNode] Task ${task.taskId} failed on Node ${nodeId}: ${payload.data.error}`);
                    this.activeTasks.delete(task.taskId);
                    if (task.retries < 3) {
                        task.retries++;
                        task.status = 'queued';
                        task.assignedNodeId = undefined;
                        this.taskQueue.push(task); // Re-queue
                        console.log(`[ControlNode] Re-queued Task ${task.taskId}. Retry ${task.retries}/3`);
                    }
                }
                break;
        }
    }

    private handleNodeDisconnect(ws: WebSocket) {
        for (const [nodeId, nodeObj] of this.nodes.entries()) {
            if (nodeObj.ws === ws) {
                console.warn(`[ControlNode] Node ${nodeId} disconnected.`);
                nodeObj.record.status = 'disconnected';
                // Failure Recovery handles active tasks
                break;
            }
        }
    }

    public submitTask(task: DistributedTask): void {
        this.taskQueue.push(task);
        // Sort highest priority first
        this.taskQueue.sort((a, b) => b.priority - a.priority);
        console.log(`[ControlNode] Task ${task.taskId} queued. Queue length: ${this.taskQueue.length}`);
    }

    /**
     * Execution Scheduler: Continuously attempts to map queued tasks to available worker nodes.
     */
    private startScheduler(): void {
        setInterval(async () => {
            if (this.taskQueue.length === 0) return;

            // Find an available node
            const availableNodes = Array.from(this.nodes.values()).filter(n =>
                n.record.status === 'connected' &&
                n.record.metrics.activeSessions < n.record.metrics.maxConcurrency &&
                n.record.metrics.freeMemoryGB > 1.0
            );

            if (availableNodes.length === 0) return;

            // Simple Round-Robin or Load-Balanced selection
            availableNodes.sort((a, b) => a.record.metrics.activeSessions - b.record.metrics.activeSessions);
            const selectedNode = availableNodes[0];

            const task = this.taskQueue.shift()!;

            // Pull full profile to distribute to the worker
            const profile = await this.profileManager.getProfile(task.profileId);
            if (!profile) {
                console.error(`[ControlNode] Cannot assign task ${task.taskId}: Profile ${task.profileId} not found.`);
                return;
            }

            task.status = 'assigned';
            task.assignedNodeId = selectedNode.record.id;
            this.activeTasks.set(task.taskId, task);

            const payloadStr = JSON.stringify({ taskId: task.taskId, profile, workflow: task.workflow });
            const signature = crypto.createHmac('sha256', this.clusterSecret).update(payloadStr).digest('hex');

            selectedNode.ws.send(JSON.stringify({
                type: 'TASK_ASSIGN',
                nodeId: 'master',
                signature,
                data: { taskId: task.taskId, profile, workflow: task.workflow }
            }));

            console.log(`[ControlNode] Assigned Task ${task.taskId} to Node ${selectedNode.record.id}.`);
        }, 3000);
    }

    /**
     * Failure Recovery System: Identifies stalled nodes and reclaims tasks.
     */
    private startFailureRecoveryMonitor(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [nodeId, nodeObj] of this.nodes.entries()) {
                if (nodeObj.record.status === 'connected' && (now - nodeObj.record.lastHeartbeat > 30000)) {
                    console.error(`[ControlNode] Node ${nodeId} timed out. Marking disconnected.`);
                    nodeObj.record.status = 'disconnected';
                    nodeObj.ws.terminate();

                    // Re-queue tasks assigned to this dead node
                    for (const [taskId, task] of this.activeTasks.entries()) {
                        if (task.assignedNodeId === nodeId) {
                            console.warn(`[Failure Recovery] Reclaiming orphaned task ${taskId} from dead Node ${nodeId}.`);
                            this.activeTasks.delete(taskId);
                            task.status = 'queued';
                            task.assignedNodeId = undefined;
                            this.taskQueue.push(task);
                        }
                    }
                }
            }
        }, 15000);
    }
}
