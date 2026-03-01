import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as analyticsRepo from "../db/repositories/analytics-repo.js";

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

            const recentProjects = projectRepo.findByOwner(userId, {
                page: 1,
                perPage: 6,
            });

            const allProjects = projectRepo.findByOwner(userId, {
                page: 1,
                perPage: 1000,
            });

            const dashboardStats = analyticsRepo.getUserDashboardStats(userId, 30);
            const events = analyticsRepo.listRecentEventsByActor(userId, 12);

            const activity = events.map((event) => ({
                id: event.id,
                type: event.eventType,
                description: event.eventType,
                createdAt: event.occurredAt,
                user: req.user?.username,
                repo: recentProjects.find((project) => project.id === event.repositoryId)?.name,
                metadata: event.metadata,
            }));

            const totalRepos = allProjects?.length || 0;
            const totalStars = allProjects?.reduce((sum, project) => sum + (project.starCount || 0), 0) || 0;

            res.json({
                recentProjects: recentProjects || [],
                activity: activity.slice(0, 10),
                stats: {
                    totalCommits: dashboardStats.totalCommits,
                    totalRepos,
                    totalStars,
                    totalCollaborators: 0,
                    totalPullRequests: dashboardStats.totalPullRequests,
                    totalIssuesOpened: dashboardStats.totalIssuesOpened,
                    totalIssuesClosed: dashboardStats.totalIssuesClosed,
                },
                timeseries: {
                    activity: dashboardStats.activity,
                },
            });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
