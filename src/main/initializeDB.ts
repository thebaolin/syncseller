// import fs from 'fs';
// import path from 'path';
// import Database from 'better-sqlite3-multiple-ciphers';

// //const DB_PATH = path.join(__dirname, '../app.db'); // Adjust the path as needed
// //console.log(`DB Path: ${DB_PATH}`);

// //const PASSWORD = 'poop'; // Prompt user to set this for encryption

// export function initializeDatabase() {
//   if (!fs.existsSync('app.db')) {
//     console.log('Database does not exist. Creating new database...');

//     // Create a new database file with encryption
//     const db = new Database('app.db', {
//       verbose: console.log, // Logs SQL queries to console (optional)
//       //memory: false, // Ensures the file is created on disk
//     });

//     // Encrypt the database
//     //db.pragma(`rekey='${PASSWORD}'`);

//     console.log('Database created and encrypted.');

//     // Create tables
//     createTables(db);

//     //db.close();
//   } else {
//     console.log('Database already exists.');
//   }
// }

// function createTables(db: Database) {
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS L_Listing_Status (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       status TEXT UNIQUE NOT NULL
//     );
//   `);

//   console.log('Tables created successfully.');
// }
