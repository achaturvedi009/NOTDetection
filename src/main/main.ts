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

let mainWindow: BrowserWindow | null;

// Offline Mode Enforcement Flag
const IS_OFFLINE_MODE = true;

async function initCoreSystems() {
    // 1. Initialize Encryption
    const masterKey = KeyManager.resolveMasterKey(userDataPath);
    encryption.initialize(masterKey);

    // 2. Initialize Database
    await storage.initialize();

    if (IS_OFFLINE_MODE) {
        console.log('[Boot Sequence] Local Enterprise Deployment Mode initialized. All cloud integrations are strictly disabled.');
    }

    // 3. Clean up orphaned resources to ensure efficient local disk usage
    await resourceManager.cleanupOrphanedResources();

    // 4. Start Local Automation API
    automationGateway.start();

    // 5. Hydrate Device Profile Registry
    const profiles = await storage.getAllProfiles();
    for (const pMeta of profiles) {
        const fullProfile = await storage.getProfile(pMeta.id);
        if (fullProfile && fullProfile.fingerprint) {
            // Re-hydrate the memory registry so unique seeds are persisted across restarts
            deviceRegistry.register({
                profileId: fullProfile.id,
                templateId: 'unknown', // Storing the exact template isn't critical for uniqueness validation
                seed: String(fullProfile.fingerprint.canvasNoiseSeed), // Use canvas seed as unique deterministic identifier
                os: fullProfile.fingerprint.hardware?.os || '',
                browser: fullProfile.fingerprint.hardware?.browser || '',
                gpu: fullProfile.fingerprint.webgl?.unmaskedRenderer || '',
                resolution: fullProfile.fingerprint.screen ? `${fullProfile.fingerprint.screen.width}x${fullProfile.fingerprint.screen.height}` : ''
            });
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
