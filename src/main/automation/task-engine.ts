import { BrowserSessionController } from './session';
import { SelfHealingActionEngine } from '../detection/self-healing';

export interface AutomationTaskStep {
    action: 'navigate' | 'click' | 'type' | 'scroll';
    target?: string;
    value?: string | number;
}

export interface AutomationWorkflow {
    name: string;
    steps: AutomationTaskStep[];
}

export class TaskExecutionEngine {

    /**
     * Executes a declarative, multi-step JSON workflow within the behavioral constraints.
     */
    public static async runWorkflow(session: BrowserSessionController, workflow: AutomationWorkflow): Promise<void> {
        console.log(`[TaskEngine] Starting workflow: ${workflow.name}`);

        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            console.log(`[TaskEngine] Executing step ${i+1}: ${step.action}`);

            // Proactive Detection Check before stepping
            await SelfHealingActionEngine.evaluateAndHeal(session.profile, session);

            // If profile burned mid-session, abort safely
            if (session.profile.health.threatLevel === 'critical') {
                throw new Error(`Workflow aborted: Profile reached CRITICAL threat level and requires proxy rotation/rebalance.`);
            }

            try {
                await this.executeStep(session, step);
            } catch (error) {
                console.error(`[TaskEngine] Step ${i+1} failed. Applying retry logic...`);

                // Assess if the failure was due to a block/captcha before retrying blindly
                await SelfHealingActionEngine.evaluateAndHeal(session.profile, session);

                // Simple 1-time retry logic with a behavioral pause
                await new Promise(r => setTimeout(r, 2000));
                try {
                    await this.executeStep(session, step);
                } catch (retryError) {
                    throw new Error(`Workflow failed at step ${i+1}: ${retryError}`);
                }
            }
        }

        console.log(`[TaskEngine] Workflow ${workflow.name} completed successfully.`);
    }

    private static async executeStep(session: BrowserSessionController, step: AutomationTaskStep): Promise<void> {
        switch (step.action) {
            case 'navigate':
                if (typeof step.value === 'string') {
                    await session.commands.navigate(step.value);
                }
                break;
            case 'click':
                if (step.target) {
                    await session.commands.clickElement(step.target);
                }
                break;
            case 'type':
                if (step.target && typeof step.value === 'string') {
                    await session.commands.typeText(step.target, step.value);
                }
                break;
            case 'scroll':
                if (typeof step.value === 'number') {
                    await session.commands.scrollPage(step.value);
                }
                break;
            default:
                throw new Error(`Unknown action: ${step.action}`);
        }
    }
}
