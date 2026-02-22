import YAML from "yaml";

/**
 * Workflow YAML Compiler
 * 
 * Compiles .gittic/workflows/*.yaml files into Docker execution scripts
 * Respects user subscription resource limits
 */

interface WorkflowYAML {
    name: string;
    on: string | string[] | Record<string, any>;
    jobs: Record<string, WorkflowJob>;
    env?: Record<string, string>;
}

/**
 * Parse workflow triggers
 */
export function parseWorkflowTriggers(on: WorkflowYAML["on"]): {
    events: string[];
    schedule?: string[];
} {
    const result: { events: string[]; schedule?: string[] } = {
        events: [],
    };

    if (typeof on === "string") {
        result.events = [on];
    } else if (Array.isArray(on)) {
        result.events = on;
    } else if (typeof on === "object") {
        // Handle object format: { push: {...}, schedule: [...] }
        for (const [key, value] of Object.entries(on)) {
            if (key === "schedule") {
                // Schedule format: [{ cron: "0 0 * * *" }]
                if (Array.isArray(value)) {
                    result.schedule = value.map((item: any) => item.cron);
                }
            } else {
                result.events.push(key);
            }
        }
    }

    return result;
}

interface WorkflowJob {
    "runs-on": string;
    image?: string;
    env?: Record<string, string>;
    steps: WorkflowStep[];
    needs?: string | string[];
    timeout?: number;
    resources?: {
        cores?: number;
        memory?: string; // e.g., "4GB", "512MB"
    };
}

interface WorkflowStep {
    name?: string;
    run?: string;
    env?: Record<string, string>;
}

interface CompiledWorkflow {
    dockerfile: string;
    entrypoint: string;
    resources: {
        cores: number;
        memoryMB: number;
    };
    env: Record<string, string>;
    timeout: number;
}

/**
 * Parse memory string to MB
 */
function parseMemory(memory: string): number {
    const match = memory.match(/^(\d+(?:\.\d+)?)(GB|MB|G|M)?$/i);
    if (!match) throw new Error(`Invalid memory format: ${memory}`);

    const value = parseFloat(match[1]);
    const unit = (match[2] || "MB").toUpperCase();

    if (unit === "GB" || unit === "G") {
        return value * 1024;
    }
    return value;
}

/**
 * Compile workflow YAML to Docker execution
 */
export function compileWorkflow(
    yamlContent: string,
    userLimits: { cores: number; memoryGB: number }
): CompiledWorkflow {
    const workflow = YAML.parse(yamlContent) as WorkflowYAML;

    // Validate workflow structure
    if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
        throw new Error("Workflow must have at least one job");
    }

    // For now, compile the first job (in production, handle job dependencies)
    const jobName = Object.keys(workflow.jobs)[0];
    const job = workflow.jobs[jobName];

    // Determine base image
    const baseImage = job.image || "ubuntu:22.04";

    // Resources are determined ONLY by user subscription tier
    // Users CANNOT specify cores/memory in YAML - it's ignored
    const allocatedCores = userLimits.cores;
    const allocatedMemoryMB = userLimits.memoryGB * 1024;

    console.log(`[Compiler] Using tier limits: ${allocatedCores} cores, ${userLimits.memoryGB}GB RAM`)

    // Compile environment variables
    const env: Record<string, string> = {
        ...workflow.env,
        ...job.env,
        CI: "true",
        GITTIC: "true",
    };

    // Generate Dockerfile
    const dockerfile = generateDockerfile(baseImage, job.steps, env);

    // Generate entrypoint script
    const entrypoint = generateEntrypoint(job.steps);

    return {
        dockerfile,
        entrypoint,
        resources: {
            cores: allocatedCores,
            memoryMB: allocatedMemoryMB,
        },
        env,
        timeout: job.timeout || 3600, // 1 hour default
    };
}

/**
 * Generate Dockerfile from job specification
 */
function generateDockerfile(
    baseImage: string,
    steps: WorkflowStep[],
    globalEnv: Record<string, string>
): string {
    const lines: string[] = [];

    // Use the actual image specified in the workflow
    lines.push(`FROM ${baseImage}`);
    lines.push("");
    lines.push("# GitTic Workflow Container");
    lines.push("");

    // Set working directory
    lines.push("WORKDIR /workspace");
    lines.push("");

    // Set environment variables
    if (Object.keys(globalEnv).length > 0) {
        lines.push("# Environment variables");
        for (const [key, value] of Object.entries(globalEnv)) {
            lines.push(`ENV ${key}="${value}"`);
        }
        lines.push("");
    }

    // Copy entrypoint script
    lines.push("# Copy workflow entrypoint");
    lines.push("COPY entrypoint.sh /entrypoint.sh");
    lines.push("RUN chmod +x /entrypoint.sh");
    lines.push("");

    lines.push('ENTRYPOINT ["/entrypoint.sh"]');

    return lines.join("\n");
}

/**
 * Generate entrypoint script from workflow steps
 */
function generateEntrypoint(steps: WorkflowStep[]): string {
    const lines: string[] = [];

    lines.push("#!/bin/bash");
    lines.push("set -e");
    lines.push("");
    lines.push("echo '=== GitTic Workflow Execution ==='");
    lines.push("");

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepNum = i + 1;

        if (!step.run) {
            console.warn(`[Compiler] Step ${stepNum} has no 'run' command, skipping`);
            continue;
        }

        lines.push(`echo "Step ${stepNum}/${steps.length}: ${step.name || 'Unnamed step'}"`);

        // Handle step environment variables
        if (step.env) {
            for (const [key, value] of Object.entries(step.env)) {
                lines.push(`export ${key}="${value}"`);
            }
        }

        // Execute the run command
        lines.push(step.run);
        lines.push("");
    }

    lines.push("echo '=== Workflow completed successfully ==='");

    return lines.join("\n");
}

/**
 * Example workflow YAML template
 */
export const WORKFLOW_TEMPLATE = `name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight UTC

jobs:
  build:
    runs-on: ubuntu-latest
    image: node:18-alpine  # Use any Docker Hub image!
    timeout: 1800  # 30 minutes
    env:
      NODE_ENV: production
    steps:
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
  
  test-python:
    runs-on: ubuntu-latest
    image: python:3.11-slim  # Different image for Python
    timeout: 900  # 15 minutes
    steps:
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run tests
        run: pytest

# Docker Images Examples:
# node:18-alpine, node:20-slim
# python:3.11-slim, python:3.12-alpine
# golang:1.21-alpine
# rust:1.75-alpine
# openjdk:17-slim
# php:8.2-cli
# ruby:3.2-alpine

# IMPORTANT: Resources are determined by your subscription tier!
# You CANNOT specify cores or memory in the YAML - they are automatically set.
# 
# Resource Limits by Tier:
# Free: 4 cores, 4GB RAM, No GPU
# Pro: 16 cores, 16GB RAM, GPU
# Team: 32 cores, 32GB RAM, GPU
# Enterprise: 64 cores, 64GB RAM, GPU
#
# To increase resources, upgrade your subscription tier!

# Cron Schedule Examples:
# '0 0 * * *'     - Daily at midnight
# '0 */6 * * *'   - Every 6 hours
# '0 0 * * 0'     - Weekly on Sunday
# '0 0 1 * *'     - Monthly on 1st
# '*/15 * * * *'  - Every 15 minutes
# '0 9 * * 1-5'   - Weekdays at 9 AM
`;
