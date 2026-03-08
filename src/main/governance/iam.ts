import * as crypto from 'crypto';
import { GovernanceDataWarehouse } from './database';
import { User, UserRole, hasPermission } from './models';

export class IdentityAccessManager {
    private db: GovernanceDataWarehouse;
    private saltRounds = 16;
    private keyLength = 64;

    constructor(db: GovernanceDataWarehouse) {
        this.db = db;
    }

    public async initializeDefaultAdmin(): Promise<void> {
        const admin = await this.db.getUser('admin');
        if (!admin) {
            console.log('[IAM] Creating default System Administrator account...');
            const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';
            const hash = this.hashPassword(defaultPassword);
            await this.db.createUser('admin', hash, 'system_admin', 'global');
            console.log(`[IAM] Default admin created with password: ${defaultPassword}`);
        }
    }

    public hashPassword(password: string): string {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, this.keyLength).toString('hex');
        return `${salt}:${hash}`;
    }

    public async authenticate(username: string, passwordAttempt: string): Promise<User | null> {
        const user = await this.db.getUser(username);
        if (!user) return null;

        const [salt, originalHash] = user.passwordHash.split(':');
        const attemptHash = crypto.scryptSync(passwordAttempt, salt, this.keyLength).toString('hex');

        if (crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(attemptHash))) {
            this.db.recordAudit({
                userId: user.id,
                action: 'login_success',
                severity: 'info',
                details: {}
            });
            return user;
        }

        this.db.recordAudit({
            userId: user.id,
            action: 'login_failure',
            severity: 'warning',
            details: { reason: 'invalid_password' }
        });
        return null;
    }

    public authorize(user: User, requiredPermission: string): boolean {
        const allowed = hasPermission(user.role, requiredPermission);
        if (!allowed) {
            this.db.recordAudit({
                userId: user.id,
                action: 'unauthorized_access_attempt',
                severity: 'warning',
                details: { requiredPermission }
            });
        }
        return allowed;
    }
}
