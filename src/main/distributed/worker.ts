import * as os from 'os';
import * as crypto from 'crypto';
import WebSocket from 'ws';
import { LocalResourceManager } from '../local/resource-manager';
import { ProfileAutomationController } from '../automation/controller';
import { TaskExecutionEngine, AutomationWorkflow } from '../automation/task-engine';
import { NodeCommunicationPayload, NodeMetrics } from './models';
import { Profile } from '../profile/models';
import { ProfileManager } from '../profile/manager';

export class WorkerNodeRuntime {
    private controlUrl: string;
    private nodeId: string;
    private clusterSecret: string;

    private resourceManager: LocalResourceManager;
    private automationController: ProfileAutomationController;
    private profileManager: ProfileManager;
    private ws: WebSocket | null = null;

    constructor(
        controlUrl: string,
        clusterSecret: string,
        resourceManager: LocalResourceManager,
        automationController: ProfileAutomationController,
        profileManager: ProfileManager
    ) {
        this.controlUrl = controlUrl;
        this.clusterSecret = clusterSecret;
        this.nodeId = crypto.randomUUID();
        this.resourceManager = resourceManager;
        this.automationController = automationController;
        this.profileManager = profileManager;
    }

    public start(): void {
        console.log(`[WorkerNode] Starting runtime. Connecting to ${this.controlUrl}...`);
        this.ws = new WebSocket(this.controlUrl);

        this.ws.on('open', () => {
            console.log(`[WorkerNode] Connected to Control Node.`);
            this.sendPayload('REGISTER', this.getMetrics());

            // Start heartbeat loop
            setInterval(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.sendPayload('HEARTBEAT', this.getMetrics());
                }
            }, 10000);
        });

        this.ws.on('message', async (data: string) => {
            try {
                const payload: NodeCommunicationPayload = JSON.parse(data);
                // In production, verify HMAC signature here

                if (payload.type === 'TASK_ASSIGN') {
                    await this.handleTask(payload.data.taskId, payload.data.profile, payload.data.workflow);
                }
            } catch (e) {
                console.error(`[WorkerNode] Error processing message:`, e);
            }
        });

        this.ws.on('close', () => {
            console.warn(`[WorkerNode] Disconnected from Control Node. Attempting reconnect in 5s...`);
            setTimeout(() => this.start(), 5000);
        });

        this.ws.on('error', (err) => {
            console.error(`[WorkerNode] WebSocket Error: ${err.message}`);
        });
    }

    private getMetrics(): NodeMetrics {
        return {
            freeMemoryGB: os.freemem() / (1024 * 1024 * 1024),
            cpuLoadAverage: os.loadavg()[0],
            activeSessions: (this.resourceManager as any).activeBrowsers.size,
            maxConcurrency: (this.resourceManager as any).maxConcurrentProfiles
        };
    }

    private async handleTask(taskId: string, profile: Profile, workflow: AutomationWorkflow): Promise<void> {
        console.log(`[WorkerNode] Received Task ${taskId} for Profile ${profile.id}.`);

        if (!this.resourceManager.canLaunchProfile()) {
            this.sendPayload('TASK_STATUS', { taskId, status: 'failed', error: 'Resource exhausted' });
            return;
        }

        try {
            // 1. Sync Profile down to local SQLite
            // Always overwrite local state to ensure we capture any evolution/healing steps
            // that occurred on the Master/Control node since the last run.
            await this.profileManager.updateProfile(profile);

            // 2. Start session via Automation Controller
            const session = await this.automationController.startProfile(profile.id);
            this.sendPayload('TASK_STATUS', { taskId, status: 'running' });

            // 3. Execute declarative workflow
            await TaskExecutionEngine.runWorkflow(session, workflow);

            // 4. Shutdown and report success
            await this.automationController.stopProfile(profile.id);

            // Sync evolved profile state back to Master
            const evolvedProfile = await this.profileManager.getProfile(profile.id);
            this.sendPayload('TASK_STATUS', { taskId, status: 'completed', evolvedProfile });

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[WorkerNode] Task ${taskId} failed: ${msg}`);
            this.sendPayload('TASK_STATUS', { taskId, status: 'failed', error: msg });
        }
    }

    private sendPayload(type: NodeCommunicationPayload['type'], data: any): void {
        if (!this.ws) return;

        const payloadStr = JSON.stringify(data);
        const signature = crypto.createHmac('sha256', this.clusterSecret).update(payloadStr).digest('hex');

        const packet: NodeCommunicationPayload = {
            type,
            nodeId: this.nodeId,
            signature,
            data
        };

        this.ws.send(JSON.stringify(packet));
    }
}
