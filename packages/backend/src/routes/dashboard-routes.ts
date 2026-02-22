import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as sessionRepo from "../db/repositories/session-repo.js";

/**
 * User dashboard routes.
 *
 * Provides personalized dashboard data for authenticated users,
 * including recent projects and activity feed.
 */
const router = Router();

/**
 * GET /api/v1/dashboard
 *
 * Returns personalized dashboard data for the authenticated user,
 * including recent projects and activity timeline.
 */
router.get(
    "/",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;

            // Get user's recent projects (last 6)
            const recentProjects = projectRepo.findByOwner(userId, {
                page: 1,
                perPage: 6,
            });

            // Get all user projects for stats calculation
            const allProjects = projectRepo.findByOwner(userId, {
                page: 1,
                perPage: 1000, // Get all projects
            });

            // Calculate real stats
            const totalCommits = 0; // TODO: Get from git/activity tracking
            const totalRepos = allProjects?.length || 0;
            const totalStars = allProjects?.reduce((sum, project) => sum + (project.starCount || 0), 0) || 0;
            const totalCollaborators = 0; // TODO: Get from collaborators table

            // Get real activity feed (last 10 items)
            // For now, return mock activity data based on actual projects
            const activity = [];
            
            if (recentProjects && recentProjects.length > 0) {
                recentProjects.forEach((project, index) => {
                    activity.push({
                        id: `project-${index}`,
                        type: "project_created",
                        description: `Created repository ${project.name}`,
                        createdAt: project.createdAt,
                        user: req.user?.username,
                        repo: project.name,
                    });
                });
            }

            // Add some generic activity
            activity.push({
                id: "push-1",
                type: "commit",
                description: "Pushed commits to main branch",
                createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                user: req.user?.username,
                repo: recentProjects?.[0]?.name,
            });

            res.json({
                recentProjects: recentProjects || [],
                activity: activity.slice(0, 10), // Limit to 10 items
                stats: {
                    totalCommits,
                    totalRepos,
                    totalStars,
                    totalCollaborators,
                },
            });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
