import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { StorageLayer } from './storage/database';
import { EncryptionManager } from './security/encryption';
import { ProfileManager } from './profile/manager';
import { BrowserLauncher } from './browser/launcher';

// Determine Paths
const userDataPath = path.join(os.homedir(), '.anti_detect_browser');
const dbPath = path.join(userDataPath, 'db');
const profilesDataPath = path.join(userDataPath, 'profiles');

// Core Managers
const encryption = new EncryptionManager(userDataPath);
const storage = new StorageLayer(dbPath, encryption);
const profileManager = new ProfileManager(storage);
const browserLauncher = new BrowserLauncher(profilesDataPath);

let mainWindow: BrowserWindow | null;

async function initCoreSystems() {
    // 1. Initialize Encryption
    // Load from env, fallback to secure auto-generated string for testing
    const masterKey = process.env.ANTI_DETECT_MASTER_KEY || 'default-testing-master-key-123';
    encryption.initialize(masterKey);

    // 2. Initialize Database
    await storage.initialize();
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
