import sqlite3 from 'sqlite3';
import { Database, RunResult } from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { EncryptionManager } from '../security/encryption';

// Promisify sqlite3 methods to support modern async/await patterns
export class StorageLayer {
    private db: Database | null = null;
    private dbPath: string;
    private encryption: EncryptionManager;

    constructor(dbDirectory: string, encryptionManager: EncryptionManager) {
        this.encryption = encryptionManager;
        if (!fs.existsSync(dbDirectory)) {
            fs.mkdirSync(dbDirectory, { recursive: true });
        }
        this.dbPath = path.join(dbDirectory, 'profiles.db');
    }

    public async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) return reject(err);

                // Create profiles table
                const initQuery = `
                    CREATE TABLE IF NOT EXISTS profiles (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        encryptedData TEXT NOT NULL,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `;

                this.db?.run(initQuery, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    public async insertProfile(id: string, name: string, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not initialized.'));

            const jsonString = JSON.stringify(data);
            const encryptedData = this.encryption.encrypt(jsonString);

            const query = `INSERT INTO profiles (id, name, encryptedData) VALUES (?, ?, ?)`;
            this.db.run(query, [id, name, encryptedData], function(this: RunResult, err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    public async getProfile(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not initialized.'));

            const query = `SELECT encryptedData FROM profiles WHERE id = ?`;
            this.db.get(query, [id], (err, row: any) => {
                if (err) return reject(err);
                if (!row) return resolve(null);

                try {
                    const decryptedString = this.encryption.decrypt(row.encryptedData);
                    const data = JSON.parse(decryptedString);
                    resolve(data);
                } catch (e) {
                    reject(new Error('Failed to decrypt profile data.'));
                }
            });
        });
    }

    public async getAllProfiles(): Promise<{id: string, name: string}[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not initialized.'));

            const query = `SELECT id, name FROM profiles ORDER BY createdAt DESC`;
            this.db.all(query, [], (err, rows: any[]) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });
    }

    public async deleteProfile(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Database not initialized.'));

            const query = `DELETE FROM profiles WHERE id = ?`;
            this.db.run(query, [id], function(this: RunResult, err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}
