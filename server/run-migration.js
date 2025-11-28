const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'GoldenMunchPOS',
      multipleStatements: true
    });

    console.log('✓ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'databaseSchema/migrations/002_fix_order_item_schema_v3_to_v2_compatibility.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('✓ Read migration file');
    console.log('Running migration...\n');

    // Execute migration
    const [results] = await connection.query(migrationSQL);

    // Display results
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (Array.isArray(result) && result.length > 0) {
          console.table(result);
        }
      });
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed');
    }
  }
}

runMigration();
