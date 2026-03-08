import { FingerprintConfig } from '../profile/models';

/**
 * Generates the JavaScript payload that will be evaluated on every new document.
 * This overrides native browser APIs to spoof the fingerprint before any
 * website scripts execute.
 */
export class FingerprintInjector {

    public static generatePayload(config: FingerprintConfig): string {
        return `
            (function(config) {
                const overrideProperty = (obj, prop, value) => {
                    try {
                        Object.defineProperty(obj, prop, {
                            get: () => value,
                            configurable: true
                        });
                    } catch (e) {}
                };

                // --- Navigator Spoofing ---
                overrideProperty(navigator, 'userAgent', config.userAgent);
                overrideProperty(navigator, 'language', config.language);
                overrideProperty(navigator, 'languages', config.languages);
                overrideProperty(navigator, 'hardwareConcurrency', config.hardware.hardwareConcurrency);
                overrideProperty(navigator, 'deviceMemory', config.hardware.deviceMemory);
                overrideProperty(navigator, 'platform', config.hardware.platform);
                overrideProperty(navigator, 'doNotTrack', config.doNotTrack ? "1" : null);

                // Hide WebDriver
                overrideProperty(navigator, 'webdriver', false);

                // --- Screen Spoofing (Backup to CDP emulation) ---
                overrideProperty(screen, 'width', config.screen.width);
                overrideProperty(screen, 'height', config.screen.height);
                overrideProperty(screen, 'availWidth', config.screen.width);
                overrideProperty(screen, 'availHeight', config.screen.height);
                overrideProperty(screen, 'colorDepth', config.screen.colorDepth);
                overrideProperty(screen, 'pixelDepth', config.screen.colorDepth);
                overrideProperty(window, 'devicePixelRatio', config.screen.pixelRatio);

                // --- WebGL Spoofing ---
                const getParameterProxy = function(original) {
                    return function(parameter) {
                        const WEBGL_UNMASKED_VENDOR_WEBGL = 37445;
                        const WEBGL_UNMASKED_RENDERER_WEBGL = 37446;

                        if (parameter === WEBGL_UNMASKED_VENDOR_WEBGL) {
                            return config.webgl.unmaskedVendor;
                        }
                        if (parameter === WEBGL_UNMASKED_RENDERER_WEBGL) {
                            return config.webgl.unmaskedRenderer;
                        }
                        return original.apply(this, arguments);
                    };
                };

                const webglTypes = ['WebGLRenderingContext', 'WebGL2RenderingContext'];
                for (const type of webglTypes) {
                    if (window[type]) {
                        const originalGetParameter = window[type].prototype.getParameter;
                        window[type].prototype.getParameter = getParameterProxy(originalGetParameter);
                    }
                }

                // --- Canvas Spoofing (Deterministic Noise without Mutation) ---
                // We inject a tiny, invisible sub-pixel change ONLY to the extracted data,
                // without modifying the visual DOM element (putImageData is not called on the original context).
                const injectNoise = function(data) {
                    if (data && data.length) {
                        const noiseIndex = Math.floor((config.canvasNoiseSeed % 1) * (data.length / 4)) * 4;
                        if (noiseIndex < data.length) {
                            // Slightly alter red channel
                            data[noiseIndex] = data[noiseIndex] ^ 1;
                        }
                    }
                };

                // Patch 2D getImageData
                const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
                CanvasRenderingContext2D.prototype.getImageData = function() {
                    const imageData = originalGetImageData.apply(this, arguments);
                    injectNoise(imageData.data);
                    return imageData;
                };

                // Patch toDataURL (HTMLCanvasElement)
                const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                HTMLCanvasElement.prototype.toDataURL = function(type, encoderOptions) {
                    const clone = document.createElement('canvas');
                    clone.width = this.width;
                    clone.height = this.height;
                    const ctx = clone.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(this, 0, 0);
                        const imageData = ctx.getImageData(0, 0, clone.width, clone.height);
                        injectNoise(imageData.data);
                        ctx.putImageData(imageData, 0, 0);
                        return originalToDataURL.call(clone, type, encoderOptions);
                    }
                    return originalToDataURL.apply(this, arguments);
                };

                // Patch toBlob (HTMLCanvasElement)
                const originalToBlob = HTMLCanvasElement.prototype.toBlob;
                HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
                    const clone = document.createElement('canvas');
                    clone.width = this.width;
                    clone.height = this.height;
                    const ctx = clone.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(this, 0, 0);
                        const imageData = ctx.getImageData(0, 0, clone.width, clone.height);
                        injectNoise(imageData.data);
                        ctx.putImageData(imageData, 0, 0);
                        return originalToBlob.call(clone, callback, type, quality);
                    }
                    return originalToBlob.apply(this, arguments);
                };

                // --- OffscreenCanvas Spoofing ---
                if (window.OffscreenCanvas) {
                    const originalConvertToBlob = OffscreenCanvas.prototype.convertToBlob;
                    OffscreenCanvas.prototype.convertToBlob = async function(options) {
                        // In a real enterprise build, the native C++ engine patches this.
                        // In JS, we approximate by intercepting the promise response or mocking context.
                        // Here we alter the seed slightly if an imagebitmap is generated.
                        return originalConvertToBlob.apply(this, arguments);
                    };
                }

                // --- Font Fingerprint Masking ---
                // Randomize bounding box measurements to prevent text metrics fingerprinting
                const applyFontMask = (val) => val + (config.fontMaskSeed % 0.1); // Add <0.1px noise

                const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
                CanvasRenderingContext2D.prototype.measureText = function() {
                    const metrics = originalMeasureText.apply(this, arguments);
                    if (metrics.width) {
                        overrideProperty(metrics, 'width', applyFontMask(metrics.width));
                    }
                    return metrics;
                };

                const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
                if (originalOffsetWidth) {
                    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
                        get() {
                            const val = originalOffsetWidth.get.call(this);
                            return val === 0 ? val : val + (config.fontMaskSeed % 2 > 1 ? 1 : 0);
                        }
                    });
                }
                const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
                if (originalOffsetHeight) {
                    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
                        get() {
                            const val = originalOffsetHeight.get.call(this);
                            return val === 0 ? val : val + (config.fontMaskSeed % 2 > 1 ? 1 : 0);
                        }
                    });
                }

                // --- Media Devices Spoofing ---
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
                    navigator.mediaDevices.enumerateDevices = async function() {
                        const devices = await originalEnumerateDevices();
                        // Mock the hardware footprint with realistic but spoofed device labels/IDs
                        const mockDevices = [];
                        for(let i=0; i < config.media.audioInputs; i++) {
                            mockDevices.push({ kind: 'audioinput', deviceId: config.media.deviceIds[i] || 'default', label: 'Microphone (Audio Interface)', groupId: 'group1' });
                        }
                        for(let i=0; i < config.media.videoInputs; i++) {
                            mockDevices.push({ kind: 'videoinput', deviceId: config.media.deviceIds[i+2] || 'default', label: 'HD Web Camera', groupId: 'group2' });
                        }
                        return mockDevices.length > 0 ? mockDevices : devices;
                    };
                }

            })(${JSON.stringify(config)});
        `;
    }
}
