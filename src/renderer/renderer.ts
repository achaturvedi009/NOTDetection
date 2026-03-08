export {};

declare global {
    interface Window {
        electronAPI: {
            getProfiles: () => Promise<{id: string, name: string}[]>;
            createProfile: (name: string, proxyConfig: any) => Promise<any>;
            deleteProfile: (id: string) => Promise<void>;
            launchProfile: (id: string) => Promise<void>;
            getAnalytics: () => Promise<any>;
            getGovernanceData: () => Promise<any>;
        };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Basic DOM elements
    const okBtn = document.getElementById('okBtn') as HTMLButtonElement;
    const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
    const nameInput = document.getElementById('profileName') as HTMLInputElement;
    const proxyTypeSelect = document.getElementById('proxyType') as HTMLSelectElement;
    const proxyHostInput = document.getElementById('proxyHost') as HTMLInputElement;
    const proxyPortInput = document.getElementById('proxyPort') as HTMLInputElement;
    const proxyUsernameInput = document.getElementById('proxyUsername') as HTMLInputElement;
    const proxyPasswordInput = document.getElementById('proxyPassword') as HTMLInputElement;
    const proxyConfigSection = document.getElementById('proxyConfigSection') as HTMLDivElement;
    const pasteProxyBtn = document.getElementById('pasteProxyBtn') as HTMLButtonElement;
    const newFpBtn = document.getElementById('newFpBtn') as HTMLButtonElement;

    // Tab switching logic
    const tabs = document.querySelectorAll('.tab');
    const tabContent = document.getElementById('tabContent');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            tab.classList.add('active');

            const tabName = tab.getAttribute('data-tab');

            // Note: In a complete implementation, we'd render the full HTML for Platform, Fingerprint, Advanced.
            // Here, we just toggle visibility between General and Proxy panes.
            tabPanes.forEach((pane: any) => {
                if (pane.id === `${tabName}-tab`) {
                    pane.classList.remove('hidden');
                } else {
                    pane.classList.add('hidden');
                }
            });
        });
    });

    // Initialize tab visibility
    const initTabs = () => {
        tabPanes.forEach((pane: any) => {
            if (pane.id !== 'general-tab') {
                pane.classList.add('hidden');
            }
        });
    };
    initTabs();

    // Proxy type select listener to show/hide host/port
    proxyTypeSelect.addEventListener('change', () => {
        if (proxyTypeSelect.value === 'direct') {
            proxyConfigSection.classList.add('hidden');
        } else {
            proxyConfigSection.classList.remove('hidden');
        }
    });

    // Paste Proxy logic
    pasteProxyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const text = await navigator.clipboard.readText();
            let str = text.trim();
            let type = 'http';

            if (str.includes('://')) {
                const parts = str.split('://');
                type = parts[0].toLowerCase();
                str = parts[1];

                // Set the type if it exists in the select options
                const optionExists = Array.from(proxyTypeSelect.options).some(opt => opt.value === type);
                if (optionExists) {
                    proxyTypeSelect.value = type;
                }
            }

            // Expected format: host:port:username:password
            const parts = str.split(':');
            if (parts.length >= 2) {
                proxyHostInput.value = parts[0];
                proxyPortInput.value = parts[1];
                if (parts.length >= 4) {
                    proxyUsernameInput.value = parts[2];
                    proxyPasswordInput.value = parts[3];
                } else {
                    proxyUsernameInput.value = '';
                    proxyPasswordInput.value = '';
                }
            } else {
                alert('Invalid proxy format. Expected: host:port or host:port:username:password');
            }
        } catch (err) {
            console.error('Failed to read clipboard', err);
            alert('Failed to read clipboard. Please ensure you have granted clipboard permissions.');
        }
    });

    // Generate new FP button effect (visual only for now)
    newFpBtn.addEventListener('click', () => {
        const hash = Math.random().toString(16).substring(2, 10).toUpperCase();
        const canvasFp = document.querySelectorAll('.fp-value')[9]; // Canvas
        if (canvasFp) canvasFp.textContent = `Noise [${hash}]`;
    });

    // Create Profile (OK button)
    okBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim() || `Profile_${Math.random().toString(36).substring(2, 6)}`;

        const proxyType = proxyTypeSelect.value;
        let proxyConfig: any = { type: proxyType };

        if (proxyType !== 'direct') {
            const host = proxyHostInput.value.trim();
            const port = parseInt(proxyPortInput.value.trim());
            const username = proxyUsernameInput.value.trim();
            const password = proxyPasswordInput.value.trim();

            if (!host || isNaN(port)) {
                alert('Proxy host and port are required for non-direct proxies');
                // Switch to proxy tab to show the error context
                (document.querySelector('.tab[data-tab="proxy"]') as HTMLElement).click();
                return;
            }

            proxyConfig.host = host;
            proxyConfig.port = port;
            if (username) proxyConfig.username = username;
            if (password) proxyConfig.password = password;
        }

        try {
            await window.electronAPI.createProfile(name, proxyConfig);
            alert(`Profile "${name}" created successfully!`);
            // In a real app, you would redirect back to the profiles list view.
            // For now, reset the form.
            nameInput.value = '';
            proxyTypeSelect.value = 'direct';
            proxyTypeSelect.dispatchEvent(new Event('change'));
            proxyHostInput.value = '';
            proxyPortInput.value = '';
        } catch (error) {
            console.error(error);
            alert(`Failed to create profile: ${error}`);
        }
    });

    cancelBtn.addEventListener('click', () => {
        alert('Operation cancelled (Return to dashboard)');
    });
});
