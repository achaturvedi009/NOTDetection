import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { StorageLayer } from './storage/database';
import { EncryptionManager } from './security/encryption';
import { ProfileManager } from './profile/manager';
import { BrowserLauncher } from './browser/launcher';
import { deviceRegistry } from './fingerprint/registry';
import { LocalResourceManager } from './local/resource-manager';
import { LocalOnlyAdapter } from './cloud/sync';
import { KeyManager } from './security/key-manager';
import { ProfileAutomationController } from './automation/controller';
import { AutomationAPIGateway } from './api/automation';
import { ControlNodeOrchestrator } from './distributed/control';
import { WorkerNodeRuntime } from './distributed/worker';
import { AnalyticsDataWarehouse } from './analytics/warehouse';
import { FingerprintDistributionAnalyzer } from './analytics/analyzers/distribution';
import { RiskPredictionEngine } from './analytics/predictor';
import * as crypto from 'crypto';

// Determine Paths
const userDataPath = path.join(os.homedir(), '.anti_detect_browser');
const dbPath = path.join(userDataPath, 'db');
const profilesDataPath = path.join(userDataPath, 'profiles');

// Core Managers
const encryption = new EncryptionManager(userDataPath);
const storage = new StorageLayer(dbPath, encryption);
const profileManager = new ProfileManager(storage);
const browserLauncher = new BrowserLauncher(profilesDataPath);

// Initialize Local Orchestrators
const cloudAdapter = new LocalOnlyAdapter(); // strictly offline
const resourceManager = new LocalResourceManager(profilesDataPath, browserLauncher.getActiveBrowsersMap());

// Initialize Automation Framework
const automationController = new ProfileAutomationController(profileManager, browserLauncher);
const automationGateway = new AutomationAPIGateway(automationController, 5543);

// Initialize Analytics Engines
const analyticsWarehouse = new AnalyticsDataWarehouse(userDataPath);

let mainWindow: BrowserWindow | null;

// Node Execution Modes: 'local', 'control', or 'worker'
// In production, parse this securely from process.argv
const NODE_MODE = process.env.NODE_MODE || 'local';

async function initCoreSystems() {
    // 1. Initialize Encryption
    const masterKey = KeyManager.resolveMasterKey(userDataPath);
    encryption.initialize(masterKey);

    // 2. Initialize Databases
    await storage.initialize();
    await analyticsWarehouse.initialize();

    // Wire up Analytics API layer
    automationGateway.analytics = analyticsWarehouse;
    automationGateway.distributionAnalyzer = new FingerprintDistributionAnalyzer(analyticsWarehouse, profileManager);
    const proxyAnalyzer = new (require('./analytics/analyzers/proxy').ProxyPerformanceAnalyzer)(analyticsWarehouse);
    const detectionAnalyzer = new (require('./analytics/analyzers/detection').DetectionIntelligenceAnalyzer)(analyticsWarehouse);
    automationGateway.proxyAnalyzer = proxyAnalyzer;
    automationGateway.detectionAnalyzer = detectionAnalyzer;

    // Bind the global analytics warehouse so that all local sessions/commands can pipe events immediately
    (global as any).analyticsWarehouse = analyticsWarehouse;

    if (NODE_MODE === 'local') {
        console.log('[Boot Sequence] Local Enterprise Deployment Mode initialized. All cloud integrations are strictly disabled.');
    }

    // 3. Clean up orphaned resources to ensure efficient local disk usage
    await resourceManager.cleanupOrphanedResources();

    // 4. Start Local Automation API (exposes HTTP server used by Control Node)
    automationGateway.start();

    if (NODE_MODE === 'control') {
        console.log('[Boot Sequence] Initializing as Distributed Control Node.');
        const server = (automationGateway as any).server; // piggyback off express server
        const orchestrator = new ControlNodeOrchestrator(server, masterKey, profileManager);
    }
    else if (NODE_MODE === 'worker') {
        console.log('[Boot Sequence] Initializing as Distributed Worker Node.');
        const controlUrl = process.env.CONTROL_NODE_URL || 'ws://127.0.0.1:5543/cluster/v1/ws';
        const worker = new WorkerNodeRuntime(controlUrl, masterKey, resourceManager, automationController, profileManager);
        worker.start();
    }
    else {
        // Local mode logic
        console.log('[Boot Sequence] Initializing as Local Enterprise Node.');
    }

    // 5. Run Proactive Analytics Risk Prediction
    if (NODE_MODE !== 'worker') {
        const riskPredictor = new RiskPredictionEngine(analyticsWarehouse, profileManager);
        await riskPredictor.predictSystemRisks();
    }

    // 6. Hydrate Device Profile Registry
    if (NODE_MODE !== 'worker') {
        const profiles = await storage.getAllProfiles();
        for (const pMeta of profiles) {
            const fullProfile = await storage.getProfile(pMeta.id);
            if (fullProfile && fullProfile.fingerprint) {
                // Re-hydrate the memory registry so unique seeds are persisted across restarts
                deviceRegistry.register({
                    profileId: fullProfile.id,
                    templateId: 'unknown',
                    seed: String(fullProfile.fingerprint.canvasNoiseSeed),
                    os: fullProfile.fingerprint.hardware?.os || '',
                    browser: fullProfile.fingerprint.hardware?.browser || '',
                    gpu: fullProfile.fingerprint.webgl?.unmaskedRenderer || '',
                    resolution: fullProfile.fingerprint.screen ? `${fullProfile.fingerprint.screen.width}x${fullProfile.fingerprint.screen.height}` : ''
                });
            }
        }
    }
}

async function createWindow() {
    await initCoreSystems();

    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC Events Handlers
ipcMain.handle('get-profiles', async () => {
    return await profileManager.getAllProfiles();
});

ipcMain.handle('create-profile', async (event, name: string, proxyConfig: any) => {
    return await profileManager.createProfile(name, proxyConfig);
});

ipcMain.handle('delete-profile', async (event, id: string) => {
    await profileManager.deleteProfile(id);
});

ipcMain.handle('get-analytics', async () => {
    // In a real local frontend, we can query the internal modules directly.
    const osDistribution = await automationGateway.distributionAnalyzer?.getOSDistribution();
    const threatLandscape = await automationGateway.detectionAnalyzer?.analyzeThreatLandscape();
    const defaultProxyHealth = await automationGateway.proxyAnalyzer?.analyzeProxyHealth('example-proxy.com');
    const recentDetections = await automationGateway.analytics?.queryEvents('DETECTION_SIGNAL', undefined, 10);

    return {
        osDistribution,
        threatLandscape,
        proxyHealth: defaultProxyHealth,
        recentDetections
    };
});

ipcMain.handle('launch-profile', async (event, id: string) => {
    if (!resourceManager.canLaunchProfile()) {
        throw new Error('Local resources are exhausted. Please close an active profile before launching another.');
    }

    const profile = await profileManager.getProfile(id);
    if (!profile) throw new Error('Profile not found');

    // For testing purposes, point to a known Chromium or Chrome installation on the system.
    // In a real implementation, this would point to the custom Chromium fork bundled with the app.
    let execPath = '';

    if (process.platform === 'win32') {
        execPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else if (process.platform === 'darwin') {
        execPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
        execPath = '/usr/bin/google-chrome'; // Linux
    }

    try {
        await browserLauncher.launchProfile(profile, execPath);
    } catch(e: any) {
        console.error('Failed to launch profile:', e.message);
        throw e;
    }
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
