const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: "postgresql://postgres:bebmi1-doxjyK-fipxet@db.sogmdxhcraolqvjmdypp.supabase.co:5432/postgres?sslmode=require"
  });

  try {
    console.log('Attempting to connect to Supabase...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful:', result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testConnection();
