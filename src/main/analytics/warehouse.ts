import sqlite3 from 'sqlite3';
import { Database, RunResult } from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { TelemetryEvent, TelemetryCategory } from './models';

export class AnalyticsDataWarehouse {
    private db: Database | null = null;
    private dbPath: string;

    constructor(dbDirectory: string) {
        if (!fs.existsSync(dbDirectory)) {
            fs.mkdirSync(dbDirectory, { recursive: true });
        }
        this.dbPath = path.join(dbDirectory, 'analytics.db');
    }

    public async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) return reject(err);

                // Use WAL mode for better concurrency handling during high-throughput ingestion
                this.db?.run('PRAGMA journal_mode = WAL;');

                const initQuery = `
                    CREATE TABLE IF NOT EXISTS telemetry (
                        id TEXT PRIMARY KEY,
                        profileId TEXT NOT NULL,
                        category TEXT NOT NULL,
                        timestamp INTEGER NOT NULL,
                        data JSON NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS idx_telemetry_profile ON telemetry(profileId);
                    CREATE INDEX IF NOT EXISTS idx_telemetry_category ON telemetry(category);
                    CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry(timestamp);
                `;

                this.db?.exec(initQuery, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    public recordEvent(profileId: string, category: TelemetryCategory, data: any): void {
        if (!this.db) return;

        const event: TelemetryEvent = {
            id: uuidv4(),
            profileId,
            category,
            timestamp: Date.now(),
            data
        };

        const query = `INSERT INTO telemetry (id, profileId, category, timestamp, data) VALUES (?, ?, ?, ?, ?)`;
        this.db.run(query, [event.id, event.profileId, event.category, event.timestamp, JSON.stringify(event.data)], (err) => {
            if (err) console.error(`[Analytics] Failed to ingest telemetry event:`, err);
        });
    }

    public async queryEvents(category?: TelemetryCategory, sinceTimestamp?: number, limit: number = 100): Promise<TelemetryEvent[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error('Analytics DB not initialized.'));

            let query = `SELECT * FROM telemetry WHERE 1=1`;
            const params: any[] = [];

            if (category) {
                query += ` AND category = ?`;
                params.push(category);
            }
            if (sinceTimestamp) {
                query += ` AND timestamp >= ?`;
                params.push(sinceTimestamp);
            }

            query += ` ORDER BY timestamp DESC LIMIT ?`;
            params.push(limit);

            this.db.all(query, params, (err, rows: any[]) => {
                if (err) return reject(err);

                const events = rows.map(r => ({
                    ...r,
                    data: JSON.parse(r.data)
                }));
                resolve(events);
            });
        });
    }
}
