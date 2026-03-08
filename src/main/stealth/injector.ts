import { FingerprintConfig } from '../profile/models';

export class JSEnvironmentHardener {

    /**
     * Generates a JS payload to sanitize the runtime environment.
     * This strips CDP variables, injects fake plugins, and hardens the Window prototype.
     */
    public static generatePayload(config: FingerprintConfig): string {
        return `
            (function(config) {
                // 1. Eradicate WebDriver & Automation Flags
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });

                // Delete CDP/Puppeteer specific injected variables on the window object
                // Puppeteer usually injects window.cdc_ variables. We iterate and delete them.
                for (const key in window) {
                    if (key.match(/^cdc_[a-zA-Z0-9]+_/)) {
                        try {
                            delete window[key];
                        } catch (e) {}
                    }
                }

                // 2. Mock Plugins and MimeTypes
                // Headless/Automated Chrome often has 0 plugins. Real users have standard Chromium plugins.
                const generateMockPlugins = () => {
                    const fakePlugins = [
                        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
                        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
                        { name: "Native Client", filename: "internal-nacl-plugin", description: "" }
                    ];

                    const pluginArray = Object.create(PluginArray.prototype);
                    for (let i = 0; i < fakePlugins.length; i++) {
                        pluginArray[i] = fakePlugins[i];
                    }
                    Object.defineProperty(pluginArray, 'length', { value: fakePlugins.length });
                    return pluginArray;
                };

                const generateMockMimeTypes = () => {
                    const fakeMimeTypes = [
                        { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" }
                    ];
                    const mimeTypeArray = Object.create(MimeTypeArray.prototype);
                    for (let i = 0; i < fakeMimeTypes.length; i++) {
                        mimeTypeArray[i] = fakeMimeTypes[i];
                    }
                    Object.defineProperty(mimeTypeArray, 'length', { value: fakeMimeTypes.length });
                    return mimeTypeArray;
                };

                Object.defineProperty(navigator, 'plugins', {
                    get: () => generateMockPlugins(),
                });

                Object.defineProperty(navigator, 'mimeTypes', {
                    get: () => generateMockMimeTypes(),
                });

                // 3. Fake Chrome Runtime Object
                // Real Chrome has window.chrome, headless does not.
                if (!window.chrome) {
                    window.chrome = {
                        app: {
                            isInstalled: false,
                            InstallState: {
                                DISABLED: 'disabled',
                                INSTALLED: 'installed',
                                NOT_INSTALLED: 'not_installed'
                            },
                            RunningState: {
                                CANNOT_RUN: 'cannot_run',
                                READY_TO_RUN: 'ready_to_run',
                                RUNNING: 'running'
                            }
                        },
                        runtime: {
                            OnInstalledReason: {
                                CHROME_UPDATE: 'chrome_update',
                                INSTALL: 'install',
                                SHARED_MODULE_UPDATE: 'shared_module_update',
                                UPDATE: 'update'
                            },
                            OnRestartRequiredReason: {
                                APP_UPDATE: 'app_update',
                                OS_UPDATE: 'os_update',
                                PERIODIC: 'periodic'
                            },
                            PlatformArch: {
                                ARM: 'arm',
                                ARM64: 'arm64',
                                MIPS: 'mips',
                                MIPS64: 'mips64',
                                X86_32: 'x86-32',
                                X86_64: 'x86-64'
                            },
                            PlatformNaclArch: {
                                ARM: 'arm',
                                MIPS: 'mips',
                                MIPS64: 'mips64',
                                X86_32: 'x86-32',
                                X86_64: 'x86-64'
                            },
                            PlatformOs: {
                                ANDROID: 'android',
                                CROS: 'cros',
                                LINUX: 'linux',
                                MAC: 'mac',
                                OPENBSD: 'openbsd',
                                WIN: 'win'
                            },
                            RequestUpdateCheckStatus: {
                                NO_UPDATE: 'no_update',
                                THROTTLED: 'throttled',
                                UPDATE_AVAILABLE: 'update_available'
                            }
                        }
                    };
                }

                // 4. Hairline API mocking (Permissions)
                // Puppeteer often denies permissions instantly, revealing automation.
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => {
                    return parameters.name === 'notifications'
                        ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
                        : originalQuery(parameters);
                };

            })(${JSON.stringify(config)});
        `;
    }
}
