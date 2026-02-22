import React, { useState } from "react";
import { Button } from "../ui";
import { 
  Code, 
  Package, 
  TestTube, 
  Rocket, 
  Shield, 
  Database, 
  Cloud, 
  GitBranch,
  Copy,
  Play
} from "lucide-react";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  yaml: string;
  tags: string[];
}

export const WorkflowTemplates: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const templates: WorkflowTemplate[] = [
    {
      id: "node-ci",
      name: "Node.js CI/CD",
      description: "Continuous integration and deployment for Node.js applications",
      category: "ci-cd",
      icon: <Code className="w-5 h-5 text-green-500" />,
      tags: ["nodejs", "npm", "ci", "deployment"],
      yaml: `name: Node.js CI/CD Pipeline
on:
  push:
    branches: [main, develop]
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
      
      - name: Setup Node.js
        run: |
          node --version
          npm --version
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Build application
        run: npm run build
      
      - name: Upload coverage reports
        run: |
          # Upload to coverage service
          echo "Coverage uploaded"

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    image: alpine:latest
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add deployment logic here`
    },
    {
      id: "python-ci",
      name: "Python Testing",
      description: "Test Python applications with pytest and code quality checks",
      category: "testing",
      icon: <TestTube className="w-5 h-5 text-blue-500" />,
      tags: ["python", "pytest", "quality", "testing"],
      yaml: `name: Python Testing Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    image: python:3.11-slim
    steps:
      - name: Checkout code
        run: |
          git clone $REPO_URL .
          git checkout $GITHUB_SHA
      
      - name: Setup Python
        run: |
          python --version
          pip --version
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov flake8 black
      
      - name: Code formatting check
        run: black --check .
      
      - name: Lint code
        run: flake8 .
      
      - name: Run tests with coverage
        run: |
          pytest --cov=. --cov-report=xml --cov-report=html
      
      - name: Security scan
        run: |
          pip install bandit
          bandit -r .`
    },
    {
      id: "docker-build",
      name: "Docker Build & Push",
      description: "Build Docker images and push to registry",
      category: "deployment",
      icon: <Package className="w-5 h-5 text-blue-600" />,
      tags: ["docker", "container", "registry"],
      yaml: `name: Docker Build and Push
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    image: docker:latest
    steps:
      - name: Checkout code
        run: |
          git clone $REPO_URL .
          git checkout $GITHUB_SHA
      
      - name: Set up Docker Buildx
        run: docker buildx create --use
      
      - name: Login to Container Registry
        run: |
          echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
        env:
          DOCKER_USERNAME: "${"{{ secrets.DOCKER_USERNAME }}"}"
          DOCKER_PASSWORD: "${"{{ secrets.DOCKER_PASSWORD }}"}"
      
      - name: Extract metadata
        run: |
          IMAGE_TAG=\${"${"{{ github.ref_name == 'main' && 'latest' || github.ref_name }}"}"}
          echo "IMAGE_TAG=$IMAGE_TAG" >> $GITHUB_ENV
      
      - name: Build and push Docker image
        run: |
          docker buildx build \\
            --platform linux/amd64,linux/arm64 \\
            --push \\
            --tag myregistry/myapp:$IMAGE_TAG \\
            .
      
      - name: Generate SBOM
        run: |
          docker buildx imagetools inspect myregistry/myapp:$IMAGE_TAG`
    },
    {
      id: "security-scan",
      name: "Security Scanning",
      description: "Comprehensive security scanning and vulnerability assessment",
      category: "security",
      icon: <Shield className="w-5 h-5 text-red-500" />,
      tags: ["security", "vulnerability", "scanning"],
      yaml: `name: Security Scanning Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  security-scan:
    runs-on: ubuntu-latest
    image: ubuntu:22.04
    steps:
      - name: Checkout code
        run: |
          git clone $REPO_URL .
          git checkout $GITHUB_SHA
      
      - name: Install security tools
        run: |
          apt-get update
          apt-get install -y npm python3 python3-pip
          npm install -g audit-ci
          pip3 install safety bandit semgrep
      
      - name: Run dependency audit (Node.js)
        run: |
          if [ -f "package.json" ]; then
            npm audit --audit-level=high
          fi
      
      - name: Run dependency audit (Python)
        run: |
          if [ -f "requirements.txt" ]; then
            safety check -r requirements.txt
          fi
      
      - name: Run SAST scan
        run: |
          semgrep --config=auto . || true
      
      - name: Run security linter
        run: |
          if [ -d "src" ]; then
            bandit -r src/ || true
          fi
      
      - name: Container security scan
        run: |
          if [ -f "Dockerfile" ]; then
            # Add container scanning logic
            echo "Scanning Dockerfile for security issues"
          fi`
    },
    {
      id: "database-migration",
      name: "Database Migration",
      description: "Run database migrations and backup before deployment",
      category: "database",
      icon: <Database className="w-5 h-5 text-purple-500" />,
      tags: ["database", "migration", "backup"],
      yaml: `name: Database Migration Pipeline
on:
  push:
    branches: [main]
    paths: ['migrations/**']

jobs:
  migrate:
    runs-on: ubuntu-latest
    image: postgres:15-alpine
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - name: Checkout code
        run: |
          git clone $REPO_URL .
          git checkout $GITHUB_SHA
      
      - name: Backup database
        run: |
          pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
        env:
          DATABASE_URL: postgresql://postgres:test@postgres:5432/test
      
      - name: Run migrations
        run: |
          if [ -d "migrations" ]; then
            for migration in migrations/*.sql; do
              echo "Running migration: $migration"
              psql $DATABASE_URL < $migration
            done
          fi
        env:
          DATABASE_URL: postgresql://postgres:test@postgres:5432/test
      
      - name: Verify migration
        run: |
          psql $DATABASE_URL -c "SELECT version();"
        env:
          DATABASE_URL: postgresql://postgres:test@postgres:5432/test`
    },
    {
      id: "k8s-deploy",
      name: "Kubernetes Deployment",
      description: "Deploy applications to Kubernetes cluster",
      category: "deployment",
      icon: <Cloud className="w-5 h-5 text-cyan-500" />,
      tags: ["kubernetes", "k8s", "deployment"],
      yaml: `name: Kubernetes Deployment
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    image: bitnami/kubectl:latest
    steps:
      - name: Checkout code
        run: |
          git clone $REPO_URL .
          git checkout $GITHUB_SHA
      
      - name: Run tests
        run: |
          echo "Running application tests..."
          # Add test commands here

  deploy:
    needs: test
    runs-on: ubuntu-latest
    image: bitnami/kubectl:latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        run: |
          git clone $REPO_URL .
          git checkout $GITHUB_SHA
      
      - name: Configure kubectl
        run: |
          echo "$KUBE_CONFIG" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig
        env:
          KUBE_CONFIG: "${"{{ secrets.KUBE_CONFIG }}"}"
      
      - name: Deploy to Kubernetes
        run: |
          export KUBECONFIG=kubeconfig
          kubectl apply -f k8s/
          kubectl rollout status deployment/myapp
      
      - name: Verify deployment
        run: |
          export KUBECONFIG=kubeconfig
          kubectl get pods -l app=myapp`
    }
  ];

  const categories = [
    { id: "all", name: "All Templates", icon: <GitBranch className="w-4 h-4" /> },
    { id: "ci-cd", name: "CI/CD", icon: <Rocket className="w-4 h-4" /> },
    { id: "testing", name: "Testing", icon: <TestTube className="w-4 h-4" /> },
    { id: "deployment", name: "Deployment", icon: <Cloud className="w-4 h-4" /> },
    { id: "security", name: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "database", name: "Database", icon: <Database className="w-4 h-4" /> },
  ];

  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const handleCopyTemplate = async (template: WorkflowTemplate) => {
    try {
      await navigator.clipboard.writeText(template.yaml);
      setCopiedTemplate(template.id);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch (err) {
      console.error('Failed to copy template:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Workflow Templates</h2>
        <p className="text-sm text-text-secondary">
          Choose from pre-built workflow templates to get started quickly.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2"
          >
            {category.icon}
            {category.name}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white border border-border-light rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {/* Template Header */}
            <div className="p-4 border-b border-border-light">
              <div className="flex items-center gap-3 mb-2">
                {template.icon}
                <h3 className="font-semibold text-text-primary">{template.name}</h3>
              </div>
              <p className="text-sm text-text-secondary mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-bg-light text-text-secondary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Template Preview */}
            <div className="p-4 bg-gray-900 max-h-48 overflow-y-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                {template.yaml.substring(0, 200)}...
              </pre>
            </div>

            {/* Template Actions */}
            <div className="p-4 bg-bg-light flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopyTemplate(template)}
                className="flex items-center gap-2"
              >
                <Copy className="w-3 h-3" />
                {copiedTemplate === template.id ? "Copied!" : "Copy YAML"}
              </Button>
              <Button
                size="sm"
                className="flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                Use Template
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No templates found</h3>
          <p className="text-text-secondary">
            Try selecting a different category or check back later for new templates.
          </p>
        </div>
      )}
    </div>
  );
};
