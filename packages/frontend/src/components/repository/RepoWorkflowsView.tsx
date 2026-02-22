import React, { useState } from "react";
import { Play, Pause, Plus, Clock, CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import { Button } from "../ui";
import { WorkflowRunner } from "../workflows/WorkflowRunner";

interface Workflow {
  id: string;
  name: string;
  status: "idle" | "running" | "success" | "failed";
  lastRun?: string;
  nextRun?: string;
  trigger: string;
}

export const RepoWorkflowsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"workflows" | "runs">("workflows");
  
  const [workflows] = useState<Workflow[]>([
    {
      id: "1",
      name: "CI/CD Pipeline",
      status: "success",
      lastRun: "2 hours ago",
      trigger: "push",
    },
    {
      id: "2",
      name: "Daily Tests",
      status: "idle",
      lastRun: "1 day ago",
      nextRun: "in 22 hours",
      trigger: "schedule",
    },
    {
      id: "3",
      name: "Deploy to Production",
      status: "failed",
      lastRun: "3 hours ago",
      trigger: "manual",
    },
  ]);

  const getStatusIcon = (status: Workflow["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "idle":
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Workflow["status"]) => {
    switch (status) {
      case "running":
        return "text-blue-600 bg-blue-50";
      case "success":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "idle":
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workflows</h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-light">
        <button
          onClick={() => setActiveTab("workflows")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "workflows"
              ? "border-accent-blue text-accent-blue"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Workflow Files
        </button>
        <button
          onClick={() => setActiveTab("runs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "runs"
              ? "border-accent-blue text-accent-blue"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Play className="w-4 h-4 inline mr-2" />
          Workflow Runs
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "workflows" ? (
        <div className="space-y-6">
          {/* Workflows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white border border-border-light rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary">{workflow.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                        {getStatusIcon(workflow.status)}
                        {workflow.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {workflow.status === "running" ? (
                      <Button variant="ghost" size="icon">
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon">
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-text-secondary">
                  <div className="flex justify-between">
                    <span>Trigger:</span>
                    <span className="text-text-primary">{workflow.trigger}</span>
                  </div>
                  {workflow.lastRun && (
                    <div className="flex justify-between">
                      <span>Last run:</span>
                      <span className="text-text-primary">{workflow.lastRun}</span>
                    </div>
                  )}
                  {workflow.nextRun && (
                    <div className="flex justify-between">
                      <span>Next run:</span>
                      <span className="text-text-primary">{workflow.nextRun}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Editor Section */}
          <div className="bg-white border border-border-light rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Workflow</h2>
            <div className="bg-bg-light border border-border-light rounded-lg p-4 font-mono text-sm">
              <pre>{`name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        run: git clone $REPO_URL .
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build`}</pre>
            </div>
            <div className="mt-4 flex gap-2">
              <Button>Save Workflow</Button>
              <Button variant="secondary">Test Run</Button>
            </div>
          </div>
        </div>
      ) : (
        <WorkflowRunner />
      )}
    </div>
  );
};
