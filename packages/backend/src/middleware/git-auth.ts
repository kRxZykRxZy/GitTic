import type { Request, Response, NextFunction } from "express";
import * as userRepo from "../db/repositories/user-repo.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import { comparePassword } from "@platform/auth";

/**
 * Git HTTP Basic Authentication Middleware
 * 
 * Supports git clone/push/pull with basic auth:
 * git clone https://USERNAME:PASSWORD@yoursite.com/owner/repo.git
 * 
 * For public repos: No auth required
 * For private repos: Basic auth with username:password
 */

interface GitAuthRequest extends Request {
  gitUser?: {
    id: string;
    username: string;
    role: string;
  };
  repository?: {
    id: string;
    name: string;
    owner: string;
    isPrivate: boolean;
  };
}

/**
 * Parse Basic Auth header
 */
function parseBasicAuth(authHeader: string): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

/**
 * Git HTTP Basic Authentication Middleware
 */
export async function gitBasicAuth(
  req: GitAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract owner and repo from URL
    // Format: /owner/repo.git or /owner/repo
    const urlParts = req.path.split("/").filter(Boolean);
    
    if (urlParts.length < 2) {
      res.status(404).json({ error: "Repository not found" });
      return;
    }

    const owner = urlParts[0];
    const repoName = urlParts[1].replace(/\.git$/, "");

    // Fetch repository
    const ownerUser = userRepo.findByUsername(owner);
    if (!ownerUser) {
      res.status(404).json({ error: "Repository not found" });
      return;
    }
    
    const repository = projectRepo.findBySlug(ownerUser.id, repoName);

    if (!repository) {
      res.status(404).json({ error: "Repository not found" });
      return;
    }

    req.repository = {
      id: repository.id,
      name: repository.name,
      owner: ownerUser.username,
      isPrivate: repository.isPrivate,
    };

    // Public repository - allow without auth
    if (!repository.isPrivate) {
      next();
      return;
    }

    // Private repository - require authentication
    const authHeader = req.get("Authorization");

    if (!authHeader) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Git Repository Access"');
      res.status(401).json({ error: "Authentication required for private repository" });
      return;
    }

    const credentials = parseBasicAuth(authHeader);

    if (!credentials) {
      res.status(401).json({ error: "Invalid authentication format" });
      return;
    }

    // Verify username and password
    const user = userRepo.findByUsername(credentials.username);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValidPassword = await comparePassword(credentials.password, user.passwordHash);

    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check if user has access to repository
    const hasAccess = checkRepositoryAccess(user.id, repository.id, ownerUser.username);

    if (!hasAccess) {
      res.status(403).json({ error: "Access denied to this repository" });
      return;
    }

    // Set authenticated user
    req.gitUser = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("[Git Auth] Error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Check if user has access to repository
 */
function checkRepositoryAccess(
  userId: string,
  repositoryId: string,
  owner: string
): boolean {
  // Check if user is the owner
  const user = userRepo.findById(userId);
  if (user && user.username === owner) {
    return true;
  }

  // Check if user is a collaborator
  // Note: Projects table and repositories table are separate.
  // Collaborator checking is disabled until table mapping is resolved.
  // const collaborators = repositoryModel.getCollaborators(repositoryId);
  // const isCollaborator = collaborators.some((c: any) => c.id === userId);
  
  // if (isCollaborator) {
  //   return true;
  // }

  // Check if repository belongs to an organization the user is a member of
  // TODO: Implement organization membership check
  
  return false;
}

/**
 * Require write access for git push operations
 */
export async function requireGitWriteAccess(
  req: GitAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.gitUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!req.repository) {
    res.status(404).json({ error: "Repository not found" });
    return;
  }

  const user = userRepo.findById(req.gitUser.id);
  
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Check if user is owner
  if (user.username === req.repository.owner) {
    next();
    return;
  }

  // Check if user is collaborator with write access
  // Note: Projects table and repositories table are separate.
  // Collaborator checking is disabled until table mapping is resolved.
  // const collaborators = repositoryModel.getCollaborators(req.repository.id);
  // const collaboration = collaborators.find((c: any) => c.id === user.id);

  // if (!collaboration) {
  //   res.status(403).json({ error: "Write access denied" });
  //   return;
  // }

  // if (collaboration.role === "admin" || collaboration.role === "push" || collaboration.role === "maintain") {
  //   next();
  //   return;
  // }

  res.status(403).json({ error: "Write access denied" });
}

/**
 * Generate clone URL for display
 */
export function generateCloneUrl(
  host: string,
  owner: string,
  repo: string,
  isPrivate: boolean,
  protocol: "https" | "ssh" = "https"
): string {
  if (protocol === "ssh") {
    return `git@${host}:${owner}/${repo}.git`;
  }

  if (isPrivate) {
    return `https://USERNAME:PASSWORD@${host}/${owner}/${repo}.git`;
  }

  return `https://${host}/${owner}/${repo}.git`;
}
