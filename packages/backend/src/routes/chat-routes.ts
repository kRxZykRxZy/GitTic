import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import { getDb } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

interface ChatConversation {
    id: string;
    type: "dm" | "repo" | "org";
    repositoryId: string | null;
    organizationId: string | null;
    createdAt: string;
    updatedAt: string;
}

interface ChatMessage {
    id: string;
    conversationId: string;
    userId: string;
    content: string;
    attachments: string | null;
    replyToId: string | null;
    editedAt: string | null;
    editedById: string | null;
    deletedAt: string | null;
    deletedById: string | null;
    createdAt: string;
    author?: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
    };
}

// Helper: Check if user can access conversation
function canAccessConversation(db: any, conversationId: string, userId: string, userRole: string): boolean {
    // Admins can access all conversations
    if (userRole === "admin") return true;

    const participant = db
        .prepare("SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?")
        .get(conversationId, userId);

    return !!participant;
}

// Helper: Check if user can modify message
function canModifyMessage(db: any, messageId: string, userId: string, userRole: string): boolean {
    // Admins can modify any message
    if (userRole === "admin") return true;

    const message = db
        .prepare("SELECT user_id FROM chat_messages WHERE id = ?")
        .get(messageId) as { user_id: string } | undefined;

    if (!message) return false;

    // Moderators can modify any message
    if (userRole === "moderator") return true;

    // Users can only modify their own messages
    return message.user_id === userId;
}

// Get all conversations for current user
router.get("/conversations", requireAuth, async (req: Request, res: Response) => {
    const db = getDb();
    const user = req.user!;

    const conversations = db
        .prepare(
            `
        SELECT DISTINCT
            c.id,
            c.type,
            c.repository_id as repositoryId,
            c.organization_id as organizationId,
            c.created_at as createdAt,
            c.updated_at as updatedAt
        FROM chat_conversations c
        INNER JOIN chat_participants p ON c.id = p.conversation_id
        WHERE p.user_id = ?
        ORDER BY c.updated_at DESC
    `,
        )
        .all(user.id) as ChatConversation[];

    // Get participant info for each conversation
    const enriched = conversations.map((conv) => {
        const participants = db
            .prepare(
                `
            SELECT u.id, u.username, u.displayName, u.avatarUrl
            FROM chat_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = ?
        `,
            )
            .all(conv.id);

        const lastMessage = db
            .prepare(
                `
            SELECT content, created_at as createdAt
            FROM chat_messages
            WHERE conversation_id = ? AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        `,
            )
            .get(conv.id) as { content: string; createdAt: string } | undefined;

        return {
            ...conv,
            participants,
            lastMessage,
        };
    });

    res.json({ conversations: enriched });
});

// Create or get DM conversation with a user (follower/following only)
router.post(
    "/conversations/dm",
    requireAuth,
    validate([
        { field: "userId", location: "body", type: "string", required: true },
    ]),
    async (req: Request, res: Response) => {
        const db = getDb();
        const user = req.user!;
        const { userId: otherUserId } = req.body;

        if (otherUserId === user.id) {
            res.status(400).json({ error: "Cannot DM yourself" });
            return;
        }

        // Check if users follow each other
        const follows = db
            .prepare(
                `
            SELECT 1 FROM user_follows
            WHERE (follower_id = ? AND following_id = ?)
               OR (follower_id = ? AND following_id = ?)
        `,
            )
            .get(user.id, otherUserId, otherUserId, user.id);

        if (!follows) {
            res.status(403).json({ error: "You can only DM users you follow or who follow you" });
            return;
        }

        // Check if conversation already exists
        const existing = db
            .prepare(
                `
            SELECT c.id
            FROM chat_conversations c
            WHERE c.type = 'dm'
            AND EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = c.id AND user_id = ?)
            AND EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = c.id AND user_id = ?)
        `,
            )
            .get(user.id, otherUserId) as { id: string } | undefined;

        if (existing) {
            res.json({ conversationId: existing.id });
            return;
        }

        // Create new DM conversation
        const now = new Date().toISOString();
        const conversationId = uuidv4();

        db.prepare(
            "INSERT INTO chat_conversations (id, type, created_at, updated_at) VALUES (?, 'dm', ?, ?)",
        ).run(conversationId, now, now);

        db.prepare(
            "INSERT INTO chat_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?)",
        ).run(conversationId, user.id, now);

        db.prepare(
            "INSERT INTO chat_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?)",
        ).run(conversationId, otherUserId, now);

        res.status(201).json({ conversationId });
    },
);

// Get or create repo chat (for contributors/members only)
router.get(
    "/conversations/repo/:owner/:repo",
    requireAuth,
    async (req: Request, res: Response) => {
        const db = getDb();
        const user = req.user!;
        const owner = Array.isArray(req.params.owner) ? req.params.owner[0] : req.params.owner;
        const repo = Array.isArray(req.params.repo) ? req.params.repo[0] : req.params.repo;

        // Get repository
        const repository = db
            .prepare("SELECT id, owner_id FROM repositories WHERE name = ? AND owner_id = (SELECT id FROM users WHERE username = ?)")
            .get(repo, owner) as { id: string; owner_id: string } | undefined;

        if (!repository) {
            res.status(404).json({ error: "Repository not found" });
            return;
        }

        // Check if user is contributor/member (owner or has pushed commits)
        const isOwner = repository.owner_id === user.id;
        const isContributor = db
            .prepare("SELECT 1 FROM repository_contributors WHERE repository_id = ? AND user_id = ?")
            .get(repository.id, user.id);

        const isAdmin = user.role === "admin";
        const isModerator = user.role === "moderator";

        if (!isOwner && !isContributor && !isAdmin && !isModerator) {
            res.status(403).json({ error: "Only contributors and members can access repo chat" });
            return;
        }

        // Get or create conversation
        let conversation = db
            .prepare("SELECT id FROM chat_conversations WHERE type = 'repo' AND repository_id = ?")
            .get(repository.id) as { id: string } | undefined;

        if (!conversation) {
            const now = new Date().toISOString();
            const conversationId = uuidv4();

            db.prepare(
                "INSERT INTO chat_conversations (id, type, repository_id, created_at, updated_at) VALUES (?, 'repo', ?, ?, ?)",
            ).run(conversationId, repository.id, now, now);

            conversation = { id: conversationId };
        }

        // Add user as participant if not already
        const isParticipant = db
            .prepare("SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?")
            .get(conversation.id, user.id);

        if (!isParticipant) {
            const now = new Date().toISOString();
            db.prepare(
                "INSERT INTO chat_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?)",
            ).run(conversation.id, user.id, now);
        }

        res.json({ conversationId: conversation.id });
    },
);

// Get or create org chat (for org members only)
router.get("/conversations/org/:orgId", requireAuth, async (req: Request, res: Response) => {
    const db = getDb();
    const user = req.user!;
    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;

    // Check if user is org member
    const isMember = db
        .prepare("SELECT 1 FROM organization_members WHERE organization_id = ? AND user_id = ?")
        .get(orgId, user.id);

    const isAdmin = user.role === "admin";
    const isModerator = user.role === "moderator";

    if (!isMember && !isAdmin && !isModerator) {
        res.status(403).json({ error: "Only organization members can access org chat" });
        return;
    }

    // Get or create conversation
    let conversation = db
        .prepare("SELECT id FROM chat_conversations WHERE type = 'org' AND organization_id = ?")
        .get(orgId) as { id: string } | undefined;

    if (!conversation) {
        const now = new Date().toISOString();
        const conversationId = uuidv4();

        db.prepare(
            "INSERT INTO chat_conversations (id, type, organization_id, created_at, updated_at) VALUES (?, 'org', ?, ?, ?)",
        ).run(conversationId, orgId, now, now);

        conversation = { id: conversationId };
    }

    // Add user as participant if not already
    const isParticipant = db
        .prepare("SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?")
        .get(conversation.id, user.id);

    if (!isParticipant) {
        const now = new Date().toISOString();
        db.prepare(
            "INSERT INTO chat_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?)",
        ).run(conversation.id, user.id, now);
    }

    res.json({ conversationId: conversation.id });
});

// Get messages for a conversation
router.get(
    "/conversations/:conversationId/messages",
    requireAuth,
    validate([
        { field: "conversationId", location: "params", type: "string", required: true },
        { field: "before", location: "query", type: "string" },
        { field: "limit", location: "query", type: "string", pattern: /^\d+$/ },
    ]),
    async (req: Request, res: Response) => {
        const db = getDb();
        const user = req.user!;
        const conversationId = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
        const beforeParam = req.query.before;
        const before = typeof beforeParam === "string" ? beforeParam : undefined;
        const limitParam = req.query.limit;
        const parsedLimit = typeof limitParam === "string" ? parseInt(limitParam, 10) : 50;
        const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 50;

        if (!canAccessConversation(db, conversationId, user.id, user.role)) {
            res.status(403).json({ error: "Access denied" });
            return;
        }

        const whereClause = before
            ? "WHERE m.conversation_id = ? AND m.id < ? AND m.deleted_at IS NULL"
            : "WHERE m.conversation_id = ? AND m.deleted_at IS NULL";
        const params = before ? [conversationId, before] : [conversationId];

        const messages = db
            .prepare(
                `
            SELECT 
                m.id,
                m.conversation_id as conversationId,
                m.user_id as userId,
                m.content,
                m.attachments,
                m.reply_to_id as replyToId,
                m.edited_at as editedAt,
                m.edited_by_id as editedById,
                m.created_at as createdAt,
                u.id as 'author.id',
                u.username as 'author.username',
                u.displayName as 'author.displayName',
                u.avatarUrl as 'author.avatarUrl'
            FROM chat_messages m
            JOIN users u ON m.user_id = u.id
            ${whereClause}
            ORDER BY m.created_at DESC
            LIMIT ?
        `,
            )
            .all(...params, limit) as any[];

        const transformed = messages.map((row) => ({
            id: row.id,
            conversationId: row.conversationId,
            userId: row.userId,
            content: row.content,
            attachments: row.attachments ? JSON.parse(row.attachments) : null,
            replyToId: row.replyToId,
            editedAt: row.editedAt,
            editedById: row.editedById,
            createdAt: row.createdAt,
            author: {
                id: row["author.id"],
                username: row["author.username"],
                displayName: row["author.displayName"],
                avatarUrl: row["author.avatarUrl"],
            },
        }));

        res.json({ messages: transformed.reverse() });
    },
);

// Send a message to a conversation
router.post(
    "/conversations/:conversationId/messages",
    requireAuth,
    validate([
        { field: "conversationId", location: "params", type: "string", required: true },
        { field: "content", location: "body", type: "string", min: 1, max: 4000, required: true },
        { field: "replyToId", location: "body", type: "string" },
        { field: "attachments", location: "body", type: "object" },
    ]),
    async (req: Request, res: Response) => {
        const db = getDb();
        const user = req.user!;
        const conversationId = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
        const { content, replyToId, attachments } = req.body;

        if (!canAccessConversation(db, conversationId, user.id, user.role)) {
            res.status(403).json({ error: "Access denied" });
            return;
        }

        const now = new Date().toISOString();
        const messageId = uuidv4();
        const attachmentsJson = attachments ? JSON.stringify(attachments) : null;

        db.prepare(
            `
            INSERT INTO chat_messages (id, conversation_id, user_id, content, attachments, reply_to_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        ).run(messageId, conversationId, user.id, content, attachmentsJson, replyToId || null, now);

        // Update conversation updated_at
        db.prepare("UPDATE chat_conversations SET updated_at = ? WHERE id = ?").run(
            now,
            conversationId,
        );

        const message = db
            .prepare(
                `
            SELECT 
                m.id,
                m.conversation_id as conversationId,
                m.user_id as userId,
                m.content,
                m.attachments,
                m.reply_to_id as replyToId,
                m.edited_at as editedAt,
                m.created_at as createdAt,
                u.id as 'author.id',
                u.username as 'author.username',
                u.displayName as 'author.displayName',
                u.avatarUrl as 'author.avatarUrl'
            FROM chat_messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `,
            )
            .get(messageId) as any;

        const transformed = {
            id: message.id,
            conversationId: message.conversationId,
            userId: message.userId,
            content: message.content,
            attachments: message.attachments ? JSON.parse(message.attachments) : null,
            replyToId: message.replyToId,
            editedAt: message.editedAt,
            createdAt: message.createdAt,
            author: {
                id: message["author.id"],
                username: message["author.username"],
                displayName: message["author.displayName"],
                avatarUrl: message["author.avatarUrl"],
            },
        };

        res.status(201).json(transformed);
    },
);

// Edit a message (own messages, or admin/moderator can edit any)
router.patch(
    "/messages/:messageId",
    requireAuth,
    validate([
        { field: "messageId", location: "params", type: "string", required: true },
        { field: "content", location: "body", type: "string", min: 1, max: 4000, required: true },
    ]),
    async (req: Request, res: Response) => {
        const db = getDb();
        const user = req.user!;
        const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
        const { content } = req.body;

        if (!canModifyMessage(db, messageId, user.id, user.role)) {
            res.status(403).json({ error: "You can only edit your own messages" });
            return;
        }

        const now = new Date().toISOString();
        db.prepare(
            "UPDATE chat_messages SET content = ?, edited_at = ?, edited_by_id = ? WHERE id = ?",
        ).run(content, now, user.id, messageId);

        res.json({ success: true });
    },
);

// Delete a message (own messages, or admin/moderator can delete any)
router.delete(
    "/messages/:messageId",
    requireAuth,
    validate([
        { field: "messageId", location: "params", type: "string", required: true },
    ]),
    async (req: Request, res: Response) => {
        const db = getDb();
        const user = req.user!;
        const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;

        if (!canModifyMessage(db, messageId, user.id, user.role)) {
            res.status(403).json({ error: "You can only delete your own messages" });
            return;
        }

        const now = new Date().toISOString();
        // Soft delete
        db.prepare("UPDATE chat_messages SET deleted_at = ?, deleted_by_id = ? WHERE id = ?").run(
            now,
            user.id,
            messageId,
        );

        res.json({ success: true });
    },
);

// React to a message
router.post(
    "/messages/:messageId/reactions",
    requireAuth,
    validate([
        { field: "messageId", location: "params", type: "string", required: true },
        { field: "emoji", location: "body", type: "string", min: 1, max: 10, required: true },
    ]),
    async (req: Request, res: Response) => {
        const db = getDb();
        const user = req.user!;
        const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
        const { emoji } = req.body;

        // Check if message exists and user has access
        const message = db
            .prepare("SELECT conversation_id FROM chat_messages WHERE id = ? AND deleted_at IS NULL")
            .get(messageId) as { conversation_id: string } | undefined;

        if (!message) {
            res.status(404).json({ error: "Message not found" });
            return;
        }

        if (!canAccessConversation(db, message.conversation_id, user.id, user.role)) {
            res.status(403).json({ error: "Access denied" });
            return;
        }

        // Check if already reacted
        const existing = db
            .prepare("SELECT id FROM chat_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?")
            .get(messageId, user.id, emoji);

        if (existing) {
            res.status(400).json({ error: "You already reacted with this emoji" });
            return;
        }

        const now = new Date().toISOString();
        const reactionId = uuidv4();
        db.prepare("INSERT INTO chat_reactions (id, message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?, ?)").run(
            reactionId,
            messageId,
            user.id,
            emoji,
            now,
        );

        res.status(201).json({ success: true });
    },
);

// Remove reaction
router.delete(
    "/messages/:messageId/reactions/:emoji",
    requireAuth,
    validate([
        { field: "messageId", location: "params", type: "string", required: true },
        { field: "emoji", location: "params", type: "string", min: 1, max: 10 },
    ]),
    async (req: Request, res: Response) => {
        const db = getDb();
        const user = req.user!;
        const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
        const emoji = Array.isArray(req.params.emoji) ? req.params.emoji[0] : req.params.emoji;

        db.prepare("DELETE FROM chat_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?").run(
            messageId,
            user.id,
            emoji,
        );

        res.json({ success: true });
    },
);

export default router;
