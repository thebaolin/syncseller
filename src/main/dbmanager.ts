import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'fs';

const PASSWORD = 'poop'; // Prompt user to set this for encryption
let db: Database;

export function initializeDatabase() {
  if (!fs.existsSync('app.db')) {
    console.log('Database does not exist. Creating new database...');

    // Create and encrypt the database
    db = new Database('app.db', {
      verbose: console.log,
    });

    db.pragma(`key='${PASSWORD}'`);
    console.log('Database created and encrypted.');

    // Create tables
    createTables();
  } else {
    console.log('Database already exists.');
    
    // Open existing database with encryption key
    db = new Database('app.db', {
      verbose: console.log,
    });
    db.pragma(`key='${PASSWORD}'`);
  }
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS L_Listing_Status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT UNIQUE NOT NULL
    );













    
  `);

  console.log('Tables created successfully.');
}

export function getData(): { id: number; status: string }[] {
  if (!db) throw new Error('Database is not initialized.');
  
  const stmt = db.prepare('SELECT * FROM L_Listing_Status');
  return stmt.all();
}

export function insertData(name: string): void {
  if (!db) throw new Error('Database is not initialized.');
  
  const stmt = db.prepare('INSERT INTO L_Listing_Status (status) VALUES (?)');
  stmt.run(name);
}
