# MongoDB Atlas Migration Guide

## Problem Summary

Your Express Cart application was crashing when creating customer accounts after switching from local MongoDB (Compass) to MongoDB Atlas. This was caused by **outdated MongoDB driver API usage**.

### Root Cause
In your `routes/customer.js`, the code was using:
```javascript
const customerReturn = newCustomer.ops[0];
```

The `.ops` property was removed in MongoDB driver 3.x. The newer API uses `insertedId` instead.

---

## Solution Applied

### 1. ✅ Fixed Customer Creation (routes/customer.js)

**Changed from:**
```javascript
const newCustomer = await db.customers.insertOne(customerObj);
const customerReturn = newCustomer.ops[0];  // ❌ OLD - No longer works
```

**Changed to:**
```javascript
const newCustomer = await db.customers.insertOne(customerObj);
const customerReturn = {
    _id: newCustomer.insertedId,
    email: customerObj.email,
    // ... other fields
};  // ✅ NEW - Works with driver 3.x+
```

---

## Data Migration Steps

Now you need to migrate your product data from Compass (local) to Atlas (cloud):

### Step 1: Test Database Connections

Before running the migration, verify both databases are accessible:

```bash
node test-db-connection.js
```

**You should see:**
```
✓ Connected to Compass
  • Collections found: X
  • Products in database: Y

✓ Connected to MongoDB Atlas
  • Collections found: X  
  • Products in database: Y
```

### Step 2: Run the Migration

If both connections work, migrate your data:

```bash
node migrate-compass-to-atlas.js
```

**The script will:**
- Connect to local Compass
- Connect to MongoDB Atlas
- Copy all collections: products, variants, pages, menu, discounts, reviews, courses
- Verify the data transferred correctly
- Display migration summary

### Step 3: Verify in Your Application

1. Start your Express Cart app
2. Try creating a new customer account
3. Check the admin dashboard for products

---

## Troubleshooting

### ❌ "Cannot connect to Compass (localhost:27017)"
- Ensure MongoDB is running locally
- **Windows:** Look for MongoDB Service running
- **Mac/Linux:** Run `brew services start mongodb-community`
- Try: `mongo mongodb://localhost:27017`

### ❌ "Cannot connect to MongoDB Atlas"

**Common issues:**
1. **IP Whitelist:** Your IP might not be whitelisted in Atlas
   - Go to https://cloud.mongodb.com/
   - Select your cluster
   - Network Access → IP Whitelist
   - Add your current IP (or 0.0.0.0/0 for development)

2. **Wrong connection string:** Verify in `config/settings.json`:
   ```json
   "databaseConnectionString": "mongodb+srv://yshehata047_db_user:HebaPlanet123@heba-planet.f27o9jq.mongodb.net/heba-planet"
   ```

3. **Password special characters:** If your password contains special characters, URL-encode them

### ❌ "Migration verification failed"
- Connection was successful but data didn't transfer
- Check MongoDB Atlas connection logs
- Try migration again: `node migrate-compass-to-atlas.js`

---

## After Migration

### Update Your .env or env.yaml
Your app should already be configured to use Atlas. Verify in your config:
```json
// config/settings.json
"databaseConnectionString": "mongodb+srv://yshehata047_db_user:HebaPlanet123@heba-planet.f27o9jq.mongodb.net/heba-planet"
```

### Keep or Remove Local Database?
- **Keep Compass:** Useful for local development and testing
- **Remove Compass:** If you only want to use Atlas

You can use both simultaneously - just ensure you're pointing to the right database in different environments.

---

## Files Modified/Created

✅ **Modified:**
- `routes/customer.js` - Fixed .ops[0] issue

✨ **Created:**
- `migrate-compass-to-atlas.js` - Main migration script
- `test-db-connection.js` - Connection test utility
- `MIGRATION_GUIDE.md` - This file

---

## Quick Reference

```bash
# Test connections first
node test-db-connection.js

# Run migration
node migrate-compass-to-atlas.js

# Start app (should now work with Atlas)
npm start
```

---

## Additional Notes

- Migration script migrates: products, variants, pages, menu, discounts, reviews, courses
- User and order data remains in Atlas (not transferred from local)
- Sessions are stored in MongoDB Atlas (connect-mongodb-session)
- All future data will be saved to Atlas

✅ Your application is now ready for MongoDB Atlas!
