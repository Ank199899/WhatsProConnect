const fetch = require('node-fetch');

async function testFrontendBackendConnection() {
  console.log('🔄 Testing Frontend-Backend Connection...');
  
  try {
    // Test 1: Frontend sessions API
    console.log('📡 Step 1: Testing frontend sessions API...');
    const sessionsResponse = await fetch('http://localhost:3008/api/whatsapp/sessions');
    const sessionsData = await sessionsResponse.json();
    
    if (sessionsData.success && sessionsData.sessions.length > 0) {
      console.log('✅ Frontend sessions API working:', sessionsData.sessions.length, 'sessions');
      
      const firstSession = sessionsData.sessions[0];
      console.log('📱 First session:', {
        id: firstSession.id,
        name: firstSession.name,
        status: firstSession.status,
        isReady: firstSession.isReady
      });
      
      // Test 2: WhatsAppManager getChats call (simulating frontend behavior)
      console.log('📱 Step 2: Testing WhatsAppManager.getChats simulation...');
      const chatsResponse = await fetch(`http://localhost:3006/api/sessions/${firstSession.id}/chats`);
      const chatsData = await chatsResponse.json();
      
      if (chatsData.success) {
        console.log('✅ Backend chats API working:', chatsData.chats.length, 'chats');
        console.log('📊 Chats:', chatsData.chats.map(chat => ({
          id: chat.id,
          name: chat.name,
          unreadCount: chat.unreadCount,
          lastMessage: chat.lastMessage?.body || 'No message'
        })));
      } else {
        console.log('❌ Backend chats API failed:', chatsData.error);
      }
      
    } else {
      console.log('❌ Frontend sessions API failed:', sessionsData.error);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testFrontendBackendConnection();
