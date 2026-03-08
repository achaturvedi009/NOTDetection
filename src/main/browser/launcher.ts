import { ChildProcess } from 'child_process';
import * as puppeteer from 'puppeteer-core';
import * as path from 'path';
import * as fs from 'fs';
import { Profile } from '../profile/models';
import { FingerprintInjector } from '../fingerprint/injector';
import { NetworkIdentityEngine } from '../network/engine';
import { NetworkIdentityTemplateRegistry } from '../network/templates';
import { NetworkConfig } from '../network/models';
import { HumanInteractionController } from '../behavioral/controller';
import { MobileNetworkSimulator } from '../mobile/network';
import { MobileSensorEngine } from '../mobile/sensors';
import { StealthHardeningEngine } from '../stealth/engine';
import { RuntimeEnvironmentValidator } from './validator';
import { NativeEnginePatchBuilder } from '../engine-patches/builder';
import { ProfileWarmUpSystem } from '../lifecycle/warmup';

export class BrowserLauncher {
    private activeBrowsers: Map<string, puppeteer.Browser> = new Map();
    private profilesDir: string;

    constructor(userDataBasePath: string) {
        this.profilesDir = userDataBasePath;
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    public async launchProfile(profile: Profile, executablePath: string): Promise<HumanInteractionController> {
        if (this.activeBrowsers.has(profile.id)) {
            throw new Error(`Profile ${profile.id} is already running.`);
        }

        // 0. Pre-Flight Validation
        RuntimeEnvironmentValidator.validateBeforeLaunch(profile, executablePath);

        const userDataDir = path.join(this.profilesDir, profile.id);
        if (!fs.existsSync(userDataDir)) {
            fs.mkdirSync(userDataDir, { recursive: true });
        }

        // Phase 13: Execute Profile Warm-Up to synthetically age directory artifacts
        ProfileWarmUpSystem.initializeWarmUpData(profile, userDataDir);

        // Phase 13: Generate Native C++ Patch Manifest for BoringSSL/nghttp2 overrides
        NativeEnginePatchBuilder.generatePatchManifest(profile.id, profile.fingerprint, userDataDir);

        // Securely pass the fingerprint configuration to the custom Chromium fork.
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

        // Stealth Component: Add stealth-hardened browser flags
        args.push(...StealthHardeningEngine.getSanitizedChromiumFlags());

        let requiresAuth = false;
        if (advancedProxy.username && advancedProxy.password) {
            requiresAuth = true;
        }

        // 9. Launch browser instance
        const ignoredArgs = StealthHardeningEngine.getIgnoredPuppeteerArgs();
        const browser = await puppeteer.launch({
            executablePath: executablePath,
            args: args,
            headless: false,
            defaultViewport: null, // Allow custom window sizes
            ignoreDefaultArgs: ignoredArgs
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

        const isMobile = profile.fingerprint.screen.isMobile;

        await page.setUserAgent(profile.fingerprint.userAgent, {
            architecture: isMobile ? 'arm' : 'x86', // or read from platform
            platform: profile.fingerprint.hardware.platform,
            platformVersion: profile.fingerprint.hardware.osVersion,
            model: isMobile ? profile.fingerprint.mobile!.model : '',
            mobile: isMobile,
            bitness: '64',
            wow64: false
        });

        await page.emulateTimezone(profile.fingerprint.timezone);

        if (isMobile) {
            await page.setViewport({
                width: profile.fingerprint.screen.width,
                height: profile.fingerprint.screen.height,
                deviceScaleFactor: profile.fingerprint.screen.pixelRatio,
                isMobile: true,
                hasTouch: true,
                isLandscape: profile.fingerprint.screen.orientation === 'landscape-primary'
            });

            // Initialize mobile network conditions
            if (profile.fingerprint.mobile) {
                await MobileNetworkSimulator.applyNetworkConditions(page as any, profile.fingerprint.mobile.network);
            }

            // Initialize mobile sensors
            if (profile.fingerprint.sensors) {
                const sensorEngine = new MobileSensorEngine(page as any, profile.fingerprint.sensors);
                sensorEngine.startSimulation();

                // Tie sensor cleanup to page close
                page.on('close', () => {
                    sensorEngine.stopSimulation();
                });
            }
        }

        // 2. Inject Fingerprint Spoofing Payload on New Document
        const spoofPayload = FingerprintInjector.generatePayload(profile.fingerprint);
        await page.evaluateOnNewDocument(spoofPayload);

        // Stealth Component: Inject Stealth Hardening payload to defeat WebDriver detection
        const stealthPayload = StealthHardeningEngine.compileStealthPayload(profile.fingerprint);
        await page.evaluateOnNewDocument(stealthPayload);

        // Optional: Navigate to a leak testing page to verify fingerprint upon launch
        await page.goto('https://abouthero.com'); // Example test page

        // 10. Instantiate and attach the Behavioral Engine Controller to this session
        const behaviorController = new HumanInteractionController(page as any, profile.fingerprint.behavioral);

        // Record initial navigation
        behaviorController.navigation.recordNavigation('https://abouthero.com');

        browser.on('disconnected', () => {
            this.activeBrowsers.delete(profile.id);
            console.log(`Browser for profile ${profile.id} closed.`);
        });

        return behaviorController;
    }

    public async stopProfile(id: string): Promise<void> {
        const browser = this.activeBrowsers.get(id);
        if (browser) {
            await browser.close();
            this.activeBrowsers.delete(id);
        }
    }

    public getActiveBrowsersMap(): Map<string, puppeteer.Browser> {
        return this.activeBrowsers;
    }
}
