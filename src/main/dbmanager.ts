import Database from 'better-sqlite3-multiple-ciphers'
import fs from 'fs'
import path from 'path'
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
      height REAL,
      length REAL,
      width REAL,
      unit TEXT,
      packageType TEXT,
      weight REAL,
      weightUnit TEXT,
      quantity INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      url TEXT
    );

    CREATE TABLE IF NOT EXISTS Etsy (
      etsy_listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      url TEXT
    );

    CREATE TABLE IF NOT EXISTS Shopify (
        shopify_listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        listing_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        upc INTEGER,
        condition TEXT,
        height REAL,
        length REAL,
        width REAL,
        unit TEXT,
        weight REAL,
        weightUnit TEXT,
        quantity INTEGER,
        imageURL TEXT,
        shopifyURL TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        url TEXT
      );


    CREATE TABLE IF NOT EXISTS Items (
      item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      onEbay INTEGER NOT NULL,
      onEtsy INTEGER NOT NULL,
      onShopify INTEGER NOT NULL,
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      url TEXT,
      date_sold DATETIME 
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
      clientId TEXT,
      clientSecret TEXT NOT NULL,
      redirectUri TEXT NOT NULL,
      warehouse INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS EbayPolicies (
      payment TEXT PRIMARY KEY,
      return TEXT NOT NULL,
      fulfillment TEXT NOT NULL,
      warehouse TEXT NOT NULL
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
    VALUES ('Ebay'), ('Etsy'), ('Shopify')
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
/*-------------------------------Test Functions---------------------------------*/
// export function getData(): { id: number; status: string }[] {
//     if (!db) throw new Error('Database is not initialized.')

//     const stmt = db.prepare('SELECT * FROM L_Listing_Status')
//     return stmt.all()
// }


// export function insertData(status: string): void {
//     if (!db) throw new Error('Database is not initialized.')

//     const stmt = db.prepare('INSERT INTO L_Listing_Status (status) VALUES (?)')
//     stmt.run(status)
// }

// export function getTableNames(): string[] {
//     if (!db) throw new Error('Database is not initialized.')

//     const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
//     const tables = stmt.all() as { name: string }[]
//     console.log(tables.map((table) => table.name))
//     // return tables.map(table => table.name);
//     //console.log(tables)
//     return tables.map((table) => table.name)
// }
// export function getEbayListing() {
//     const stmt = db.prepare(`
//     SELECT ebay_listing_id, item_id, listing_id, title, description, upc, imageURL, condition,
//            height, length, width, unit, weight, weightUnit, quantity
//     FROM Ebay
//     WHERE item_id = 12345
//   `)
//     const row = stmt.all()
//     console.log(row)
//     return row
// }
//---------------------------------------------------------------------------------//

export function setShopifyProductURL(itemId: number, url: string) {
    if (!db) throw new Error('Database not initialized')
    db.prepare(`UPDATE Shopify SET shopifyURL = ? WHERE item_id = ?`).run(url, itemId)
}

export function getLatestShopifyListing() {
    if (!db) throw new Error('Database not initialized.')

    return db
        .prepare(
            `
            SELECT 
                i.item_id,
                s.title,
                s.description,
                l.price,
                s.upc,
                s.condition,
                s.height,
                s.length,
                s.width,
                s.unit,
                s.weight,
                s.weightUnit,
                s.quantity
            FROM Items i
            JOIN Listings l ON i.item_id = l.item_id
            JOIN Shopify s ON s.item_id = i.item_id
            WHERE i.onShopify = 1
            ORDER BY i.item_id DESC
            LIMIT 1
        `
        )
        .get()
}

export function closeDB() {
    if (db !== undefined) {
        db.close()
    }
}

export function insertFullListing(data: any): { success: boolean; error?: string } {
    if (!db) return { success: false, error: 'Database not initialized' }

    // i dont think this works?
    // data.imageURL = data.images.map((listing) => {
    //     listing.path(__dirname)
    // })

    // for each img, if its alr string path, keep it
    // filter out empty strings
    // join valid img paths into string separated by comma
    if (Array.isArray(data.images)) {
        data.imageURL = data.images
            .map((img) => (typeof img === 'string' ? img : img?.path || ''))
            .filter((p) => p)
            .join(',') // "/path/img1.jpg,/path/img2.jpg"
    }

    const insert = db.transaction(() => {
        //insert into Items table (only once)
        const itemStmt = db.prepare(`
          INSERT INTO Items (onEbay, onEtsy, onShopify)
          VALUES (?, ?, ?)
        `)
        const itemResult = itemStmt.run(
            data.onEbay ? 1 : 0,
            data.onEtsy ? 1 : 0,
            data.onShopify ? 1 : 0
        )
        const itemId = itemResult.lastInsertRowid

        //insert Listings and platform-specific tables
        const insertListingForPlatform = (platformName: string) => {
            const platform = db
                .prepare(`SELECT platform_id FROM L_Platforms WHERE name = ?`)
                .get(platformName)
            const status = db
                .prepare(`SELECT id FROM L_Listing_Status WHERE status = ?`)
                .get(data.status)

            if (!platform || !status) throw new Error('Invalid platform or status')

            const listingStmt = db.prepare(`
              INSERT INTO Listings (item_id, platform_id, external_listing, status_id, price)
              VALUES (?, ?, ?, ?, ?)
            `)
            const listingResult = listingStmt.run(
                itemId,
                platform.platform_id,
                data.external_listing,
                status.id,
                data.price,
                
            )
            const listingId = listingResult.lastInsertRowid

            if (platformName === 'Ebay') {
                const ebayStmt = db.prepare(`
                  INSERT INTO Ebay (
                      item_id, listing_id, title, aspects, description, upc, imageURL,
                      condition, height, length, width, unit,
                      packageType, weight, weightUnit, quantity, url
                  ) VALUES (
                      @item_id, @listing_id, @title, @aspects, @description, @upc, @imageURL,
                      @condition, @height, @length, @width, @unit,
                      @packageType, @weight, @weightUnit, @quantity, @url
                  )
                `)

                ebayStmt.run({
                    item_id: itemId,
                    listing_id: listingId,
                    title: data.title,
                    aspects: data.aspects,
                    description: data.description,
                    upc: data.upc,
                    imageURL: data.imageURL,
                    condition: data.condition,
                    height: data.height,
                    length: data.length,
                    width: data.width,
                    unit: data.unit,
                    packageType: data.packageType,
                    weight: data.weight,
                    weightUnit: data.weightUnit,
                    quantity: data.quantity,
                    url: data.ebayurl
                })
            } else if (platformName === 'Etsy') {
                const etsyStmt = db.prepare(`
                  INSERT INTO Etsy (item_id, listing_id, title)
                  VALUES (
                      @item_id, @listing_id, @title
                      )
                `)
                etsyStmt.run({
                    item_id: itemId,
                    listing_id: listingId,
                    title: data.title
                })
            } else if (platformName === 'Shopify') {
                const shopifyStmt = db.prepare(`
                    INSERT INTO Shopify (
                        item_id, listing_id, title, description, upc,
                        condition, height, length, width, unit,
                        weight, weightUnit, quantity, imageURL
                    ) VALUES (
                        @item_id, @listing_id, @title, @description, @upc,
                        @condition, @height, @length, @width, @unit,
                        @weight, @weightUnit, @quantity, @imageURL
                    )
                `)
                shopifyStmt.run({
                    item_id: itemId,
                    listing_id: listingId,
                    title: data.title,
                    description: data.description,
                    upc: data.upc,
                    condition: data.condition,
                    height: data.height,
                    length: data.length,
                    width: data.width,
                    unit: data.unit,
                    weight: data.weight,
                    weightUnit: data.weightUnit,
                    quantity: data.quantity,
                    imageURL: data.imageURL
                })
            }
        }

        if (data.onEbay) insertListingForPlatform('Ebay')
        if (data.onEtsy) insertListingForPlatform('Etsy')
        if (data.onShopify) insertListingForPlatform('Shopify')
    })

    try {
        insert()
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export function getListingHistory(): { success: boolean; data?: any[]; error?: string } {
    if (!db) return { success: false, error: 'DB not initialized' }

    try {
        const rows = db
            .prepare(
                `
        SELECT 
              Listings.item_id,
              COALESCE(Ebay.title, Etsy.title, Shopify.title, 'Untitled') AS title,
              COALESCE(Ebay.url, Etsy.url, Shopify.shopifyURL, 'Untitled') AS url,
              Listings.created_at,
              L_Listing_Status.status AS status,
              Listings.price,
              L_Platforms.name AS platform
          FROM Listings
          LEFT JOIN Ebay ON Listings.listing_id = Ebay.listing_id
          LEFT JOIN Etsy ON Listings.listing_id = Etsy.listing_id
          LEFT JOIN Shopify ON Listings.listing_id = Shopify.listing_id
          JOIN L_Listing_Status ON Listings.status_id = L_Listing_Status.id
          JOIN L_Platforms ON Listings.platform_id = L_Platforms.platform_id
          ORDER BY Listings.created_at DESC
      `
            )
            .all()

        return { success: true, data: rows }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

export function generateSecurityKey() {
    const key = crypto.randomBytes(32).toString('hex')
    //console.log(key)
    return key
}

//for analytics
export function getAnalyticsData(): { success: boolean; data?: any[]; error?: string } {
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
        const rows = db
            .prepare(
                `
            SELECT 
                Listings.created_at,
                Listings.price,
                Listings.date_sold,
                L_Platforms.name AS platform,
                L_Listing_Status.status
            FROM Listings
            JOIN L_Platforms ON Listings.platform_id = L_Platforms.platform_id
            JOIN L_Listing_Status ON Listings.status_id = L_Listing_Status.id
            ORDER BY Listings.created_at ASC
        `
            )
            .all()

        return { success: true, data: rows }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

export function getProfitByMonth(): {
  success: boolean
  data?: { month: string; total_sales: number }[]
  error?: string
} {
  if (!db) {
    console.error("DB not initialized")
    return { success: false, error: 'Database not initialized' }
  }

  try {
    const stmt = `
      SELECT 
        strftime('%Y-%m', date_sold) AS month,
        SUM(price) AS total_sales
      FROM Listings
      WHERE date_sold IS NOT NULL
      GROUP BY month
      ORDER BY month;
    `

    const data = db.prepare(stmt).all()

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}


export function getSoldByPlatform(): {
  success: boolean
  data?: { platform: string; sold_count: number }[]
  error?: string
} {
  if (!db) return { success: false, error: 'Database not initialized' }

  try {
    const data = db.prepare(`
      SELECT 
        L_Platforms.name AS platform,
        COUNT(*) AS sold_count
      FROM Listings
      JOIN L_Platforms ON Listings.platform_id = L_Platforms.platform_id
      JOIN L_Listing_Status ON Listings.status_id = L_Listing_Status.id
      WHERE L_Listing_Status.status = 'Sold'
      GROUP BY platform;
    `).all()

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}



// for ebay app
export function getEbayCredentials() {
    return db.prepare(`SELECT * FROM EbayCredentials`).all()
}

// if getEbayCredentials().length === 0 if === 1 credentials exist
// warehouse is true if warehouse exists, false otherwise only be called if getEbayCredentials().length === 1

export function setEbayCredentials(client_id, client_secret, redirect_uri) {
    db.prepare(
        'INSERT INTO EbayCredentials (clientId, clientSecret, redirectUri, warehouse) VALUES (?, ?, ?, ?)'
    ).run(client_id, client_secret, redirect_uri, 0)
}

export function set_warehouse() {
    db.prepare('UPDATE EbayCredentials SET warehouse = ?').run(1)
}

export function set_policies(data) {
    if (getEbayPolicies().length === 0) {
        db.prepare(
            'INSERT INTO EbayPolicies (payment, fulfillment, return, warehouse) VALUES (?, ?, ?, ?)'
        ).run(
            `${data.payment[1]}`,
            `${data.fulfillment[1]}`,
            `${data.return[1]}`,
            `${data.warehouse[1]}`
        )
    } else {
        db.prepare(
            'UPDATE EbayPolicies SET payment = ?, fulfillment = ?, return = ?, warehouse = ?'
        ).run(
            `${data.payment[1]}`,
            `${data.fulfillment[1]}`,
            `${data.return[1]}`,
            `${data.warehouse[1]}`
        )
    }
}

export function getEbayPolicies() {
    if (!db) return false
    return db.prepare(`SELECT * FROM EbayPolicies`).all()
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
        900 * oauth_expiry,
        900 * refresh_expiry,
        Date.now(),
        Date.now(),
        oauth_token,
        refresh_token
    )
}

// updates the oauth token to existing ebay oauth object
export function refreshEbayOauth(oauth_token, oauth_expiry) {
    db.prepare(
        `UPDATE OAuth SET oauth_created = ?, oauth_expiry = ?, oauth_token = ? WHERE platform_id = 1`
    ).run(Date.now(), oauth_expiry * 900, oauth_token)
}

// delete ebay credential if there is one
export function deleteEbayCredentials() {
    const creds = getEbayCredentials()
    if (creds.length !== 0) {
        db.prepare(`DELETE FROM EbayCredentials WHERE clientId = ?`).run(creds[0].clientId)
    }
}
