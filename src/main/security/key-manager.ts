import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export class KeyManager {
    /**
     * Resolves the Master Key for the AES-256 Storage Layer.
     * Uses the ENV var first. If not present, generates a highly secure random 256-bit key
     * and persists it to a local locked file.
     */
    public static resolveMasterKey(dataPath: string): string {
        const envKey = process.env.ANTI_DETECT_MASTER_KEY;
        if (envKey) return envKey;

        const keyFile = path.join(dataPath, 'master.key');

        if (fs.existsSync(keyFile)) {
            return fs.readFileSync(keyFile, 'utf8');
        } else {
            console.log('[KeyManager] No master key provided. Generating a persistent random 256-bit vault key.');
            if (!fs.existsSync(dataPath)) {
                fs.mkdirSync(dataPath, { recursive: true });
            }

            const newKey = crypto.randomBytes(32).toString('hex');

            // Restrict file permissions so only the owner can read/write this key (0o600)
            fs.writeFileSync(keyFile, newKey, { mode: 0o600 });
            return newKey;
        }
    }
}
