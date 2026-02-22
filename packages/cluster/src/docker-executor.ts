import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync, spawn } from "node:child_process";

interface DockerWorkflowRequest {
  workflowId: string;
  compiled: {
    dockerfile: string;
    entrypoint: string;
    resources: {
      cores: number;
      memoryMB: number;
    };
    env: Record<string, string>;
    timeout: number;
  };
  repositoryUrl: string;
  branch?: string;
  env: Record<string, string>;
  serverUrl?: string; // Main server URL for log streaming
}

interface WorkflowResult {
  status: "success" | "failed" | "timeout";
  exitCode?: number;
  output: string;
  duration: number;
}

/**
 * Send log to main server
 */
async function streamLogToServer(
  serverUrl: string,
  workflowId: string,
  log: string,
  level: "info" | "error" = "info"
): Promise<void> {
  if (!serverUrl) return;
  
  try {
    await fetch(`${serverUrl}/api/v1/workflows/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, log, level, timestamp: new Date().toISOString() }),
    });
  } catch (error) {
    // Silently fail log streaming - don't interrupt workflow
    console.error(`[Stream] Failed to stream log:`, error);
  }
}

/**
 * Execute a compiled workflow in Docker container
 */
export async function executeDockerWorkflow(
  request: DockerWorkflowRequest
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const { workflowId, compiled, repositoryUrl, branch = "main", env, serverUrl } = request;
  
  const log = async (msg: string, level: "info" | "error" = "info") => {
    console.log(msg);
    if (serverUrl) {
      await streamLogToServer(serverUrl, workflowId, msg, level);
    }
  };
  
  await log(`[Docker] Starting workflow ${workflowId}`);
  await log(`[Docker] Repository: ${repositoryUrl}`);
  await log(`[Docker] Resources: ${compiled.resources.cores} cores, ${compiled.resources.memoryMB}MB RAM`);
  
  // Create working directory for this workflow
  const workDir = join(tmpdir(), `devforge-workflow-${workflowId}`);
  
  try {
    // Step 1: Create working directory
    await log(`[Docker] Creating working directory: ${workDir}`);
    mkdirSync(workDir, { recursive: true });
    
    // Step 2: Clone repository
    if (repositoryUrl) {
      await log(`[Docker] Cloning repository: ${repositoryUrl}`);
      try {
        execSync(`git clone --depth 1 --branch ${branch} ${repositoryUrl} repo`, {
          cwd: workDir,
          stdio: 'pipe',
          maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        });
        await log(`[Docker] Repository cloned successfully`);
      } catch (error: any) {
        await log(`[Docker] Failed to clone repository: ${error.message}`, "error");
        throw new Error(`Failed to clone repository: ${error.message}`);
      }
    } else {
      // Create empty repo directory if no URL provided
      mkdirSync(join(workDir, "repo"), { recursive: true });
      await log(`[Docker] No repository URL provided, using empty directory`);
    }
    
    const repoDir = join(workDir, "repo");
    
    // Step 3: Write Dockerfile in the repo directory
    const dockerfilePath = join(repoDir, "Dockerfile");
    writeFileSync(dockerfilePath, compiled.dockerfile);
    await log(`[Docker] Dockerfile created at ${dockerfilePath}`);
    
    // Step 4: Write entrypoint script in the repo directory
    const entrypointPath = join(repoDir, "entrypoint.sh");
    writeFileSync(entrypointPath, compiled.entrypoint);
    await log(`[Docker] Entrypoint script created at ${entrypointPath}`);
    
    // Step 5: Build Docker image using execSync
    const imageName = `devforge-workflow-${workflowId}`.toLowerCase();
    await log(`[Docker] Building image: ${imageName}`);
    
    try {
      const buildOutput = execSync(`docker build -t ${imageName} .`, {
        cwd: repoDir,
        stdio: 'pipe',
        maxBuffer: 50 * 1024 * 1024,
      }).toString();
      
      // Stream build output
      for (const line of buildOutput.split('\n').filter(l => l.trim())) {
        await log(`[Docker Build] ${line}`);
      }
      
      await log(`[Docker] Image built successfully`);
    } catch (error: any) {
      await log(`[Docker Build] Build failed: ${error.message}`, "error");
      throw new Error(`Docker build failed: ${error.message}`);
    }
    
    // Step 6: Run Docker container with resource limits using spawn for real-time streaming
    await log(`[Docker] Starting container with resource limits...`);
    
    // Build environment variables for docker run
    const envVars = Object.entries({ ...compiled.env, ...env })
      .map(([key, value]) => `-e ${key}="${value}"`)
      .join(" ");
    
    // Docker run command with resource limits
    const dockerRunCmd = `docker run --rm \
      --cpus=${compiled.resources.cores} \
      --memory=${compiled.resources.memoryMB}m \
      -v ${repoDir}:/workspace \
      ${envVars} \
      ${imageName}`;
    
    let output = "";
    let exitCode = 0;
    
    // Use spawn for real-time output streaming
    const dockerProcess = spawn('sh', ['-c', dockerRunCmd], {
      cwd: repoDir,
    });
    
    // Stream stdout
    dockerProcess.stdout.on('data', async (data) => {
      const text = data.toString();
      output += text;
      for (const line of text.split('\n').filter((l: string) => l.trim())) {
        await log(`[Workflow] ${line}`);
      }
    });
    
    // Stream stderr
    dockerProcess.stderr.on('data', async (data) => {
      const text = data.toString();
      output += text;
      for (const line of text.split('\n').filter((l: string) => l.trim())) {
        await log(`[Workflow Error] ${line}`, "error");
      }
    });
    
    // Wait for process with timeout
    const timeoutMs = compiled.timeout * 1000;
    
    const processPromise = new Promise<number>((resolve) => {
      dockerProcess.on('close', (code) => {
        resolve(code || 0);
      });
    });
    
    const timeoutPromise = new Promise<number>((_, reject) => {
      setTimeout(() => {
        dockerProcess.kill('SIGKILL');
        reject(new Error("Timeout"));
      }, timeoutMs);
    });
    
    let result: WorkflowResult;
    
    try {
      exitCode = await Promise.race([processPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      
      result = {
        status: exitCode === 0 ? "success" : "failed",
        exitCode,
        output,
        duration,
      };
      
      await log(`[Docker] Workflow completed with exit code ${exitCode}`);
    } catch (err) {
      // Timeout
      await log(`[Docker] Workflow timed out after ${compiled.timeout}s`, "error");
      
      result = {
        status: "timeout",
        output,
        duration: Date.now() - startTime,
      };
    }
    
    // Step 7: Clean up Docker resources
    await log(`[Docker] Starting cleanup process...`);
    
    // 7a. Force stop and remove any containers with this workflow ID (just in case --rm failed)
    try {
      const containers = execSync(`docker ps -a --filter "ancestor=${imageName}" -q`, { stdio: 'pipe' }).toString().trim();
      if (containers) {
        await log(`[Docker] Removing leftover containers...`);
        execSync(`docker rm -f ${containers}`, { stdio: 'pipe' });
        await log(`[Docker] Containers removed`);
      }
    } catch (err) {
      // No containers found - this is expected with --rm
    }
    
    // 7b. Remove Docker image
    await log(`[Docker] Removing Docker image: ${imageName}`);
    try {
      execSync(`docker rmi -f ${imageName}`, { stdio: 'pipe' });
      await log(`[Docker] Image removed: ${imageName}`);
    } catch (err) {
      await log(`[Docker] Failed to remove image (may not exist)`, "error");
    }
    
    // 7c. Clean up dangling images and build cache
    try {
      await log(`[Docker] Cleaning up dangling images...`);
      execSync(`docker image prune -f`, { stdio: 'pipe' });
      await log(`[Docker] Dangling images cleaned`);
    } catch (err) {
      await log(`[Docker] Failed to prune dangling images`, "error");
    }
    
    // 7d. Clean up any volumes created during workflow
    try {
      await log(`[Docker] Cleaning up volumes...`);
      execSync(`docker volume prune -f`, { stdio: 'pipe' });
      await log(`[Docker] Volumes cleaned`);
    } catch (err) {
      await log(`[Docker] Failed to prune volumes`, "error");
    }
    
    // Step 8: Clean up working directory and all files
    await log(`[Docker] Cleaning up working directory: ${workDir}`);
    try {
      rmSync(workDir, { recursive: true, force: true, maxRetries: 3 });
      await log(`[Docker] Working directory deleted successfully`);
    } catch (err) {
      await log(`[Docker] Failed to delete working directory`, "error");
    }
    
    await log(`[Docker] Cleanup completed - all artifacts removed`);
    
    return result;
  } catch (error: any) {
    await log(`[Docker] Workflow execution failed: ${error.message}`, "error");
    
    // Clean up on error - remove all Docker artifacts
    try {
      await log(`[Docker] Cleaning up after error...`);
      
      // Remove any containers
      try {
        const imageName = `devforge-workflow-${workflowId}`.toLowerCase();
        const containers = execSync(`docker ps -a --filter "ancestor=${imageName}" -q`, { stdio: 'pipe' }).toString().trim();
        if (containers) {
          execSync(`docker rm -f ${containers}`, { stdio: 'pipe' });
        }
        // Remove image
        execSync(`docker rmi -f ${imageName}`, { stdio: 'pipe' });
      } catch (dockerErr) {
        // Ignore docker cleanup errors
      }
      
      // Remove working directory
      rmSync(workDir, { recursive: true, force: true, maxRetries: 3 });
      
      // Prune dangling images and volumes
      try {
        execSync(`docker image prune -f`, { stdio: 'pipe' });
        execSync(`docker volume prune -f`, { stdio: 'pipe' });
      } catch (pruneErr) {
        // Ignore prune errors
      }
      
      await log(`[Docker] Cleanup completed`);
    } catch (cleanupErr) {
      await log(`[Docker] Cleanup failed`, "error");
    }
    
    return {
      status: "failed",
      output: error.message,
      duration: Date.now() - startTime,
    };
  }
}
