-- WhatsApp Advanced Web App Database Schema - SQLite Version

-- WhatsApp Sessions Table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'qr_code', 'ready', 'disconnected', 'auth_failure')),
    qr_code TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    whatsapp_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    is_group INTEGER DEFAULT 0,
    profile_pic_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, whatsapp_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    whatsapp_message_id TEXT NOT NULL,
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    body TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')),
    is_group_message INTEGER DEFAULT 0,
    author TEXT,
    timestamp INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, whatsapp_message_id)
);

-- Bulk Message Queue Table
CREATE TABLE IF NOT EXISTS bulk_message_queue (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    target_contacts TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_count INTEGER NOT NULL,
    delay_ms INTEGER DEFAULT 2000,
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT,
    error_message TEXT
);

-- Bulk Message Logs Table
CREATE TABLE IF NOT EXISTS bulk_message_logs (
    id TEXT PRIMARY KEY,
    bulk_queue_id TEXT NOT NULL REFERENCES bulk_message_queue(id) ON DELETE CASCADE,
    contact_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    sent_at TEXT DEFAULT (datetime('now'))
);

-- AI Agents Table
CREATE TABLE IF NOT EXISTS ai_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    personality TEXT DEFAULT 'helpful',
    language TEXT DEFAULT 'en',
    response_style TEXT DEFAULT 'professional' CHECK (response_style IN ('professional', 'casual', 'friendly', 'formal')),
    auto_reply_enabled INTEGER DEFAULT 1,
    response_delay_min INTEGER DEFAULT 1,
    response_delay_max INTEGER DEFAULT 5,
    max_response_length INTEGER DEFAULT 500,
    keywords TEXT, -- JSON array of keywords that trigger this agent
    system_prompt TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- AI Agent Session Assignments Table
CREATE TABLE IF NOT EXISTS ai_agent_sessions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    is_enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 1, -- Higher number = higher priority
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(agent_id, session_id)
);

-- AI Agent Chat Settings Table (for individual chat-level controls)
CREATE TABLE IF NOT EXISTS ai_agent_chat_settings (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    contact_number TEXT NOT NULL,
    agent_id TEXT REFERENCES ai_agents(id) ON DELETE SET NULL,
    is_enabled INTEGER DEFAULT 1,
    auto_reply_enabled INTEGER DEFAULT 1,
    custom_prompt TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, contact_number)
);

-- AI Agent Response Logs Table
CREATE TABLE IF NOT EXISTS ai_agent_responses (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    contact_number TEXT NOT NULL,
    original_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    response_time_ms INTEGER,
    confidence_score REAL DEFAULT 0.0,
    sentiment TEXT DEFAULT 'neutral',
    provider_used TEXT,
    model_used TEXT,
    tokens_used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- AI Providers Table
CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    api_endpoint TEXT,
    supported_models TEXT, -- JSON array of supported models
    default_model TEXT,
    requires_api_key INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    configuration TEXT, -- JSON object for provider-specific config
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- AI Provider API Keys Table (encrypted storage)
CREATE TABLE IF NOT EXISTS ai_provider_keys (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    user_id TEXT DEFAULT 'default',
    api_key_encrypted TEXT NOT NULL,
    api_key_hash TEXT NOT NULL, -- For verification without decryption
    additional_config TEXT, -- JSON for extra config like organization_id, etc.
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(provider_id, user_id)
);

-- AI Agent Provider Assignments
CREATE TABLE IF NOT EXISTS ai_agent_providers (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    model_name TEXT,
    priority INTEGER DEFAULT 1, -- Higher number = higher priority
    fallback_enabled INTEGER DEFAULT 1,
    custom_config TEXT, -- JSON for agent-specific provider config
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(agent_id, provider_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_active ON whatsapp_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_session_id ON contacts(session_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_from_to ON messages(from_number, to_number);
CREATE INDEX IF NOT EXISTS idx_bulk_queue_session_id ON bulk_message_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_bulk_queue_status ON bulk_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_bulk_logs_queue_id ON bulk_message_logs(bulk_queue_id);

-- AI Agent Indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON ai_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_agent ON ai_agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_session ON ai_agent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_enabled ON ai_agent_sessions(is_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_agent_chat_settings_session ON ai_agent_chat_settings(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_chat_settings_contact ON ai_agent_chat_settings(contact_number);
CREATE INDEX IF NOT EXISTS idx_ai_agent_responses_agent ON ai_agent_responses(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_responses_session ON ai_agent_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_responses_contact ON ai_agent_responses(contact_number);

-- AI Provider Indexes
CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_provider ON ai_provider_keys(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_user ON ai_provider_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_active ON ai_provider_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agent_providers_agent ON ai_agent_providers(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_providers_provider ON ai_agent_providers(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_providers_priority ON ai_agent_providers(priority);
CREATE INDEX IF NOT EXISTS idx_ai_agent_providers_active ON ai_agent_providers(is_active);

-- Triggers for updated_at (SQLite version)
CREATE TRIGGER IF NOT EXISTS update_whatsapp_sessions_updated_at
AFTER UPDATE ON whatsapp_sessions
FOR EACH ROW
BEGIN
    UPDATE whatsapp_sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_contacts_updated_at
AFTER UPDATE ON contacts
FOR EACH ROW
BEGIN
    UPDATE contacts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- AI Agent Triggers
CREATE TRIGGER IF NOT EXISTS update_ai_agents_updated_at
AFTER UPDATE ON ai_agents
FOR EACH ROW
BEGIN
    UPDATE ai_agents SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_ai_agent_sessions_updated_at
AFTER UPDATE ON ai_agent_sessions
FOR EACH ROW
BEGIN
    UPDATE ai_agent_sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_ai_agent_chat_settings_updated_at
AFTER UPDATE ON ai_agent_chat_settings
FOR EACH ROW
BEGIN
    UPDATE ai_agent_chat_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- AI Provider Triggers
CREATE TRIGGER IF NOT EXISTS update_ai_providers_updated_at
AFTER UPDATE ON ai_providers
FOR EACH ROW
BEGIN
    UPDATE ai_providers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_ai_provider_keys_updated_at
AFTER UPDATE ON ai_provider_keys
FOR EACH ROW
BEGIN
    UPDATE ai_provider_keys SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_ai_agent_providers_updated_at
AFTER UPDATE ON ai_agent_providers
FOR EACH ROW
BEGIN
    UPDATE ai_agent_providers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Views for analytics (SQLite version)
CREATE VIEW IF NOT EXISTS session_analytics AS
SELECT
    s.id,
    s.name,
    s.phone_number,
    s.status,
    s.created_at,
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.created_at >= datetime('now', '-24 hours') THEN m.id END) as messages_last_24h,
    COUNT(DISTINCT bq.id) as total_bulk_campaigns,
    COALESCE(SUM(bq.sent_count), 0) as total_bulk_messages_sent
FROM whatsapp_sessions s
LEFT JOIN contacts c ON s.id = c.session_id
LEFT JOIN messages m ON s.id = m.session_id
LEFT JOIN bulk_message_queue bq ON s.id = bq.session_id
GROUP BY s.id, s.name, s.phone_number, s.status, s.created_at;
