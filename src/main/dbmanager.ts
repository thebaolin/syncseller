import Database from 'better-sqlite3-multiple-ciphers'
import fs from 'fs'
import crypto from 'crypto'

//const PASSWORD = 'poop'; // Prompt user to set this for encryption
let db: Database | undefined

function createTables() {
    if (!db) throw new Error('Database is not initialized.')

    db.exec(`
    CREATE TABLE IF NOT EXISTS L_Listing_Status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Ebay (
      ebay_listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      aspects TEXT,
      description TEXT NOT NULL,
      upc INTEGER NOT NULL,
      imageURL TEXT,
      condition TEXT NOT NULL,
      packageWeightAndSize TEXT,
      height INTEGER,
      length INTEGER,
      width INTEGER,
      unit TEXT,
      packageType TEXT,
      weight INTEGER,
      weightUnit TEXT,
      quantity INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Etsy (
      etsy_listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Items (
      item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      onEbay INTEGER NOT NULL,
      onEtsy INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Listings (
      listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      external_listing TEXT NOT NULL,
      status_id INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS L_Platform_Status (
      status_id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS L_Platforms (
      platform_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS EbayCredentials (
      clientId TEXT PRIMARY KEY,
      clientSecret TEXT NOT NULL,
      redirectUri TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS OAuth (
      platform_id INTEGER,
      oauth_expiry INTEGER NOT NULL,
      refresh_expiry INTEGER NOT NULL,
      oauth_created INTEGER NOT NULL,
      refresh_created INTEGER NOT NULL,
      oauth_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS InventoryLocations (
      location_id TEXT PRIMARY KEY,
      name TEXT,
      location_type TEXT,
      location_web_url TEXT,
      phone_number TEXT,

      address_line_1 TEXT NOT NULL,
      address_line_2 TEXT,
      city TEXT NOT NULL,
      state_or_province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country_code TEXT NOT NULL,

      operating_hours TEXT,
      special_hours TEXT,
      timezone TEXT,

      ebay_synced BOOLEAN DEFAULT FALSE,
      last_synced_at DATETIME,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

    console.log('Tables created successfully.')

    db.prepare(
        `
    INSERT OR IGNORE INTO L_Listing_Status (status)
    VALUES ('Active'), ('Sold'), ('Deleted'), ('Draft')
  `
    ).run()

    db.prepare(
        `
    INSERT OR IGNORE INTO L_Platform_Status (status)
    VALUES ('Yes'), ('No')
  `
    ).run()

    db.prepare(
        `
    INSERT OR IGNORE INTO L_Platforms (name)
    VALUES ('Ebay'), ('Etsy')
  `
    ).run()
}

export function initializeDatabase(password: string, isCreateMode: boolean, dbPath = 'app.db') {
    const dbExists = fs.existsSync(dbPath)

    if (!dbExists && !isCreateMode) {
        throw new Error('Database does not exist. Please create one first.')
    }

    if (!dbExists && isCreateMode) {
        console.log('Creating new encrypted database...')
        db = new Database(dbPath, { verbose: console.log })
        db.pragma('foreign_keys = ON')
        db.pragma(`key='${password}'`)
        createTables()
        console.log('Database created and encrypted.')
    }

    if (dbExists) {
        console.log('Opening existing database...')
        db = new Database(dbPath, { verbose: console.log })
        db.pragma(`key='${password}'`)

        // Verify decryption
        try {
            const testResult = db
                .prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
                .get()
            if (!testResult) {
                throw new Error()
            }
        } catch (err) {
            throw new Error('Decryption failed. Incorrect password.')
        }

        console.log('Database opened successfully.')
    }
}

export function getData(): { id: number; status: string }[] {
    if (!db) throw new Error('Database is not initialized.')

    const stmt = db.prepare('SELECT * FROM L_Listing_Status')
    return stmt.all()
}

// export function getOAuth(): { id: number; status: string }[] {
//   if (!db) throw new Error('Database is not initialized.');

//   const stmt = db.prepare('SELECT * FROM L_Listing_Status');
//   return stmt.all();

export function insertData(status: string): void {
    if (!db) throw new Error('Database is not initialized.')

    const stmt = db.prepare('INSERT INTO L_Listing_Status (status) VALUES (?)')
    stmt.run(status)
}

export function getTableNames(): string[] {
    if (!db) throw new Error('Database is not initialized.')

    const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
    const tables = stmt.all() as { name: string }[]
    console.log(tables.map((table) => table.name))
    // return tables.map(table => table.name);
    //console.log(tables)
    return tables.map((table) => table.name)
}

export function getEbayListing() {
    const stmt = db.prepare(`
    SELECT ebay_listing_id, item_id, listing_id, title, description, upc, imageURL, condition,
           height, length, width, unit, weight, weightUnit, quantity
    FROM Ebay
    WHERE item_id = 12345
  `)
    const row = stmt.all()
    console.log(row)
    return row
}

export function generateSecurityKey() {
    const key = crypto.randomBytes(32).toString('hex')
    //console.log(key)
    return key
}
// for ebay app
export function getEbayCredentials() {
    return db.prepare(`SELECT * FROM EbayCredentials`).all()
}

export function setEbayCredentials(client_id, client_secret, redirect_uri) {
    db.prepare(
        'INSERT INTO EbayCredentials (clientId, clientSecret, redirectUri) VALUES (?, ?, ?)'
    ).run(client_id, client_secret, redirect_uri)
}

export function get_ebay_oauth() {
    return db.prepare(`SELECT * FROM OAuth WHERE platform_id = ?`).get(1)
}

export function setEbayOauth(
    oauth_token: string,
    oauth_expiry: number,
    refresh_token: string,
    refresh_expiry: number
) {
    db.prepare(
        'INSERT INTO OAuth (platform_id , oauth_expiry, refresh_expiry , oauth_created, refresh_created , oauth_token, refresh_token) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
        1,
        990 * oauth_expiry,
        990 * refresh_expiry,
        Date.now(),
        Date.now(),
        oauth_token,
        refresh_token
    )
}
