-- 🗄️ POSTGRESQL OPTIMIZATION FOR 10 LAKH DAILY MESSAGES
-- Enterprise database configuration for high-volume messaging

-- Memory Configuration
ALTER SYSTEM SET shared_buffers = '16GB';
ALTER SYSTEM SET effective_cache_size = '48GB';
ALTER SYSTEM SET work_mem = '512MB';
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET wal_buffers = '64MB';

-- Connection Configuration
ALTER SYSTEM SET max_connections = 500;
ALTER SYSTEM SET max_worker_processes = 16;
ALTER SYSTEM SET max_parallel_workers = 16;
ALTER SYSTEM SET max_parallel_workers_per_gather = 8;

-- Performance Configuration
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET max_wal_size = '4GB';
ALTER SYSTEM SET min_wal_size = '1GB';

-- Logging Configuration
ALTER SYSTEM SET log_destination = 'stderr';
ALTER SYSTEM SET logging_collector = on;
ALTER SYSTEM SET log_directory = 'pg_log';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Autovacuum Configuration
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_max_workers = 6;
ALTER SYSTEM SET autovacuum_naptime = '30s';
ALTER SYSTEM SET autovacuum_vacuum_threshold = 1000;
ALTER SYSTEM SET autovacuum_analyze_threshold = 500;

-- Create Indexes for Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_phone_number ON messages(phone_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_status ON whatsapp_sessions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_created_at ON whatsapp_sessions(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- Partitioning for Messages Table (by date)
CREATE TABLE IF NOT EXISTS messages_y2025m01 PARTITION OF messages
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS messages_y2025m02 PARTITION OF messages
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS messages_y2025m03 PARTITION OF messages
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Statistics Configuration
ALTER SYSTEM SET default_statistics_target = 500;
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET track_functions = 'all';

-- Apply all changes
SELECT pg_reload_conf();

-- Analyze all tables
ANALYZE;

-- Show current configuration
SELECT name, setting, unit, context 
FROM pg_settings 
WHERE name IN (
    'shared_buffers', 'effective_cache_size', 'work_mem', 
    'maintenance_work_mem', 'max_connections', 'max_worker_processes'
)
ORDER BY name;
