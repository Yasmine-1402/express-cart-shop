require('dotenv').config();
const { MongoClient } = require('mongodb');
const { getConfig } = require('../lib/common');
const colors = require('colors');

const config = getConfig();
const connectionString = process.env.MONGO_URI || process.env.DATABASE_URL || config.databaseConnectionString;

async function createIndexes() {
    if (!connectionString) {
        console.error(colors.red('No database connection string found.'));
        process.exit(1);
    }

    console.log(colors.cyan(`Connecting to MongoDB...`));
    
    let client;
    try {
        client = await MongoClient.connect(connectionString, {});
        const db = client.db();

        console.log(colors.cyan('Creating indexes for products collection...'));
        await db.collection('products').createIndex({ title: 1 });
        await db.collection('products').createIndex({ category: 1 });
        await db.collection('products').createIndex({ productType: 1 });

        console.log(colors.cyan('Creating indexes for customers collection...'));
        await db.collection('customers').createIndex({ email: 1 }, { unique: true });

        console.log(colors.cyan('Creating indexes for orders collection...'));
        await db.collection('orders').createIndex({ orderCustomer: 1 });
        await db.collection('orders').createIndex({ orderDate: -1 });

        console.log(colors.cyan('Creating indexes for transactions collection...'));
        await db.collection('transactions').createIndex({ order: 1 });

        console.log(colors.cyan('Creating indexes for users collection...'));
        await db.collection('users').createIndex({ userEmail: 1 }, { unique: true });

        console.log(colors.green('Indexes created successfully.'));
    } catch (err) {
        console.error(colors.red(`Failed to create indexes: ${err.message}`));
    } finally {
        if (client) {
            await client.close();
        }
        process.exit(0);
    }
}

createIndexes();
