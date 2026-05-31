#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * Tests connections to both local Compass and MongoDB Atlas
 * Run this first to diagnose any connection issues
 */

const MongoClient = require('mongodb').MongoClient;
const colors = require('colors');

const COMPASS_URL = process.env.COMPASS_URL || 'mongodb://localhost:27017/heba-planet';
const ATLAS_URL = process.env.MONGO_URI || 'mongodb+srv://yshehata047_db_user:HebaPlanet123@heba-planet.f27o9jq.mongodb.net/heba-planet';

async function testConnections() {
    console.log(colors.cyan('\n🔍 Testing MongoDB Connections...\n'));

    // Test Compass
    console.log(colors.yellow('1. Testing Compass (Local MongoDB)'));
    console.log(colors.gray(`   URL: ${COMPASS_URL}`));
    try {
        const compassClient = new MongoClient(COMPASS_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        await compassClient.connect();
        const compassDb = compassClient.db('heba-planet');
        
        const collections = await compassDb.listCollections().toArray();
        const productCount = await compassDb.collection('products').countDocuments({});
        
        console.log(colors.green(`   ✓ Connected successfully`));
        console.log(colors.cyan(`   • Collections found: ${collections.length}`));
        console.log(colors.cyan(`   • Products in database: ${productCount}`));
        
        await compassClient.close();
        console.log(colors.green('   ✓ Connection closed\n'));
    } catch (error) {
        console.log(colors.red(`   ✗ Connection failed: ${error.message}`));
        console.log(colors.red('   • Ensure MongoDB is running locally on port 27017\n'));
    }

    // Test Atlas
    console.log(colors.yellow('2. Testing MongoDB Atlas'));
    console.log(colors.gray(`   URL: mongodb+srv://yshehata047_db_user:***@heba-planet.f27o9jq.mongodb.net/heba-planet`));
    try {
        const atlasClient = new MongoClient(ATLAS_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        await atlasClient.connect();
        const atlasDb = atlasClient.db('heba-planet');
        
        const collections = await atlasDb.listCollections().toArray();
        const productCount = await atlasDb.collection('products').countDocuments({});
        
        console.log(colors.green(`   ✓ Connected successfully`));
        console.log(colors.cyan(`   • Collections found: ${collections.length}`));
        console.log(colors.cyan(`   • Products in database: ${productCount}`));
        
        await atlasClient.close();
        console.log(colors.green('   ✓ Connection closed\n'));
    } catch (error) {
        console.log(colors.red(`   ✗ Connection failed: ${error.message}`));
        console.log(colors.red('   • Check your internet connection'));
        console.log(colors.red('   • Verify Atlas connection string is correct'));
        console.log(colors.red('   • Check IP whitelist in Atlas security settings\n'));
    }

    console.log(colors.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(colors.yellow('\n💡 Next Steps:'));
    console.log(colors.cyan('   • If both connections work, run: node migrate-compass-to-atlas.js'));
    console.log(colors.cyan('   • If Atlas connection fails, check your IP whitelist\n'));
}

testConnections();
