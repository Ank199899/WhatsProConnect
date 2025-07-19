#!/usr/bin/env node

/**
 * Cleanup script to remove duplicate sessions and fix database inconsistencies
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'whatsapp.db');

try {
    console.log('🧹 Starting cleanup process...');
    
    const db = new Database(dbPath);
    
    // Get all sessions
    const sessions = db.prepare('SELECT * FROM whatsapp_sessions ORDER BY created_at').all();
    console.log(`📊 Found ${sessions.length} sessions in database`);
    
    // Group by name to find duplicates
    const sessionsByName = {};
    sessions.forEach(session => {
        if (!sessionsByName[session.name]) {
            sessionsByName[session.name] = [];
        }
        sessionsByName[session.name].push(session);
    });
    
    // Remove duplicates (keep the oldest one)
    let duplicatesRemoved = 0;
    for (const [name, sessionList] of Object.entries(sessionsByName)) {
        if (sessionList.length > 1) {
            console.log(`🔍 Found ${sessionList.length} duplicates for session "${name}"`);
            
            // Sort by created_at and keep the first one
            sessionList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const keepSession = sessionList[0];
            const duplicates = sessionList.slice(1);
            
            console.log(`✅ Keeping session: ${keepSession.id} (${keepSession.created_at})`);
            
            // Remove duplicates
            for (const duplicate of duplicates) {
                console.log(`❌ Removing duplicate: ${duplicate.id} (${duplicate.created_at})`);
                
                // Delete related data first
                db.prepare('DELETE FROM messages WHERE session_id = ?').run(duplicate.id);
                db.prepare('DELETE FROM contacts WHERE session_id = ?').run(duplicate.id);
                db.prepare('DELETE FROM bulk_message_queue WHERE session_id = ?').run(duplicate.id);
                
                // Delete the session
                db.prepare('DELETE FROM whatsapp_sessions WHERE id = ?').run(duplicate.id);
                duplicatesRemoved++;
            }
        }
    }
    
    // Update statistics
    const finalCount = db.prepare('SELECT COUNT(*) as count FROM whatsapp_sessions').get().count;
    
    console.log(`\n📈 Cleanup Summary:`);
    console.log(`   - Initial sessions: ${sessions.length}`);
    console.log(`   - Duplicates removed: ${duplicatesRemoved}`);
    console.log(`   - Final sessions: ${finalCount}`);
    
    db.close();
    console.log('✅ Cleanup completed successfully!');
    
} catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
}
