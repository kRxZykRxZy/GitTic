import * as cron from "node-cron";
import YAML from "yaml";
import { parseWorkflowTriggers } from "../../../cluster/dist/workflow-compiler.js";

/**
 * Cron Workflow Scheduler
 * 
 * Manages scheduled workflow executions using cron expressions
 */

interface ScheduledWorkflow {
  id: string;
  repositoryId: string;
  workflowPath: string;
  yaml: string;
  cronExpression: string;
  task?: cron.ScheduledTask;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
}

// In-memory store of scheduled workflows
const scheduledWorkflows = new Map<string, ScheduledWorkflow>();

/**
 * Parse cron expressions from workflow YAML
 */
function extractCronSchedules(yaml: string): string[] {
  try {
    const workflow = YAML.parse(yaml);
    const triggers = parseWorkflowTriggers(workflow.on);
    return triggers.schedule || [];
  } catch (error) {
    console.error("[Cron] Failed to parse workflow:", error);
    return [];
  }
}

/**
 * Schedule a workflow with cron expression
 */
export function scheduleWorkflow(
  repositoryId: string,
  workflowPath: string,
  yaml: string
): { scheduled: number; errors: string[] } {
  const cronExpressions = extractCronSchedules(yaml);
  
  if (cronExpressions.length === 0) {
    return { scheduled: 0, errors: [] };
  }

  let scheduled = 0;
  const errors: string[] = [];

  for (const cronExpression of cronExpressions) {
    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        errors.push(`Invalid cron expression: ${cronExpression}`);
        continue;
      }

      const scheduleId = `${repositoryId}:${workflowPath}:${cronExpression}`;

      // Cancel existing schedule if any
      if (scheduledWorkflows.has(scheduleId)) {
        const existing = scheduledWorkflows.get(scheduleId)!;
        existing.task?.stop();
        scheduledWorkflows.delete(scheduleId);
      }

      // Create new scheduled task
      const task = cron.schedule(cronExpression, async () => {
        console.log(`[Cron] Executing scheduled workflow: ${workflowPath}`);
        console.log(`[Cron] Repository: ${repositoryId}`);
        console.log(`[Cron] Cron: ${cronExpression}`);

        const workflow = scheduledWorkflows.get(scheduleId);
        if (!workflow) return;

        // Update last run time
        workflow.lastRun = new Date();

        // TODO: Trigger workflow execution
        // This should call the workflow execution API
        try {
          await executeScheduledWorkflow(repositoryId, yaml);
        } catch (error) {
          console.error(`[Cron] Failed to execute workflow:`, error);
        }
      }, {
        timezone: "UTC",
      });

      // Store scheduled workflow
      scheduledWorkflows.set(scheduleId, {
        id: scheduleId,
        repositoryId,
        workflowPath,
        yaml,
        cronExpression,
        task,
        enabled: true,
        nextRun: getNextRunTime(cronExpression),
      });

      scheduled++;
      console.log(`[Cron] Scheduled workflow: ${workflowPath} with cron: ${cronExpression}`);
    } catch (error: any) {
      errors.push(`Failed to schedule cron ${cronExpression}: ${error.message}`);
    }
  }

  return { scheduled, errors };
}

/**
 * Execute a scheduled workflow
 */
async function executeScheduledWorkflow(
  repositoryId: string,
  yaml: string
): Promise<void> {
  // TODO: Call workflow execution API
  // This is a placeholder - should make HTTP request to /api/v1/workflows/execute
  console.log(`[Cron] Would execute workflow for repository: ${repositoryId}`);
}

/**
 * Get next run time for a cron expression
 */
function getNextRunTime(cronExpression: string): Date {
  // Simple approximation - for production, use a proper cron parser
  return new Date(Date.now() + 60000); // 1 minute from now
}

/**
 * Unschedule a workflow
 */
export function unscheduleWorkflow(
  repositoryId: string,
  workflowPath: string,
  cronExpression?: string
): number {
  let unscheduled = 0;

  if (cronExpression) {
    const scheduleId = `${repositoryId}:${workflowPath}:${cronExpression}`;
    const workflow = scheduledWorkflows.get(scheduleId);
    
    if (workflow) {
      workflow.task?.stop();
      scheduledWorkflows.delete(scheduleId);
      unscheduled++;
      console.log(`[Cron] Unscheduled: ${scheduleId}`);
    }
  } else {
    // Unschedule all for this workflow
    for (const [id, workflow] of scheduledWorkflows.entries()) {
      if (workflow.repositoryId === repositoryId && workflow.workflowPath === workflowPath) {
        workflow.task?.stop();
        scheduledWorkflows.delete(id);
        unscheduled++;
        console.log(`[Cron] Unscheduled: ${id}`);
      }
    }
  }

  return unscheduled;
}

/**
 * Get all scheduled workflows
 */
export function getScheduledWorkflows(repositoryId?: string): ScheduledWorkflow[] {
  const workflows: ScheduledWorkflow[] = [];

  for (const workflow of scheduledWorkflows.values()) {
    if (!repositoryId || workflow.repositoryId === repositoryId) {
      workflows.push({
        ...workflow,
        task: undefined, // Don't serialize the task
      });
    }
  }

  return workflows;
}

/**
 * Get scheduled workflows for a repository
 */
export function getRepositorySchedules(repositoryId: string): {
  workflowPath: string;
  cronExpression: string;
  nextRun?: Date;
  lastRun?: Date;
  enabled: boolean;
}[] {
  const schedules: any[] = [];

  for (const workflow of scheduledWorkflows.values()) {
    if (workflow.repositoryId === repositoryId) {
      schedules.push({
        workflowPath: workflow.workflowPath,
        cronExpression: workflow.cronExpression,
        nextRun: workflow.nextRun,
        lastRun: workflow.lastRun,
        enabled: workflow.enabled,
      });
    }
  }

  return schedules;
}

/**
 * Enable or disable a scheduled workflow
 */
export function toggleSchedule(
  repositoryId: string,
  workflowPath: string,
  cronExpression: string,
  enabled: boolean
): boolean {
  const scheduleId = `${repositoryId}:${workflowPath}:${cronExpression}`;
  const workflow = scheduledWorkflows.get(scheduleId);

  if (!workflow) {
    return false;
  }

  if (enabled && !workflow.enabled) {
    workflow.task?.start();
    workflow.enabled = true;
    console.log(`[Cron] Enabled: ${scheduleId}`);
  } else if (!enabled && workflow.enabled) {
    workflow.task?.stop();
    workflow.enabled = false;
    console.log(`[Cron] Disabled: ${scheduleId}`);
  }

  return true;
}

/**
 * Get statistics about scheduled workflows
 */
export function getSchedulerStats() {
  const total = scheduledWorkflows.size;
  let enabled = 0;
  let disabled = 0;

  for (const workflow of scheduledWorkflows.values()) {
    if (workflow.enabled) {
      enabled++;
    } else {
      disabled++;
    }
  }

  return {
    total,
    enabled,
    disabled,
  };
}

/**
 * Parse and display cron expression in human-readable format
 */
export function describeCron(cronExpression: string): string {
  const parts = cronExpression.split(" ");
  
  if (parts.length !== 5) {
    return "Invalid cron expression";
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Simple descriptions for common patterns
  if (cronExpression === "0 0 * * *") {
    return "Daily at midnight UTC";
  }
  if (cronExpression === "0 */6 * * *") {
    return "Every 6 hours";
  }
  if (cronExpression === "0 0 * * 0") {
    return "Weekly on Sunday at midnight UTC";
  }
  if (cronExpression === "0 0 1 * *") {
    return "Monthly on the 1st at midnight UTC";
  }
  if (cronExpression === "*/15 * * * *") {
    return "Every 15 minutes";
  }
  if (cronExpression === "0 9 * * 1-5") {
    return "Weekdays at 9:00 AM UTC";
  }

  // Generic description
  return `At ${hour}:${minute} on ${dayOfMonth}/${month} (day ${dayOfWeek})`;
}
