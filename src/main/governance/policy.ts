import { EnterprisePolicy, User } from './models';
import { Profile } from '../profile/models';

export class EnterprisePolicyEngine {
    private globalPolicy: EnterprisePolicy;

    constructor() {
        // In a real system, this would load from GovernanceDataWarehouse
        this.globalPolicy = {
            id: 'policy_global_default',
            workspaceId: 'global',
            allowedProxyTypes: ['socks5', 'https', 'direct', 'http'],
            allowedOsTemplates: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'], // Use strict model types
            enforceBehavioralSimulation: true,
            requireProxyRotation: true
        };
    }

    public validateProfileCreation(user: User, profile: Profile): void {
        if (!this.globalPolicy.allowedProxyTypes.includes(profile.proxy.type)) {
            throw new Error(`Governance Policy Violation: Proxy type '${profile.proxy.type}' is not allowed by enterprise policy.`);
        }

        const isAllowedOs = this.globalPolicy.allowedOsTemplates.some(allowedOs => {
            const osString = profile.fingerprint.hardware.os;
            if (allowedOs === 'macOS') return osString.includes('Mac OS');
            return osString.includes(allowedOs);
        });

        if (!isAllowedOs) {
            throw new Error(`Governance Policy Violation: OS '${profile.fingerprint.hardware.os}' is restricted by enterprise templates.`);
        }
    }

    public validateTaskExecution(user: User, profile: Profile): void {
        if (this.globalPolicy.requireProxyRotation && profile.health.threatLevel === 'critical') {
            throw new Error('Governance Policy Violation: Profile is at CRITICAL threat level and proxy must be rotated before execution.');
        }
    }
}
