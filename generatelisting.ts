//This will only inserts into etsy, items, and listing. ebay and shopify is empty. but for now its ok because we only trying to simulate analytics anyway. 
// the only important tables would be items and listing. 
const Database = require('better-sqlite3-multiple-ciphers');

const db = new Database('C:/Users/ivy/Downloads/app.db', { fileMustExist: true });
db.pragma(`key = '38ab17d0419229648845039b0e8240e9f74a3194513a3e1fa6abe1413fd7911b'`);

const platforms = ['Ebay', 'Etsy', 'Shopify'];
const statuses = ['Active', 'Sold', 'Deleted', 'Draft'];

function getRandomDateWithinMonths(monthsBack: number): string {
    const now = new Date();
    const past = new Date();
    past.setMonth(past.getMonth() - monthsBack);

    const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
    const randomDate = new Date(randomTime);

    return randomDate.toISOString().slice(0, 19).replace('T', ' '); // Format as 'YYYY-MM-DD HH:MM:SS'
}

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createFakeListings(count: number) {
    const insert = db.transaction(() => {
        for (let i = 0; i < count; i++) {
            let onEbay = Math.random() < 0.5 ? 1 : 0;    
            let onEtsy = Math.random() < 0.5 ? 1 : 0;
            let onShopify = Math.random() < 0.5 ? 1 : 0;

            if (onEbay + onEtsy + onShopify === 0) {
                onEbay = 1;
            }

            // Insert into Items
            const itemStmt = db.prepare(`
              INSERT INTO Items (onEbay, onEtsy, onShopify)
              VALUES (?, ?, ?)
            `);
            const itemResult = itemStmt.run(onEbay, onEtsy, onShopify);
            const itemId = itemResult.lastInsertRowid;

            const randomCreatedAt = getRandomDateWithinMonths(6); // 6 months back
            const randomPrice = getRandomInt(10, 500); // $10 to $500
            const randomStatus = statuses[getRandomInt(0, statuses.length - 1)];

            //insert Listings for each platform selected
            const platformsSelected = [];
            if (onEbay) platformsSelected.push('Ebay');
            if (onEtsy) platformsSelected.push('Etsy');
            if (onShopify) platformsSelected.push('Shopify');

            platformsSelected.forEach(platformName => {
                const platform = db.prepare(`SELECT platform_id FROM L_Platforms WHERE name = ?`).get(platformName);
                const status = db.prepare(`SELECT id FROM L_Listing_Status WHERE status = ?`).get(randomStatus);

                const listingStmt = db.prepare(`
                  INSERT INTO Listings (item_id, platform_id, external_listing, status_id, price, created_at)
                  VALUES (?, ?, ?, ?, ?, ?)
                `);
                const listingResult = listingStmt.run(
                    itemId,
                    platform.platform_id,
                    `${platformName}-FakeListing-${Math.random().toString(36).substring(2, 8)}`, // fake external ID
                    status.id,
                    randomPrice,
                    randomCreatedAt
                );
                const listingId = listingResult.lastInsertRowid;

                // Insert into platform-specific table
                if (platformName === 'Ebay') {
                    const ebayStmt = db.prepare(`
                      INSERT INTO Ebay (item_id, listing_id, title, aspects, description, upc, imageURL, condition, height, length, width, unit, packageType, weight, weightUnit, quantity)
                      VALUES (@item_id, @listing_id, @title, @aspects, @description, @upc, @imageURL, @condition, @height, @length, @width, @unit, @packageType, @weight, @weightUnit, @quantity)
                    `);
                    ebayStmt.run({
                        item_id: itemId,
                        listing_id: listingId,
                        title: `Ebay Item ${Math.random().toString(36).substring(2, 7)}`,
                        aspects: '[]',
                        description: 'A fake description for eBay.',
                        upc: getRandomInt(100000000000, 999999999999),
                        imageURL: '',
                        condition: 'New with tags',
                        height: getRandomInt(1, 10),
                        length: getRandomInt(1, 10),
                        width: getRandomInt(1, 10),
                        unit: 'in',
                        packageType: 'Package/Thick Envelope',
                        weight: getRandomInt(1, 5),
                        weightUnit: 'pounds',
                        quantity: getRandomInt(1, 10)
                    });
                } else if (platformName === 'Etsy') {
                    const etsyStmt = db.prepare(`
                        INSERT INTO Etsy (item_id, listing_id, title)
                        VALUES (?, ?, ?)
                      `);
                      etsyStmt.run(
                        itemId,
                        listingId,
                        `Etsy Item ${Math.random().toString(36).substring(2, 7)}`  // Random Etsy title
                      );

                    
                } else if (platformName === 'Shopify') {
                    const shopifyStmt = db.prepare(`
                      INSERT INTO Shopify (item_id, listing_id, title)
                      VALUES (?, ?, ?)
                    `);
                    shopifyStmt.run(
                        itemId,
                        listingId,
                        `Shopify Item ${Math.random().toString(36).substring(2, 7)}`);
                }
            });
        }
    });

    insert();
    console.log(`${count} fake listings inserted.`);
}

createFakeListings(100);  // Insert 100 fake listings
