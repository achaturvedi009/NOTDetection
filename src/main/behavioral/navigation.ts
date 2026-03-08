import { Page } from 'puppeteer-core';
import { BehavioralConfig } from '../profile/models';

export class NavigationSimulator {
    private page: Page;
    private config: BehavioralConfig;
    private historyList: string[] = [];

    constructor(page: Page, config: BehavioralConfig) {
        this.page = page;
        this.config = config;
    }

    /**
     * Revisit patterns: users often navigate back after reading a linked article.
     */
    public async tryRevisit(): Promise<boolean> {
        if (this.historyList.length > 2 && Math.random() < 0.15) {
            // 15% chance to hit the Back button if deep into navigation
            await this.page.goBack({ waitUntil: 'networkidle2' });
            this.historyList.pop(); // Remove current
            return true;
        }
        return false;
    }

    public recordNavigation(url: string) {
        this.historyList.push(url);
    }
}
