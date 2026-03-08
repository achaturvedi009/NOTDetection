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
    const profilesList = document.getElementById('profiles') as HTMLUListElement;
    const createBtn = document.getElementById('createBtn') as HTMLButtonElement;
    const nameInput = document.getElementById('profileName') as HTMLInputElement;
    const proxyTypeSelect = document.getElementById('proxyType') as HTMLSelectElement;
    const proxyHostInput = document.getElementById('proxyHost') as HTMLInputElement;
    const proxyPortInput = document.getElementById('proxyPort') as HTMLInputElement;

    async function loadProfiles() {
        profilesList.innerHTML = '';
        const profiles = await window.electronAPI.getProfiles();

        profiles.forEach((p: any) => {
            const li = document.createElement('li');
            li.className = 'profile-item';

            // Defend against XSS by using textContent for user-provided data
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${p.name} (${p.id.substring(0,8)})`;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'profile-actions';
            actionsDiv.innerHTML = `
                <button onclick="launchProfile('${p.id}')">Launch</button>
                <button onclick="deleteProfile('${p.id}')" style="background:#dc3545;">Delete</button>
            `;

            li.appendChild(nameSpan);
            li.appendChild(actionsDiv);
            profilesList.appendChild(li);
        });
    }

    createBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (!name) return alert('Profile name required');

        const proxyType = proxyTypeSelect.value;
        let proxyConfig: any = { type: proxyType };

        if (proxyType !== 'direct') {
            const host = proxyHostInput.value.trim();
            const port = parseInt(proxyPortInput.value.trim());

            if (!host || isNaN(port)) {
                return alert('Proxy host and port are required for non-direct proxies');
            }

            proxyConfig.host = host;
            proxyConfig.port = port;
        }

        await window.electronAPI.createProfile(name, proxyConfig);
        nameInput.value = '';
        proxyHostInput.value = '';
        proxyPortInput.value = '';
        proxyTypeSelect.value = 'direct';
        await loadProfiles();
    });

    (window as any).launchProfile = async (id: string) => {
        await window.electronAPI.launchProfile(id);
    };

    (window as any).deleteProfile = async (id: string) => {
        await window.electronAPI.deleteProfile(id);
        await loadProfiles();
    };

    async function loadAnalytics() {
        const analyticsContent = document.getElementById('analyticsContent')!;
        try {
            const data = await window.electronAPI.getAnalytics();
            analyticsContent.textContent = JSON.stringify(data, null, 2);
        } catch (e) {
            analyticsContent.textContent = 'Failed to load analytics: ' + e;
        }
    }

    async function loadGovernance() {
        const govContent = document.getElementById('governanceContent')!;
        try {
            const data = await window.electronAPI.getGovernanceData();
            govContent.textContent = JSON.stringify(data, null, 2);
        } catch (e) {
            govContent.textContent = 'Failed to load governance data: ' + e;
        }
    }

    await loadProfiles();
    await loadAnalytics();
    await loadGovernance();

    // Refresh analytics periodically
    setInterval(() => {
        loadAnalytics();
        loadGovernance();
    }, 15000);
});
