import { getDb } from "./connection.js";

/**
 * Schema migration system.
 * Each migration is a versioned SQL block applied in order.
 * Tracks applied versions in a `_migrations` meta-table.
 */

interface Migration {
  version: number;
  description: string;
  sql: string;
}

/** All schema migrations, ordered by version. */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: "Create migration tracking table",
    sql: `
      CREATE TABLE IF NOT EXISTS _migrations (
        version  INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 2,
    description: "Create users table with GDPR/COPPA fields",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id             TEXT PRIMARY KEY,
        username       TEXT NOT NULL UNIQUE,
        email          TEXT NOT NULL UNIQUE,
        password_hash  TEXT NOT NULL,
        role           TEXT NOT NULL DEFAULT 'user',
        display_name   TEXT,
        avatar_url     TEXT,
        bio            TEXT,
        country        TEXT,
        age_verified   INTEGER NOT NULL DEFAULT 0,
        terms_accepted INTEGER NOT NULL DEFAULT 0,
        suspended      INTEGER NOT NULL DEFAULT 0,
        suspended_until TEXT,
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `,
  },
  {
    version: 3,
    description: "Create sessions table",
    sql: `
      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token      TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `,
  },
  {
    version: 4,
    description: "Create organizations and membership tables",
    sql: `
      CREATE TABLE IF NOT EXISTS organizations (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        slug        TEXT NOT NULL UNIQUE,
        description TEXT,
        avatar_url  TEXT,
        owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_private  INTEGER NOT NULL DEFAULT 0,
        max_repos   INTEGER NOT NULL DEFAULT 50,
        max_members INTEGER NOT NULL DEFAULT 100,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);
      CREATE INDEX IF NOT EXISTS idx_orgs_owner ON organizations(owner_id);

      CREATE TABLE IF NOT EXISTS org_members (
        org_id   TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role     TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (org_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
    `,
  },
  {
    version: 5,
    description: "Create teams and team membership tables",
    sql: `
      CREATE TABLE IF NOT EXISTS teams (
        id          TEXT PRIMARY KEY,
        org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        slug        TEXT NOT NULL,
        description TEXT,
        permission  TEXT NOT NULL DEFAULT 'read',
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(org_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(org_id);

      CREATE TABLE IF NOT EXISTS team_members (
        team_id  TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (team_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
    `,
  },
  {
    version: 6,
    description: "Create projects table",
    sql: `
      CREATE TABLE IF NOT EXISTS projects (
        id             TEXT PRIMARY KEY,
        name           TEXT NOT NULL,
        slug           TEXT NOT NULL,
        description    TEXT,
        owner_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        org_id         TEXT REFERENCES organizations(id) ON DELETE SET NULL,
        is_private     INTEGER NOT NULL DEFAULT 0,
        default_branch TEXT NOT NULL DEFAULT 'main',
        forked_from_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        clone_count    INTEGER NOT NULL DEFAULT 0,
        star_count     INTEGER NOT NULL DEFAULT 0,
        storage_path   TEXT NOT NULL,
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(owner_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
      CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(org_id);
      CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
    `,
  },
  {
    version: 7,
    description: "Create cluster nodes and jobs tables",
    sql: `
      CREATE TABLE IF NOT EXISTS clusters (
        id             TEXT PRIMARY KEY,
        name           TEXT NOT NULL,
        token          TEXT NOT NULL UNIQUE,
        url            TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'offline',
        version        TEXT NOT NULL DEFAULT '0.0.0',
        capabilities   TEXT NOT NULL DEFAULT '[]',
        cpu_usage      REAL NOT NULL DEFAULT 0,
        memory_usage   REAL NOT NULL DEFAULT 0,
        active_jobs    INTEGER NOT NULL DEFAULT 0,
        max_jobs       INTEGER NOT NULL DEFAULT 4,
        last_heartbeat TEXT,
        registered_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_clusters_token ON clusters(token);
      CREATE INDEX IF NOT EXISTS idx_clusters_status ON clusters(status);

      CREATE TABLE IF NOT EXISTS cluster_jobs (
        id          TEXT PRIMARY KEY,
        cluster_id  TEXT NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
        project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        pipeline_id TEXT NOT NULL,
        stage       TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'queued',
        command     TEXT NOT NULL,
        work_dir    TEXT NOT NULL,
        output      TEXT,
        exit_code   INTEGER,
        started_at  TEXT,
        finished_at TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_cluster_jobs_cluster ON cluster_jobs(cluster_id);
      CREATE INDEX IF NOT EXISTS idx_cluster_jobs_status ON cluster_jobs(status);
    `,
  },
  {
    version: 8,
    description: "Create pipelines and pipeline runs tables",
    sql: `
      CREATE TABLE IF NOT EXISTS pipelines (
        id         TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name       TEXT NOT NULL,
        config     TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_pipelines_project ON pipelines(project_id);

      CREATE TABLE IF NOT EXISTS pipeline_runs (
        id           TEXT PRIMARY KEY,
        project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        config_hash  TEXT NOT NULL,
        branch       TEXT NOT NULL,
        commit_sha   TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'queued',
        triggered_by TEXT NOT NULL,
        started_at   TEXT,
        finished_at  TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_pipeline_runs_project ON pipeline_runs(project_id);
      CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);

      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id              TEXT PRIMARY KEY,
        pipeline_run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
        stage_name      TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'queued',
        attempt         INTEGER NOT NULL DEFAULT 1,
        max_retries     INTEGER NOT NULL DEFAULT 0,
        log_url         TEXT,
        artifact_urls   TEXT,
        started_at      TEXT,
        finished_at     TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_pipeline_stages_run ON pipeline_stages(pipeline_run_id);
    `,
  },
  {
    version: 9,
    description: "Create analytics tables: audit_logs, page_views, metrics",
    sql: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        action      TEXT NOT NULL,
        resource    TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        details     TEXT,
        ip_address  TEXT,
        timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

      CREATE TABLE IF NOT EXISTS page_views (
        id         TEXT PRIMARY KEY,
        path       TEXT NOT NULL,
        user_id    TEXT,
        ip_address TEXT,
        user_agent TEXT,
        referrer   TEXT,
        timestamp  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
      CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);

      CREATE TABLE IF NOT EXISTS metrics (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        value      REAL NOT NULL,
        tags       TEXT NOT NULL DEFAULT '{}',
        cluster_id TEXT,
        timestamp  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(name);
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
    `,
  },
  {
    version: 10,
    description: "Create feature_flags and announcements tables",
    sql: `
      CREATE TABLE IF NOT EXISTS feature_flags (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        enabled     INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);

      CREATE TABLE IF NOT EXISTS announcements (
        id         TEXT PRIMARY KEY,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL,
        type       TEXT NOT NULL DEFAULT 'info',
        active     INTEGER NOT NULL DEFAULT 1,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);
    `,
  },
  {
    version: 11,
    description: "Create moderation_reports table",
    sql: `
      CREATE TABLE IF NOT EXISTS moderation_reports (
        id           TEXT PRIMARY KEY,
        reporter_id  TEXT NOT NULL REFERENCES users(id),
        target_type  TEXT NOT NULL,
        target_id    TEXT NOT NULL,
        reason       TEXT NOT NULL,
        details      TEXT,
        status       TEXT NOT NULL DEFAULT 'open',
        moderator_id TEXT REFERENCES users(id),
        resolution   TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        resolved_at  TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_mod_reports_status ON moderation_reports(status);
      CREATE INDEX IF NOT EXISTS idx_mod_reports_target ON moderation_reports(target_type, target_id);
    `,
  },
  {
    version: 12,
    description: "Create search_index FTS5 table",
    sql: `
      CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
        entity_id,
        type,
        title,
        content,
        tokenize='porter unicode61'
      );

      CREATE TABLE IF NOT EXISTS search_meta (
        entity_id  TEXT PRIMARY KEY,
        type       TEXT NOT NULL,
        score      REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 13,
    description: "Create api_tokens, mfa_secrets, oauth_accounts, user_devices tables",
    sql: `
      CREATE TABLE IF NOT EXISTS api_tokens (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name       TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        scopes     TEXT NOT NULL DEFAULT '[]',
        last_used  TEXT,
        expires_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);

      CREATE TABLE IF NOT EXISTS mfa_secrets (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        secret     TEXT NOT NULL,
        enabled    INTEGER NOT NULL DEFAULT 0,
        backup_codes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS oauth_accounts (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider    TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        email       TEXT,
        access_token TEXT,
        refresh_token TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(provider, provider_id)
      );
      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts(user_id);

      CREATE TABLE IF NOT EXISTS user_devices (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_name TEXT NOT NULL,
        device_type TEXT NOT NULL,
        ip_address  TEXT,
        user_agent  TEXT,
        last_seen   TEXT NOT NULL DEFAULT (datetime('now')),
        trusted     INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
    `,
  },
  {
    version: 14,
    description: "Create repositories and repository collaborators tables",
    sql: `
      CREATE TABLE IF NOT EXISTS repositories (
        id                      TEXT PRIMARY KEY,
        name                    TEXT NOT NULL,
        slug                    TEXT NOT NULL,
        description             TEXT,
        owner_id                TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        org_id                  TEXT REFERENCES organizations(id) ON DELETE SET NULL,
        visibility              TEXT NOT NULL DEFAULT 'public',
        default_branch          TEXT NOT NULL DEFAULT 'main',
        has_issues              INTEGER NOT NULL DEFAULT 1,
        has_projects            INTEGER NOT NULL DEFAULT 1,
        has_wiki                INTEGER NOT NULL DEFAULT 1,
        allow_merge_commit      INTEGER NOT NULL DEFAULT 1,
        allow_squash_merge      INTEGER NOT NULL DEFAULT 1,
        allow_rebase_merge      INTEGER NOT NULL DEFAULT 1,
        delete_branch_on_merge  INTEGER NOT NULL DEFAULT 0,
        archived                INTEGER NOT NULL DEFAULT 0,
        disabled                INTEGER NOT NULL DEFAULT 0,
        storage_path            TEXT NOT NULL,
        star_count              INTEGER NOT NULL DEFAULT 0,
        fork_count              INTEGER NOT NULL DEFAULT 0,
        created_at              TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at              TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(owner_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_repositories_owner ON repositories(owner_id);
      CREATE INDEX IF NOT EXISTS idx_repositories_org ON repositories(org_id);
      CREATE INDEX IF NOT EXISTS idx_repositories_slug ON repositories(slug);

      CREATE TABLE IF NOT EXISTS repository_collaborators (
        repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission    TEXT NOT NULL DEFAULT 'pull',
        added_at      TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (repository_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_repo_collab_user ON repository_collaborators(user_id);
    `,
  },
  {
    version: 15,
    description: "Create SSH keys and user emails tables",
    sql: `
      CREATE TABLE IF NOT EXISTS ssh_keys (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        key         TEXT NOT NULL,
        fingerprint TEXT NOT NULL UNIQUE,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        last_used   TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_ssh_keys_user ON ssh_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_ssh_keys_fingerprint ON ssh_keys(fingerprint);

      CREATE TABLE IF NOT EXISTS user_emails (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email      TEXT NOT NULL,
        verified   INTEGER NOT NULL DEFAULT 0,
        "primary"  INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, email)
      );
      CREATE INDEX IF NOT EXISTS idx_user_emails_user ON user_emails(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_emails_email ON user_emails(email);
    `,
  },
  {
    version: 16,
    description: "Create webhooks and webhook deliveries tables",
    sql: `
      CREATE TABLE IF NOT EXISTS webhooks (
        id            TEXT PRIMARY KEY,
        repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        name          TEXT NOT NULL,
        url           TEXT NOT NULL,
        events        TEXT NOT NULL DEFAULT '[]',
        active        INTEGER NOT NULL DEFAULT 1,
        secret        TEXT,
        content_type  TEXT NOT NULL DEFAULT 'json',
        insecure_ssl  INTEGER NOT NULL DEFAULT 0,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_webhooks_repository ON webhooks(repository_id);

      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id              TEXT PRIMARY KEY,
        webhook_id      TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
        event           TEXT NOT NULL,
        payload         TEXT NOT NULL,
        request_headers TEXT NOT NULL,
        response_status INTEGER,
        response_body   TEXT,
        error           TEXT,
        delivered_at    TEXT NOT NULL,
        created_at      TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at);
    `,
  },
  {
    version: 17,
    description: "Create deploy keys table",
    sql: `
      CREATE TABLE IF NOT EXISTS deploy_keys (
        id            TEXT PRIMARY KEY,
        repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        title         TEXT NOT NULL,
        key           TEXT NOT NULL,
        fingerprint   TEXT NOT NULL UNIQUE,
        read_only     INTEGER NOT NULL DEFAULT 1,
        verified      INTEGER NOT NULL DEFAULT 0,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        last_used     TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_deploy_keys_repository ON deploy_keys(repository_id);
      CREATE INDEX IF NOT EXISTS idx_deploy_keys_fingerprint ON deploy_keys(fingerprint);
    `,
  },
  {
    version: 18,
    description: "Create team_members and team_repositories tables",
    sql: `
      CREATE TABLE IF NOT EXISTS team_members (
        team_id   TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role      TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (team_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS team_repositories (
        team_id       TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        permission    TEXT NOT NULL DEFAULT 'pull',
        added_at      TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (team_id, repository_id)
      );
      CREATE INDEX IF NOT EXISTS idx_team_repos_repository ON team_repositories(repository_id);
    `,
  },
  {
    version: 19,
    description: "Create pull_requests and pull_request_reviews tables",
    sql: `
      CREATE TABLE IF NOT EXISTS pull_requests (
        id             TEXT PRIMARY KEY,
        number         INTEGER NOT NULL,
        repository_id  TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        title          TEXT NOT NULL,
        description    TEXT,
        base_branch    TEXT NOT NULL,
        head_branch    TEXT NOT NULL,
        state          TEXT NOT NULL DEFAULT 'open',
        author_id      TEXT NOT NULL REFERENCES users(id),
        is_draft       INTEGER NOT NULL DEFAULT 0,
        merge_commit_sha TEXT,
        merged_at      TEXT,
        merged_by_id   TEXT REFERENCES users(id),
        closed_at      TEXT,
        closed_by_id   TEXT REFERENCES users(id),
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(repository_id, number)
      );
      CREATE INDEX IF NOT EXISTS idx_prs_repository ON pull_requests(repository_id);
      CREATE INDEX IF NOT EXISTS idx_prs_author ON pull_requests(author_id);
      CREATE INDEX IF NOT EXISTS idx_prs_state ON pull_requests(state);
      CREATE INDEX IF NOT EXISTS idx_prs_number ON pull_requests(repository_id, number);

      CREATE TABLE IF NOT EXISTS pr_reviewers (
        pr_id        TEXT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requested_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (pr_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_pr_reviewers_user ON pr_reviewers(user_id);

      CREATE TABLE IF NOT EXISTS pr_assignees (
        pr_id       TEXT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (pr_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_pr_assignees_user ON pr_assignees(user_id);

      CREATE TABLE IF NOT EXISTS pr_labels (
        pr_id    TEXT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
        label    TEXT NOT NULL,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (pr_id, label)
      );

      CREATE TABLE IF NOT EXISTS pr_reviews (
        id          TEXT PRIMARY KEY,
        pr_id       TEXT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
        user_id     TEXT NOT NULL REFERENCES users(id),
        state       TEXT NOT NULL,
        body        TEXT,
        commit_sha  TEXT,
        submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_pr_reviews_pr ON pr_reviews(pr_id);
      CREATE INDEX IF NOT EXISTS idx_pr_reviews_user ON pr_reviews(user_id);
    `,
  },
  {
    version: 20,
    description: "Create user_follows table for follow/unfollow functionality",
    sql: `
      CREATE TABLE IF NOT EXISTS user_follows (
        follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        followed_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (follower_id, following_id),
        CHECK (follower_id != following_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
    `,
  },
  {
    version: 21,
    description: "Create issues table",
    sql: `
      CREATE TABLE IF NOT EXISTS issues (
        id             TEXT PRIMARY KEY,
        number         INTEGER NOT NULL,
        repository_id  TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        title          TEXT NOT NULL,
        body           TEXT,
        state          TEXT NOT NULL DEFAULT 'open',
        author_id      TEXT NOT NULL REFERENCES users(id),
        closed_at      TEXT,
        closed_by_id   TEXT REFERENCES users(id),
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(repository_id, number)
      );
      CREATE INDEX IF NOT EXISTS idx_issues_repository ON issues(repository_id);
      CREATE INDEX IF NOT EXISTS idx_issues_author ON issues(author_id);
      CREATE INDEX IF NOT EXISTS idx_issues_state ON issues(state);
      CREATE INDEX IF NOT EXISTS idx_issues_number ON issues(repository_id, number);

      CREATE TABLE IF NOT EXISTS issue_assignees (
        issue_id    TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (issue_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_issue_assignees_user ON issue_assignees(user_id);

      CREATE TABLE IF NOT EXISTS issue_labels (
        issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        label    TEXT NOT NULL,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (issue_id, label)
      );
    `,
  },
  {
    version: 22,
    description: "Create comments tables for issues and PRs",
    sql: `
      CREATE TABLE IF NOT EXISTS issue_comments (
        id         TEXT PRIMARY KEY,
        issue_id   TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        author_id  TEXT NOT NULL REFERENCES users(id),
        body       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);
      CREATE INDEX IF NOT EXISTS idx_issue_comments_author ON issue_comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_issue_comments_created ON issue_comments(created_at);

      CREATE TABLE IF NOT EXISTS pr_comments (
        id         TEXT PRIMARY KEY,
        pr_id      TEXT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
        author_id  TEXT NOT NULL REFERENCES users(id),
        body       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_pr_comments_pr ON pr_comments(pr_id);
      CREATE INDEX IF NOT EXISTS idx_pr_comments_author ON pr_comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_pr_comments_created ON pr_comments(created_at);
    `,
  },
  {
    version: 23,
    description: "Create labels table for repository labels",
    sql: `
      CREATE TABLE IF NOT EXISTS labels (
        id            TEXT PRIMARY KEY,
        repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        name          TEXT NOT NULL,
        color         TEXT NOT NULL,
        description   TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(repository_id, name)
      );
      CREATE INDEX IF NOT EXISTS idx_labels_repository ON labels(repository_id);
    `,
  },
  {
    version: 24,
    description: "Create notifications table for user mentions and activity",
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type          TEXT NOT NULL,
        title         TEXT NOT NULL,
        body          TEXT,
        read          INTEGER NOT NULL DEFAULT 0,
        resource_type TEXT NOT NULL,
        resource_id   TEXT NOT NULL,
        actor_id      TEXT REFERENCES users(id),
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_resource ON notifications(resource_type, resource_id);
    `,
  },
  {
    version: 25,
    description: "Create discussions table for repository discussions",
    sql: `
      CREATE TABLE IF NOT EXISTS discussions (
        id            TEXT PRIMARY KEY,
        repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        number        INTEGER NOT NULL,
        title         TEXT NOT NULL,
        body          TEXT,
        category      TEXT NOT NULL DEFAULT 'general',
        state         TEXT NOT NULL DEFAULT 'open',
        author_id     TEXT NOT NULL REFERENCES users(id),
        closed_at     TEXT,
        closed_by_id  TEXT REFERENCES users(id),
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(repository_id, number)
      );
      CREATE INDEX IF NOT EXISTS idx_discussions_repository ON discussions(repository_id);
      CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
      CREATE INDEX IF NOT EXISTS idx_discussions_state ON discussions(state);
      CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category);
      CREATE INDEX IF NOT EXISTS idx_discussions_number ON discussions(repository_id, number);

      CREATE TABLE IF NOT EXISTS discussion_comments (
        id            TEXT PRIMARY KEY,
        discussion_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
        author_id     TEXT NOT NULL REFERENCES users(id),
        body          TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion ON discussion_comments(discussion_id);
      CREATE INDEX IF NOT EXISTS idx_discussion_comments_author ON discussion_comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_discussion_comments_created ON discussion_comments(created_at);
    `,
  },
  {
    version: 26,
    description: "Create payment_methods table for secure card storage",
    sql: `
      CREATE TABLE IF NOT EXISTS payment_methods (
        id               TEXT PRIMARY KEY,
        user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type             TEXT NOT NULL DEFAULT 'card',
        card_hash        TEXT NOT NULL,
        last4            TEXT NOT NULL,
        brand            TEXT NOT NULL,
        expiry_month     INTEGER NOT NULL,
        expiry_year      INTEGER NOT NULL,
        cardholder_name  TEXT NOT NULL,
        billing_address  TEXT,
        is_default       INTEGER NOT NULL DEFAULT 0,
        created_at       TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default);
    `,
  },
  {
    version: 27,
    description: "Create attachments table for files in issues/PRs/chat",
    sql: `
      CREATE TABLE IF NOT EXISTS attachments (
        id          TEXT PRIMARY KEY,
        context     TEXT NOT NULL,
        context_id  TEXT NOT NULL,
        owner       TEXT,
        repo        TEXT,
        filename    TEXT NOT NULL,
        filepath    TEXT NOT NULL,
        size        INTEGER NOT NULL,
        mime_type   TEXT NOT NULL,
        uploaded_by TEXT NOT NULL REFERENCES users(id),
        uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_attachments_context ON attachments(context, context_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_repo ON attachments(owner, repo);
    `,
  },
  {
    version: 28,
    description: "Create subscriptions table for user tiers",
    sql: `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id                 TEXT PRIMARY KEY,
        user_id            TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        tier               TEXT NOT NULL DEFAULT 'free',
        status             TEXT NOT NULL DEFAULT 'active',
        current_period_end TEXT,
        cancel_at          TEXT,
        created_at         TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    `,
  },
];


/**
 * Run all pending migrations.
 * Safe to call on every startup – already-applied versions are skipped.
 */
export function runMigrations(): void {
  const db = getDb();

  // Ensure the migrations meta-table exists before querying it
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version     INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (db.prepare("SELECT version FROM _migrations").all() as Array<{ version: number }>).map(
      (r) => r.version,
    ),
  );

  const insertMigration = db.prepare(
    "INSERT INTO _migrations (version, description) VALUES (?, ?)",
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;

    db.exec(migration.sql);
    insertMigration.run(migration.version, migration.description);
  }
}