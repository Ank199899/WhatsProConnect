const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'whatsapp.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('🗄️ Initializing database with AI Agent schema...');

// Initialize database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Split schema by semicolons and execute each statement
const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

statements.forEach((statement, index) => {
  try {
    db.exec(statement + ';');
    console.log(`✅ Executed statement ${index + 1}/${statements.length}`);
  } catch (error) {
    console.log(`⚠️ Statement ${index + 1} already exists or skipped:`, error.message);
  }
});

// Create some sample AI agents
console.log('🤖 Creating sample AI agents...');

const sampleAgents = [
  {
    id: 'agent_customer_support',
    name: 'Customer Support Agent',
    description: 'Helpful customer support agent for general inquiries',
    personality: 'helpful',
    language: 'hinglish',
    response_style: 'professional',
    auto_reply_enabled: 1,
    response_delay_min: 2,
    response_delay_max: 5,
    max_response_length: 500,
    keywords: JSON.stringify(['help', 'support', 'problem', 'issue', 'question']),
    system_prompt: 'You are a helpful customer support agent. Respond in Hinglish (mix of Hindi and English). Be polite and professional.',
    is_active: 1
  },
  {
    id: 'agent_sales',
    name: 'Sales Assistant',
    description: 'Friendly sales assistant for product inquiries',
    personality: 'enthusiastic',
    language: 'hinglish',
    response_style: 'friendly',
    auto_reply_enabled: 1,
    response_delay_min: 1,
    response_delay_max: 3,
    max_response_length: 400,
    keywords: JSON.stringify(['price', 'buy', 'purchase', 'product', 'order']),
    system_prompt: 'You are an enthusiastic sales assistant. Help customers with product information and purchases. Respond in Hinglish.',
    is_active: 1
  },
  {
    id: 'agent_technical',
    name: 'Technical Support',
    description: 'Technical support agent for troubleshooting',
    personality: 'professional',
    language: 'hinglish',
    response_style: 'formal',
    auto_reply_enabled: 1,
    response_delay_min: 3,
    response_delay_max: 7,
    max_response_length: 600,
    keywords: JSON.stringify(['technical', 'error', 'bug', 'not working', 'fix']),
    system_prompt: 'You are a technical support specialist. Provide clear, step-by-step solutions. Respond in Hinglish.',
    is_active: 1
  }
];

const insertAgent = db.prepare(`
  INSERT OR REPLACE INTO ai_agents 
  (id, name, description, personality, language, response_style, auto_reply_enabled, 
   response_delay_min, response_delay_max, max_response_length, keywords, system_prompt, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleAgents.forEach(agent => {
  try {
    insertAgent.run(
      agent.id, agent.name, agent.description, agent.personality, agent.language,
      agent.response_style, agent.auto_reply_enabled, agent.response_delay_min,
      agent.response_delay_max, agent.max_response_length, agent.keywords,
      agent.system_prompt, agent.is_active
    );
    console.log(`✅ Created sample agent: ${agent.name}`);
  } catch (error) {
    console.log(`⚠️ Agent ${agent.name} already exists or error:`, error.message);
  }
});

// Close database
db.close();

console.log('🎉 Database initialization completed successfully!');
console.log('📊 AI Agent Management system is ready to use.');
