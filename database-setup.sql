-- 🗄️ WhatsApp Advanced Web App - Server Database Setup
-- PostgreSQL Database Schema and Initial Setup

-- Create database (run this as postgres superuser)
-- CREATE DATABASE whatsapp_advanced;
-- CREATE USER whatsapp_user WITH PASSWORD 'whatsapp_secure_password_2025';
-- GRANT ALL PRIVILEGES ON DATABASE whatsapp_advanced TO whatsapp_user;

-- Connect to whatsapp_advanced database and run the following:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- WhatsApp Sessions Table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'initializing' 
        CHECK (status IN ('initializing', 'qr_code', 'ready', 'disconnected', 'auth_failure')),
    qr_code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    whatsapp_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone_number VARCHAR(50),
    is_group BOOLEAN NOT NULL DEFAULT false,
    profile_pic_url TEXT,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    contact_id VARCHAR(255) NOT NULL,
    whatsapp_message_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact')),
    content TEXT NOT NULL,
    media_url TEXT,
    is_from_me BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Message Templates Table
CREATE TABLE IF NOT EXISTS message_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bulk Message Queue Table
CREATE TABLE IF NOT EXISTS bulk_message_queue (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_id VARCHAR(255) NOT NULL,
    contact_numbers TEXT[] NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE CASCADE
);

-- Bulk Message Logs Table
CREATE TABLE IF NOT EXISTS bulk_message_logs (
    id VARCHAR(255) PRIMARY KEY,
    bulk_queue_id VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bulk_queue_id) REFERENCES bulk_message_queue(id) ON DELETE CASCADE
);

-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'agent', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_active ON whatsapp_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_session_id ON contacts(session_id);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_id ON contacts(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_bulk_queue_status ON bulk_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_bulk_logs_queue_id ON bulk_message_logs(bulk_queue_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert default admin user (password: Ankit@9718577453)
INSERT INTO users (id, username, email, password_hash, role, is_active) 
VALUES (
    'admin-' || uuid_generate_v4(),
    'ankit1999899',
    'ankit.chauhan1911@outlook.com',
    '$2b$10$rQJ8YQZ9X.K5vQ7ZQJ8YQZ9X.K5vQ7ZQJ8YQZ9X.K5vQ7ZQJ8YQZ9X',
    'admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert sample message templates
INSERT INTO message_templates (id, name, content, variables, category, is_active) VALUES
('template-' || uuid_generate_v4(), 'Welcome Message', 'Welcome {{name}}! Thanks for joining us.', ARRAY['name'], 'welcome', true),
('template-' || uuid_generate_v4(), 'Order Confirmation', 'Hi {{name}}, your order #{{order_id}} has been confirmed.', ARRAY['name', 'order_id'], 'orders', true),
('template-' || uuid_generate_v4(), 'Reminder', 'Hi {{name}}, this is a reminder about {{event}}.', ARRAY['name', 'event'], 'reminders', true)
ON CONFLICT (id) DO NOTHING;

-- User Preferences Table (Replace localStorage)
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT NOT NULL,
    preference_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (preference_type IN ('string', 'number', 'boolean', 'json')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, preference_key)
);

-- User Sessions Table (Replace browser sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- WhatsApp Session Data Table (Replace local files)
CREATE TABLE IF NOT EXISTS whatsapp_session_data (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('auth', 'cookies', 'local_storage', 'session_storage', 'cache')),
    data_key VARCHAR(255) NOT NULL,
    data_value TEXT NOT NULL,
    encrypted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    UNIQUE(session_id, data_type, data_key)
);

-- Application Settings Table (Global settings)
CREATE TABLE IF NOT EXISTS application_settings (
    id VARCHAR(255) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cache Table (Replace in-memory cache)
CREATE TABLE IF NOT EXISTS application_cache (
    id VARCHAR(255) PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_value TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_session_data_session_id ON whatsapp_session_data(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_session_data_type ON whatsapp_session_data(data_type);
CREATE INDEX IF NOT EXISTS idx_application_settings_key ON application_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_application_cache_key ON application_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_application_cache_expires ON application_cache(expires_at);

-- Insert default application settings
INSERT INTO application_settings (id, setting_key, setting_value, setting_type, description, is_public) VALUES
('setting-' || uuid_generate_v4(), 'app_name', 'WhatsApp Advanced', 'string', 'Application name', true),
('setting-' || uuid_generate_v4(), 'app_version', '2.0.0', 'string', 'Application version', true),
('setting-' || uuid_generate_v4(), 'max_sessions', '50', 'number', 'Maximum concurrent WhatsApp sessions', false),
('setting-' || uuid_generate_v4(), 'session_timeout', '86400', 'number', 'Session timeout in seconds (24 hours)', false),
('setting-' || uuid_generate_v4(), 'enable_auto_backup', 'true', 'boolean', 'Enable automatic database backup', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Grant permissions to whatsapp_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO whatsapp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO whatsapp_user;

-- Success message
SELECT 'WhatsApp Advanced Database Setup Complete with Full PostgreSQL Storage!' as status;
