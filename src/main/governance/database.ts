import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { User, UserRole, Workspace, EnterprisePolicy, AuditEvent } from './models';
import { v4 as uuidv4 } from 'uuid';

export class GovernanceDataWarehouse {
    private db: Database | null = null;
    private dbPath: string;

    constructor(dbDirectory: string) {
        if (!fs.existsSync(dbDirectory)) {
            fs.mkdirSync(dbDirectory, { recursive: true });
        }
        this.dbPath = path.join(dbDirectory, 'governance.db');
    }

    public async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) return reject(err);

                this.db?.run('PRAGMA journal_mode = WAL;');

                const initQuery = `
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        username TEXT UNIQUE NOT NULL,
                        passwordHash TEXT NOT NULL,
                        role TEXT NOT NULL,
                        workspaceId TEXT NOT NULL,
                        createdAt INTEGER NOT NULL,
                        lastLogin INTEGER
                    );
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id TEXT PRIMARY KEY,
                        timestamp INTEGER NOT NULL,
                        userId TEXT NOT NULL,
                        action TEXT NOT NULL,
                        resourceId TEXT,
                        details TEXT,
                        severity TEXT
                    );
                `;

                this.db?.exec(initQuery, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    public async getUser(username: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('DB not initialized'));
            this.db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row: any) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                resolve({
                    ...row,
                    createdAt: new Date(row.createdAt),
                    lastLogin: row.lastLogin ? new Date(row.lastLogin) : undefined
                });
            });
        });
    }

    public async createUser(username: string, passwordHash: string, role: UserRole, workspaceId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('DB not initialized'));
            const id = uuidv4();
            const now = Date.now();
            this.db.run(
                `INSERT INTO users (id, username, passwordHash, role, workspaceId, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, username, passwordHash, role, workspaceId, now],
                (err) => err ? reject(err) : resolve()
            );
        });
    }

    public recordAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
        if (!this.db) return;
        const id = uuidv4();
        const timestamp = Date.now();
        this.db.run(
            `INSERT INTO audit_logs (id, timestamp, userId, action, resourceId, details, severity) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, timestamp, event.userId, event.action, event.resourceId, JSON.stringify(event.details), event.severity]
        );
    }

    public async getAuditLogs(limit: number = 50): Promise<AuditEvent[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('DB not initialized'));
            this.db.all(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`, [limit], (err, rows: any[]) => {
                if (err) return reject(err);
                const logs = rows.map(r => ({
                    ...r,
                    details: JSON.parse(r.details)
                }));
                resolve(logs);
            });
        });
    }

    public async getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('DB not initialized'));
            this.db.all(`SELECT id, username, role, workspaceId, createdAt, lastLogin FROM users`, (err, rows: any[]) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}
