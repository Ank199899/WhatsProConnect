-- Add sample messages for testing
INSERT INTO whatsapp_sessions (id, name, phone_number, status, is_active) 
VALUES ('test-session-1', 'Test Session', '+919876543210', 'ready', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contacts (id, session_id, whatsapp_id, name, phone_number, is_group)
VALUES ('contact-1', 'test-session-1', '919876543210@c.us', 'Test Contact', '+919876543210', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, session_id, contact_id, whatsapp_message_id, type, content, is_from_me, timestamp, status)
VALUES 
('msg-1', 'test-session-1', 'contact-1', 'wa-msg-1', 'text', 'Hello! How are you?', false, NOW() - INTERVAL '2 minutes', 'delivered'),
('msg-2', 'test-session-1', 'contact-1', 'wa-msg-2', 'text', 'I am fine, thank you!', true, NOW() - INTERVAL '1 minute', 'sent'),
('msg-3', 'test-session-1', 'contact-1', 'wa-msg-3', 'text', 'Great to hear that!', false, NOW(), 'delivered')
ON CONFLICT (id) DO NOTHING;