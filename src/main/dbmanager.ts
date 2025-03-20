import Database from 'better-sqlite3-multiple-ciphers'
// const path = require("path")

// const dbPath =
//     process.env.NODE_ENV === "development"
//         ? "./test.db"
//         : path.join(process.resourcesPath, "./test.db")

// const db = new Database(dbPath)
// db.pragma("journal_mode = WAL")

// exports.db = db

//import Database from 'better-sqlite3';

// Open or create a database file
const db = new Database('test.db')

// Create a table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`)

export function getData(): { id: number; status: string }[] {
    const stmt = db.prepare('SELECT * FROM L_Listing_Status')
    console.log('Data fetched:', stmt.all())

    return stmt.all() // Returns all rows as an array of objects
}

export function insertData(name: string): void {
    const stmt = db.prepare('INSERT INTO L_Listing_Status (status) VALUES (?)')
    stmt.run(name)
}
