import { ChildProcess } from 'child_process';
import * as puppeteer from 'puppeteer-core';
import * as path from 'path';
import * as fs from 'fs';
import { Profile } from '../profile/models';
import { FingerprintInjector } from '../fingerprint/injector';
import { NetworkIdentityEngine } from '../network/engine';
import { NetworkIdentityTemplateRegistry } from '../network/templates';
import { NetworkConfig } from '../network/models';

export class BrowserLauncher {
    private activeBrowsers: Map<string, puppeteer.Browser> = new Map();
    private profilesDir: string;

    constructor(userDataBasePath: string) {
        this.profilesDir = userDataBasePath;
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    public async launchProfile(profile: Profile, executablePath: string): Promise<void> {
        if (this.activeBrowsers.has(profile.id)) {
            throw new Error(`Profile ${profile.id} is already running.`);
        }

        const userDataDir = path.join(this.profilesDir, profile.id);
        if (!fs.existsSync(userDataDir)) {
            fs.mkdirSync(userDataDir, { recursive: true });
        }

        // Securely pass the fingerprint configuration to the custom Chromium fork.
        // The custom fork is engineered to read `fingerprint.json` from the user-data-dir on startup
        // and inject it straight into Blink/V8 engines before pages load.
        const fpFile = path.join(userDataDir, 'fingerprint.json');
        fs.writeFileSync(fpFile, JSON.stringify(profile.fingerprint));

        const args: string[] = [
            `--user-data-dir=${userDataDir}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-sync',
            '--disable-background-networking',
            // Basic fingerprint arguments that can be passed natively
            `--user-agent=${profile.fingerprint.userAgent}`,
            `--accept-lang=${profile.fingerprint.language}`
        ];

        // 1. Load device template (implicitly handled in Profile creation, fingerprint config already loaded)
        // 2. Load fingerprint configuration (loaded)

        // 3. Load network identity template
        const networkIdentityTemplate = NetworkIdentityTemplateRegistry.getTemplate(
            profile.fingerprint.hardware.os,
            profile.fingerprint.hardware.browserVersion
        );

        // Map Profile Proxy to AdvancedProxyConfig
        const advancedProxy = profile.proxy as any;

        // Compile comprehensive Network Identity Configuration
        const networkConfig: NetworkConfig = {
            webrtc: { mode: 'proxy_routed' }, // Secure default
            dns: { dohEnabled: true, dohProviderUrl: 'https://cloudflare-dns.com/dns-query', bypassHostResolver: true, isolatedCache: true },
            proxy: advancedProxy,
            identityTemplate: networkIdentityTemplate
        };

        // 4, 5, 6, 7, 8: Bind Proxy, configure TLS/HTTP2/WebRTC/DNS
        const networkFlags = NetworkIdentityEngine.compileNetworkFlags(profile.id, networkConfig);
        args.push(...networkFlags);

        let requiresAuth = false;
        if (advancedProxy.username && advancedProxy.password) {
            requiresAuth = true;
        }

        // 9. Launch browser instance
        const browser = await puppeteer.launch({
            executablePath: executablePath,
            args: args,
            headless: false,
            defaultViewport: null, // Allow custom window sizes
            ignoreDefaultArgs: ["--enable-automation"] // Hide puppeteer flag
        });

        this.activeBrowsers.set(profile.id, browser);

        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // Handle proxy authentication via CDP
        if (requiresAuth && profile.proxy) {
            await page.authenticate({
                username: profile.proxy.username || '',
                password: profile.proxy.password || ''
            });
        }

        // 1. Emulate Hardware via CDP (Chrome DevTools Protocol)
        await page.setBypassCSP(true);
        await page.setUserAgent(profile.fingerprint.userAgent, {
            architecture: 'x86', // or read from platform
            platform: profile.fingerprint.hardware.platform,
            platformVersion: profile.fingerprint.hardware.osVersion,
            model: '',
            mobile: false,
            bitness: '64',
            wow64: false
        });
        await page.emulateTimezone(profile.fingerprint.timezone);

        // 2. Inject Fingerprint Spoofing Payload on New Document
        const spoofPayload = FingerprintInjector.generatePayload(profile.fingerprint);
        await page.evaluateOnNewDocument(spoofPayload);

        // Optional: Navigate to a leak testing page to verify fingerprint upon launch
        await page.goto('https://abouthero.com'); // Example test page

        browser.on('disconnected', () => {
            this.activeBrowsers.delete(profile.id);
            console.log(`Browser for profile ${profile.id} closed.`);
        });
    }

    public async stopProfile(id: string): Promise<void> {
        const browser = this.activeBrowsers.get(id);
        if (browser) {
            await browser.close();
            this.activeBrowsers.delete(id);
        }
    }
}
