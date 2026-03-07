import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export class EncryptionManager {
    private readonly algorithm = 'aes-256-gcm';
    private readonly ivLength = 16;
    private readonly saltLength = 64;
    private readonly keyLength = 32;

    private masterKey: Buffer | null = null;
    private dataPath: string;

    constructor(dataPath: string) {
        this.dataPath = dataPath;
    }

    /**
     * Initializes the encryption manager.
     * Generates a new salt if it doesn't exist, otherwise loads the existing one to persist keys.
     */
    public initialize(password: string): void {
        const saltPath = path.join(this.dataPath, 'salt.bin');
        let salt: Buffer;

        if (fs.existsSync(saltPath)) {
            salt = fs.readFileSync(saltPath);
        } else {
            salt = crypto.randomBytes(this.saltLength);
            if (!fs.existsSync(this.dataPath)) {
                fs.mkdirSync(this.dataPath, { recursive: true });
            }
            fs.writeFileSync(saltPath, salt);
        }

        // Derive key using PBKDF2
        this.masterKey = crypto.pbkdf2Sync(
            password,
            salt,
            100000,
            this.keyLength,
            'sha256'
        );
    }

    public encrypt(text: string): string {
        if (!this.masterKey) {
            throw new Error('EncryptionManager not initialized. Call initialize() first.');
        }

        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: IV:AuthTag:EncryptedData
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    public decrypt(encryptedData: string): string {
        if (!this.masterKey) {
            throw new Error('EncryptionManager not initialized. Call initialize() first.');
        }

        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format.');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
