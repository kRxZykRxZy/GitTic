import React, { useState, useEffect } from "react";
import { Play, Pause, Square, Terminal, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "../ui";
import { clusterService, WorkflowExecution } from "../../services/cluster-service";

interface WorkflowRun {
    id: string;
    workflowName: string;
    status: "pending" | "running" | "success" | "failed" | "cancelled";
    startTime: string;
    endTime?: string;
    logs: string[];
}

export const WorkflowRunner: React.FC = () => {
    const [runs, setRuns] = useState<WorkflowRun[]>([
        {
            id: "1",
            workflowName: "CI/CD Pipeline",
            status: "success",
            startTime: "2024-01-15T10:30:00Z",
            endTime: "2024-01-15T10:32:45Z",
            logs: [
                "[10:30:00] Starting workflow CI/CD Pipeline",
                "[10:30:15] Step 1: Install dependencies",
                "[10:31:00] Step 2: Run tests",
                "[10:31:45] Step 3: Build application",
                "[10:32:30] Step 4: Deploy to staging",
                "[10:32:45] Workflow completed successfully",
            ],
        },
        {
            id: "2",
            workflowName: "Daily Tests",
            status: "running",
            startTime: "2024-01-15T11:00:00Z",
            logs: [
                "[11:00:00] Starting workflow Daily Tests",
                "[11:00:15] Step 1: Checkout code",
                "[11:00:30] Step 2: Setup environment",
                "[11:01:00] Step 3: Run test suite...",
            ],
        },
    ]);

    const [selectedRun, setSelectedRun] = useState<string | null>(null);

    const getStatusIcon = (status: WorkflowRun["status"]) => {
        switch (status) {
            case "pending":
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case "running":
                return <Terminal className="w-4 h-4 text-blue-500 animate-pulse" />;
            case "success":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "failed":
                return <XCircle className="w-4 h-4 text-red-500" />;
            case "cancelled":
                return <Square className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: WorkflowExecution["status"]) => {
        switch (status) {
            case "pending":
                return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case "running":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "success":
                return "bg-green-50 text-green-700 border-green-200";
            case "failed":
                return "bg-red-50 text-red-700 border-red-200";
            case "cancelled":
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const formatDuration = (start: string, end?: string) => {
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        if (duration < 60) return `${duration}s`;
        if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
        return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Workflow Runs</h2>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => handleRunWorkflow("CI/CD Pipeline", `name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    image: node:18-alpine
    steps:
      - name: Checkout code
        run: |
          git clone $REPO_URL .
          git checkout $GITHUB_SHA
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build`)}
                        className="flex items-center gap-2"
                    >
                        <Play className="w-4 h-4" />
                        Run CI/CD
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRunWorkflow("Daily Tests", `name: Daily Tests
on:
  schedule:
    - cron: '0 2 * * *'

jobs:
  test:
    runs-on: ubuntu-latest
    image: python:3.11-slim
    steps:
      - name: Checkout code
        run: |
          git clone $REPO_URL .
          git checkout $GITHUB_SHA
      
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest --cov=.`)}
                    >
                        Run Tests
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
                </div>
            )}

            {/* Runs List */}
            {!loading && runs.length > 0 && (
                <div className="space-y-3">
                    {runs.map((run) => (
                        <div key={run.id} className="border border-border-light rounded-lg overflow-hidden">
                            <div
                                className="p-4 bg-white cursor-pointer hover:bg-bg-light transition-colors"
                                onClick={() => setSelectedRun(selectedRun === run.id ? null : run.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(run.status)}
                                        <div>
                                            <div className="font-medium">{run.workflowName}</div>
                                            <div className="text-sm text-text-secondary">
                                                Started {new Date(run.startTime).toLocaleString()} •
                                                Node: {run.nodeName} •
                                                Duration: {formatDuration(run.startTime, run.endTime)}
                                            </div>
                                            <div className="text-xs text-text-secondary">
                                                Resources: {run.resources.cores} cores, {run.resources.memoryGB}GB RAM
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(run.status)}`}>
                                            {run.status}
                                        </span>
                                        {run.status === "running" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelWorkflow(run.id);
                                                }}
                                            >
                                                <Square className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {selectedRun === run.id && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadLogs(run.id);
                                                }}
                                            >
                                                Download Logs
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Logs Section */}
                            {selectedRun === run.id && (
                                <div className="border-t border-border-light bg-gray-900 p-4">
                                    <div className="font-mono text-sm text-green-400 space-y-1 max-h-96 overflow-y-auto">
                                        {run.logs.map((log, index) => (
                                            <div key={index}>{log}</div>
                                        ))}
                                        {run.status === "running" && (
                                            <div className="animate-pulse">▊</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && runs.length === 0 && (
                <div className="text-center py-12">
                    <Terminal className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No workflow runs yet</h3>
                    <p className="text-text-secondary mb-4">
                        Run your first workflow to see execution logs and status here.
                    </p>
                    <Button onClick={() => handleRunWorkflow("Test Workflow", `name: Test Workflow
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    image: alpine:latest
    steps:
      - name: Hello World
        run: echo "Hello from GitTic Cluster!"`)}>
                        Run Test Workflow
                    </Button>
                </div>
            )}

            {/* Cluster Integration Info */}
            <div className="bg-bg-light border border-border-light rounded-lg p-4">
                <h3 className="font-semibold mb-2">Cluster Integration</h3>
                <p className="text-sm text-text-secondary mb-3">
                    Workflows are executed using the GitTic cluster system with the following features:
                </p>
                <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                    <li>Automatic resource allocation based on subscription tier</li>
                    <li>Docker-based workflow execution with custom images</li>
                    <li>Real-time log streaming and status updates</li>
                    <li>Automatic scaling and load balancing across nodes</li>
                    <li>Support for custom Docker images and environments</li>
                    <li>Workflow artifacts and result storage</li>
                    <li>Performance metrics and monitoring</li>
                </ul>
            </div>
        </div>
    );
};
