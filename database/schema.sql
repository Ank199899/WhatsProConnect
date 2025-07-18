-- WhatsApp Advanced Web App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- WhatsApp Sessions Table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'qr_code', 'ready', 'disconnected', 'auth_failure')),
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    whatsapp_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    is_group BOOLEAN DEFAULT false,
    profile_pic_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, whatsapp_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    whatsapp_message_id VARCHAR(255) NOT NULL,
    from_number VARCHAR(255) NOT NULL,
    to_number VARCHAR(255) NOT NULL,
    body TEXT,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')),
    is_group_message BOOLEAN DEFAULT false,
    author VARCHAR(255),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, whatsapp_message_id)
);

-- Bulk Message Queue Table
CREATE TABLE IF NOT EXISTS bulk_message_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    target_contacts TEXT[] NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_count INTEGER NOT NULL,
    delay_ms INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Bulk Message Logs Table
CREATE TABLE IF NOT EXISTS bulk_message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_queue_id UUID NOT NULL REFERENCES bulk_message_queue(id) ON DELETE CASCADE,
    contact_number VARCHAR(255) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Functions to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_whatsapp_sessions_updated_at BEFORE UPDATE ON whatsapp_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_message_logs ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can customize these based on your auth requirements)
CREATE POLICY "Allow all operations on whatsapp_sessions" ON whatsapp_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on contacts" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on bulk_message_queue" ON bulk_message_queue FOR ALL USING (true);
CREATE POLICY "Allow all operations on bulk_message_logs" ON bulk_message_logs FOR ALL USING (true);

-- Views for analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    s.id,
    s.name,
    s.phone_number,
    s.status,
    s.created_at,
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.created_at >= NOW() - INTERVAL '24 hours' THEN m.id END) as messages_last_24h,
    COUNT(DISTINCT bq.id) as total_bulk_campaigns,
    COALESCE(SUM(bq.sent_count), 0) as total_bulk_messages_sent
FROM whatsapp_sessions s
LEFT JOIN contacts c ON s.id = c.session_id
LEFT JOIN messages m ON s.id = m.session_id
LEFT JOIN bulk_message_queue bq ON s.id = bq.session_id
GROUP BY s.id, s.name, s.phone_number, s.status, s.created_at;

-- Function to clean old data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old messages
    DELETE FROM messages WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old bulk message logs
    DELETE FROM bulk_message_logs WHERE sent_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Delete completed bulk message queues older than specified days
    DELETE FROM bulk_message_queue 
    WHERE status IN ('completed', 'failed') 
    AND created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
