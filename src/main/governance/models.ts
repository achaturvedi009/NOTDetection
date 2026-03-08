export type UserRole = 'system_admin' | 'operations_manager' | 'analyst' | 'automation_operator' | 'read_only_observer';

export interface User {
    id: string;
    username: string;
    passwordHash: string;
    role: UserRole;
    workspaceId: string;
    createdAt: Date;
    lastLogin?: Date;
}

export interface Workspace {
    id: string;
    name: string;
    maxProfiles: number;
    maxConcurrentSessions: number;
}

export interface EnterprisePolicy {
    id: string;
    workspaceId: string; // 'global' for system-wide
    allowedProxyTypes: ('http' | 'https' | 'socks4' | 'socks5' | 'direct')[];
    allowedOsTemplates: ('Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS')[];
    enforceBehavioralSimulation: boolean;
    requireProxyRotation: boolean;
}

export interface AuditEvent {
    id: string;
    timestamp: number;
    userId: string;
    action: string;
    resourceId?: string;
    details: any;
    severity: 'info' | 'warning' | 'critical';
}

export const RBAC_MATRIX: Record<UserRole, string[]> = {
    system_admin: ['*'],
    operations_manager: ['read_profile', 'write_profile', 'execute_task', 'read_analytics', 'read_audit'],
    automation_operator: ['read_profile', 'execute_task'],
    analyst: ['read_profile', 'read_analytics', 'read_audit'],
    read_only_observer: ['read_profile', 'read_analytics']
};

export function hasPermission(role: UserRole, permission: string): boolean {
    const perms = RBAC_MATRIX[role] || [];
    return perms.includes('*') || perms.includes(permission);
}
