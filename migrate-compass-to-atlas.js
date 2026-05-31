#!/usr/bin/env node

/**
 * MongoDB Data Migration Script: Compass (Local) to Atlas (Cloud)
 * 
 * Usage:
 *   node migrate-compass-to-atlas.js
 * 
 * This script will:
 *   1. Connect to local Compass MongoDB
 *   2. Connect to MongoDB Atlas
 *   3. Copy all collections from local to Atlas
 *   4. Verify the migration was successful
 */

const MongoClient = require('mongodb').MongoClient;
const colors = require('colors');

// Configuration
const COMPASS_URL = process.env.COMPASS_URL || 'mongodb://localhost:27017/heba-planet';
const ATLAS_URL = process.env.MONGO_URI || 'mongodb+srv://yshehata047_db_user:HebaPlanet123@heba-planet.f27o9jq.mongodb.net/heba-planet';

// Collections to migrate
const COLLECTIONS_TO_MIGRATE = [
    'products',
    'variants',
    'pages',
    'menu',
    'discounts',
    'reviews',
    'courses'
];

async function migrateData() {
    let compassClient;
    let atlasClient;

    try {
        console.log(colors.cyan('\n🔄 Starting MongoDB migration from Compass to Atlas...\n'));

        // Connect to Compass (local)
        console.log(colors.yellow('📍 Connecting to Compass (local MongoDB)...'));
        compassClient = new MongoClient(COMPASS_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await compassClient.connect();
        const compassDb = compassClient.db('heba-planet');
        console.log(colors.green('✓ Connected to Compass\n'));

        // Connect to Atlas
        console.log(colors.yellow('☁️  Connecting to MongoDB Atlas...'));
        atlasClient = new MongoClient(ATLAS_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await atlasClient.connect();
        const atlasDb = atlasClient.db('heba-planet');
        console.log(colors.green('✓ Connected to Atlas\n'));

        // Migrate each collection
        console.log(colors.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
        
        for (const collectionName of COLLECTIONS_TO_MIGRATE) {
            await migrateCollection(compassDb, atlasDb, collectionName);
        }

        console.log(colors.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        // Summary
        console.log(colors.green.bold('\n✓ Migration completed successfully!\n'));
        console.log(colors.yellow('Summary:'));
        console.log(colors.cyan(`  • Collections migrated: ${COLLECTIONS_TO_MIGRATE.join(', ')}`));
        console.log(colors.cyan('  • All data has been transferred to MongoDB Atlas'));
        console.log(colors.cyan('  • Your application is now using the cloud database\n'));

    } catch (error) {
        console.error(colors.red(`\n✗ Migration failed: ${error.message}\n`));
        process.exit(1);
    } finally {
        // Close connections
        if (compassClient) {
            await compassClient.close();
        }
        if (atlasClient) {
            await atlasClient.close();
        }
    }
}

async function migrateCollection(sourceDb, targetDb, collectionName) {
    try {
        console.log(colors.yellow(`Migrating collection: ${collectionName}...`));

        // Get source collection
        const sourceCollection = sourceDb.collection(collectionName);
        const documents = await sourceCollection.find({}).toArray();

        if (documents.length === 0) {
            console.log(colors.gray(`  → No documents to migrate\n`));
            return;
        }

        // Clear target collection
        const targetCollection = targetDb.collection(collectionName);
        await targetCollection.deleteMany({});

        // Insert documents into target
        if (documents.length > 0) {
            const result = await targetCollection.insertMany(documents);
            console.log(colors.green(`  ✓ Migrated ${result.insertedIds.length} documents`));
        }

        // Verify migration
        const targetCount = await targetCollection.countDocuments({});
        const sourceCount = await sourceCollection.countDocuments({});

        if (sourceCount === targetCount) {
            console.log(colors.green(`  ✓ Verification passed: ${targetCount} documents confirmed\n`));
        } else {
            console.log(colors.red(`  ✗ Verification failed: Expected ${sourceCount}, got ${targetCount}\n`));
            throw new Error(`Mismatch in document count for ${collectionName}`);
        }

    } catch (error) {
        console.error(colors.red(`  ✗ Failed to migrate ${collectionName}: ${error.message}\n`));
        throw error;
    }
}

// Run migration
migrateData();
