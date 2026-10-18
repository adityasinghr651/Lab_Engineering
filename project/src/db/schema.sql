-- src/db/schema.sql

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    
    CONSTRAINT chk_user_name_len CHECK (char_length(name) >= 2),
    CONSTRAINT chk_user_role CHECK (role IN ('admin', 'member'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key VARCHAR(10) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    
    CONSTRAINT chk_project_name_len CHECK (char_length(name) >= 2),
    CONSTRAINT chk_project_key_len CHECK (char_length(key) >= 2 AND char_length(key) <= 10)
);

CREATE INDEX IF NOT EXISTS idx_projects_key ON projects(key);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);


-- Issues Table
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    
    CONSTRAINT chk_issue_title_min_length CHECK (char_length(title) >= 5),
    CONSTRAINT chk_issue_status CHECK (status IN ('open', 'in-progress', 'closed')),
    CONSTRAINT chk_issue_priority CHECK (priority IN ('low', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_creator_id ON issues(creator_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee_id ON issues(assignee_id);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    
    CONSTRAINT chk_comment_content_len CHECK (char_length(trim(content)) >= 1)
);

CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

