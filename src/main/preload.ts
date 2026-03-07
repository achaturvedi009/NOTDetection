import { contextBridge, ipcRenderer } from 'electron';

// Expose API to the renderer process safely
contextBridge.exposeInMainWorld('electronAPI', {
    getProfiles: () => ipcRenderer.invoke('get-profiles'),
    createProfile: (name: string, proxyConfig: any) => ipcRenderer.invoke('create-profile', name, proxyConfig),
    deleteProfile: (id: string) => ipcRenderer.invoke('delete-profile', id),
    launchProfile: (id: string) => ipcRenderer.invoke('launch-profile', id),
});
