import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'fs';

const PASSWORD = 'poop'; // Prompt user to set this for encryption
let db: Database | undefined;

export function initializeDatabase() {
  if (!fs.existsSync('app.db')) {
    console.log('Database does not exist. Creating new database...');

    // Create and encrypt the database
    db = new Database('app.db', {
      verbose: console.log,
    });

    //db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
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
  if (!db) throw new Error('Database is not initialized.');

  db.exec(`
    CREATE TABLE IF NOT EXISTS L_Listing_Status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Ebay (
      ebay_listing_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      title ANY NOT NULL,
      aspects ANY,
      description ANY NOT NULL,
      upc INTEGER NOT NULL,
      imageURL ANY,
      condition TEXT NOT NULL,
      packageWeightAndSize ANY,
      height INTEGER,
      length INTEGER,
      width INTEGER,
      unit TEXT,
      packageType TEXT,
      weight INTEGER,
      weightUnit TEXT,
      quantity INTEGER
    );

    CREATE TABLE IF NOT EXISTS Etsy (
      etsy_listing_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Items (
      item_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      user_id ANY UNIQUE NOT NULL,
      onEbay INTEGER NOT NULL,
      onEtsy INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Listings (
      listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      external_listing ANY NOT NULL,
      status_id INTEGER NOT NULL,
      price ANY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS L_Platform_Status (
      status_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      status TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS L_Platforms (
      platform_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Credentials (
      client_id ANY PRIMARY KEY,
      client_secret ANY NOT NULL,
      redirect_uri ANY NOT NULL
    );
    CREATE TABLE IF NOT EXISTS OAuth (
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

export function insertData(status: string): void {
  if (!db) throw new Error('Database is not initialized.');

  const stmt = db.prepare('INSERT INTO L_Listing_Status (status) VALUES (?)');
  stmt.run(status);
}

export function getTableNames(): string[] {
  if (!db) throw new Error('Database is not initialized.');

  const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`);
  const tables = stmt.all() as { name: string }[];
  console.log(tables.map(table => table.name))
  // return tables.map(table => table.name);
  //console.log(tables)
  return tables.map(table => table.name);
}

