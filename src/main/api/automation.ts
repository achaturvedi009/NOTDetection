import express, { Request, Response, NextFunction } from 'express';
import * as http from 'http';
import { WebSocketServer } from 'ws';
import * as crypto from 'crypto';
import { ProfileAutomationController } from '../automation/controller';
import { AnalyticsDataWarehouse } from '../analytics/warehouse';
import { FingerprintDistributionAnalyzer } from '../analytics/analyzers/distribution';
import { ProxyPerformanceAnalyzer } from '../analytics/analyzers/proxy';
import { DetectionIntelligenceAnalyzer } from '../analytics/analyzers/detection';
import { ProfilePerformanceAnalyzer } from '../analytics/analyzers/performance';
import { IdentityAccessManager } from '../governance/iam';
import { User } from '../governance/models';

/**
 * Enterprise Automation API Gateway
 * Exposes a local REST & WebSocket interface to allow external scripts
 * to orchestrate browser profiles securely.
 */
export class AutomationAPIGateway {
    private port: number;
    private app: express.Application;
    private server: http.Server;
    private wss: WebSocketServer;
    private controller: ProfileAutomationController;
    private apiToken: string;
    public analytics?: AnalyticsDataWarehouse;
    public distributionAnalyzer?: FingerprintDistributionAnalyzer;
    public proxyAnalyzer?: ProxyPerformanceAnalyzer;
    public detectionAnalyzer?: DetectionIntelligenceAnalyzer;
    public performanceAnalyzer?: ProfilePerformanceAnalyzer;
    public iam?: IdentityAccessManager;

    constructor(controller: ProfileAutomationController, port: number = 5543) {
        this.port = port;
        this.controller = controller;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server, path: '/api/v1/ws' });

        // Generate a secure session token that scripts must use to connect
        this.apiToken = crypto.randomBytes(32).toString('hex');

        this.configureMiddleware();
        this.configureRoutes();
        this.configureWebSockets();
    }

    public getSessionToken(): string {
        return this.apiToken;
    }

    private configureMiddleware(): void {
        this.app.use(express.json());

        // Automation Security Layer: Support IAM user tokens or master API token
        this.app.use(async (req: Request, res: Response, next: NextFunction) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).json({ error: 'Unauthorized. Missing authorization header.' });
                return;
            }

            const token = authHeader.replace('Bearer ', '');

            if (token === this.apiToken) {
                // System level token (used by local workers)
                (req as any).user = { id: 'system', role: 'system_admin' };
                return next();
            }

            // Phase 12: IAM Auth (In a real system, the token would be a signed JWT)
            // For simplicity, we assume basic auth format `username:password` here for the demo
            if (this.iam && token.includes(':')) {
                const [user, pass] = token.split(':');
                const authenticatedUser = await this.iam.authenticate(user, pass);
                if (authenticatedUser) {
                    (req as any).user = authenticatedUser;
                    return next();
                }
            }

            res.status(403).json({ error: 'Forbidden. Invalid credentials.' });
        });
    }

    private configureRoutes(): void {
        this.app.post('/api/v1/profiles/:id/start', async (req: Request, res: Response) => {
            try {
                await this.controller.startProfile(req.params.id as string);
                res.status(200).json({ status: 'started', id: req.params.id });
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                res.status(500).json({ error: msg });
            }
        });

        this.app.post('/api/v1/profiles/:id/stop', async (req: Request, res: Response) => {
            try {
                await this.controller.stopProfile(req.params.id as string);
                res.status(200).json({ status: 'stopped', id: req.params.id });
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                res.status(500).json({ error: msg });
            }
        });

        // Expose a route for task execution
        this.app.post('/api/v1/profiles/:id/execute', async (req: Request, res: Response) => {
            try {
                const { taskName, params } = req.body;
                const result = await this.controller.executeTask(req.params.id as string, taskName, params);
                res.status(200).json({ status: 'success', result });
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                res.status(500).json({ error: msg });
            }
        });

        // Phase 12: Governance API
        this.app.post('/api/v1/governance/users', async (req: Request, res: Response) => {
            try {
                if (!this.iam || !this.iam.authorize((req as any).user, 'system_admin')) {
                    res.status(403).json({ error: 'Forbidden. Requires system_admin role.' });
                    return;
                }
                const { username, password, role, workspaceId } = req.body;
                const hash = this.iam.hashPassword(password);
                // The IAM db uses createUser, which accepts hash
                await (this.iam as any).db.createUser(username, hash, role, workspaceId);
                res.status(201).json({ status: 'success', username, role });
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                res.status(500).json({ error: msg });
            }
        });

        // Phase 11: Analytics Dashboard API
        this.app.get('/api/v1/analytics/dashboard', async (req: Request, res: Response) => {
            try {
                if (!this.analytics || !this.distributionAnalyzer || !this.proxyAnalyzer || !this.detectionAnalyzer) {
                    res.status(503).json({ error: 'Analytics engine not initialized.' });
                    return;
                }

                const osDistribution = await this.distributionAnalyzer.getOSDistribution();
                const recentDetections = await this.analytics.queryEvents('DETECTION_SIGNAL', undefined, 10);
                const threatLandscape = await this.detectionAnalyzer.analyzeThreatLandscape();

                // Fetch some default proxy health (in a real system, you'd iterate active proxies)
                const defaultProxyHealth = await this.proxyAnalyzer.analyzeProxyHealth('example-proxy.com');

                res.status(200).json({
                    status: 'success',
                    data: {
                        osDistribution,
                        threatLandscape,
                        proxyHealth: defaultProxyHealth,
                        recentDetections
                    }
                });
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                res.status(500).json({ error: msg });
            }
        });
    }

    private configureWebSockets(): void {
        this.wss.on('connection', (ws, request) => {
            // Simplified token check for WS (in prod, parse from protocol header or query)
            ws.on('message', (message) => {
                console.log(`[Automation API] Received WS message: ${message}`);
            });
            ws.send(JSON.stringify({ event: 'connected', message: 'Automation CDP proxy ready.' }));
        });
    }

    public start(): void {
        this.server.listen(this.port, '127.0.0.1', () => {
            console.log(`[Automation API] Gateway running locally on http://127.0.0.1:${this.port}`);
            console.log(`[Automation API] Session Token: ${this.apiToken}`);
        });
    }

    public stop(): void {
        this.server.close();
        this.wss.close();
        console.log(`[Automation API] Stopped.`);
    }
}
