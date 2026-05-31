# Heba Planet Implementation Plan
## Role Separation & Step-by-Step Execution Guide

**Project:** ExpressCart → Heba Planet Educational Marketplace  
**Date:** May 30, 2026  
**Status:** Ready for Phase 1 Execution

---

## ROLE BREAKDOWN

### 🤖 **MY ROLE (GitHub Copilot - Automated Code Changes)**

1. **File Modifications** - Systematic code updates across 68 files
   - Configuration files (settings, schema, menu, locales)
   - JavaScript business logic files (lib/, routes/)
   - Handlebars template files (views/)
   - Style and asset files
   - Database seed/test data

2. **Code Generation** - Create new files from scratch
   - New routes for educational features
   - New library modules for courses/coaching
   - New Handlebars templates
   - New theme files

3. **Validation** - Verify changes don't break existing functionality
   - Syntax checking (JSON, JavaScript)
   - Logical consistency verification
   - Configuration validation against schema

4. **Documentation** - Generate implementation guides and technical specs

### 👤 **YOUR ROLE (Manual Operations)**

1. **MongoDB Database Setup & Management**
   - Create database collections with indexes
   - Import sample data
   - Verify data integrity
   - Backup production data

2. **Testing & QA**
   - Functional testing of all features
   - Payment gateway verification
   - Cross-browser testing
   - User acceptance testing (UAT)

3. **Deployment & DevOps**
   - Environment setup (development → staging → production)
   - Application startup and health checks
   - Performance monitoring
   - Rollback procedures if needed

4. **Theme Customization** (Optional)
   - Upload logo and branding assets
   - Fine-tune CSS colors and fonts
   - Customize email templates with actual branding

---

## IMPLEMENTATION PHASES (5 Weeks)

### **PHASE 1: Configuration & Data** (Week 1, Days 1-2) ✅ 40% COMPLETE
**Duration:** 2 hours  
**Complexity:** Low  
**My Work:** Update 4 config files  
**Your Work:** MongoDB setup + sample data import

#### **1A. Configuration Files** ✅ (DONE)
- ✅ `config/settings.json` - Branding & core settings
- ✅ `config/menu.json` - Navigation menu
- ✅ `locales/en.json` - Language strings
- ✅ `config/settingsSchema.json` - Validation schema

#### **1B. Test Data Setup** (NEXT - YOUR RESPONSIBILITY)

**What I'll do:**
- 🤖 Update `lib/testdata.js` with educational products

**What you need to do manually:**
1. **Ensure MongoDB is running**
   ```bash
   # Start MongoDB (Windows)
   mongod --dbpath "C:\data\db"
   
   # OR if MongoDB is a service
   net start MongoDB
   
   # OR if using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Verify MongoDB connection** in `config/settings.json`
   ```json
   "databaseConnectionString": "mongodb://localhost:27017/heba-planet"
   ```

3. **Run the test data script** (after I complete the update)
   ```bash
   npm run testdata
   ```
   This will:
   - Drop existing collections (if any)
   - Create new collections with indexes
   - Insert sample products (20+ items across 6 categories)
   - Insert sample users (5 customers + 2 admin)
   - Insert sample orders (for testing history)

4. **Verify data in MongoDB**
   ```bash
   # Connect to MongoDB shell
   mongosh localhost:27017/heba-planet
   
   # Check collections exist
   show collections
   
   # Sample queries to verify
   db.products.countDocuments()  # Should show ~20+
   db.customers.countDocuments()  # Should show ~5+
   db.users.countDocuments()      # Should show ~2+ admins
   ```

5. **Take a backup** after successful import
   ```bash
   mongodump --db heba-planet --out ./db-backups/phase1
   ```

---

### **PHASE 2: Business Logic** (Week 1-2, Days 3-5) 
**Duration:** 4 hours  
**Complexity:** Medium  
**Files:** 6 library files  
**My Work:** Update core logic for educational features  
**Your Work:** Code review + testing

#### **Files I'll Modify:**
1. `lib/common.js` - Add educational helpers, email templates
2. `lib/cart.js` - Digital product handling, subscription logic
3. `lib/schema.js` - Extend product schema for educational fields
4. `lib/indexing.js` - Update Lunr search for new product types
5. `lib/payment-common.js` - Add subscription payment handling
6. `lib/db.js` - Add educational data queries

#### **What you'll do after Phase 2:**
1. **Code Review** - Check my changes for correctness
2. **Start the app**
   ```bash
   npm start
   ```
3. **Test in browser**
   - Navigate to http://localhost:1111
   - Verify products load correctly
   - Check that menu displays new categories
   - Verify search works with new products

---

### **PHASE 3: Routes & API** (Week 2, Days 6-8)
**Duration:** 3 hours  
**Complexity:** Medium  
**Files:** 6 route files  
**My Work:** Extend routes for educational features  
**Your Work:** API testing + integration verification

#### **Files I'll Modify:**
1. `routes/index.js` - Homepage with category filtering
2. `routes/product.js` - Product management with educational fields
3. `routes/order.js` - Order fulfillment for digital products
4. `routes/customer.js` - Customer profile for educational data
5. `routes/admin.js` - Admin dashboard for new features
6. `routes/user.js` - User management enhancements

#### **What you'll test:**
1. **Product Pages**
   - Add a new educational product via admin
   - Verify it appears on homepage
   - Check product detail page displays all fields

2. **Cart & Checkout**
   - Add physical books to cart
   - Add digital printables to cart
   - Add course to cart
   - Verify totals calculate correctly
   - Test checkout flow

3. **Admin Panel**
   - Access admin dashboard
   - Create new product
   - Create new category
   - Verify settings changes persist

---

### **PHASE 4: Templates & UI** (Week 2-3, Days 9-12)
**Duration:** 6 hours  
**Complexity:** High  
**Files:** 27 Handlebars template files  
**My Work:** Update all UI templates for Heba Planet  
**Your Work:** Visual testing + UX verification

#### **What I'll update:**
- Product templates (list, detail, edit, create)
- Customer templates (login, register, account)
- Order templates (list, detail, receipt, invoice)
- Admin templates (dashboard, products, orders, users, settings)
- Checkout & cart templates
- Static pages (about, contact, error pages)

#### **What you'll verify:**
1. **Visual Design** - Check colors, fonts, spacing
2. **Responsive Design** - Test on mobile/tablet/desktop
3. **Navigation** - Verify menu works
4. **Forms** - Test product/customer/order forms
5. **Educational Features** - Check course enrollment UI
6. **Printables** - Verify download buttons work

---

### **PHASE 5: Styling & Assets** (Week 3, Days 13-14)
**Duration:** 2 hours  
**Complexity:** Low  
**Files:** 14 CSS/JS/image files  
**My Work:** Update theme, CSS, client-side JavaScript  
**Your Work:** Visual polish + brand verification

#### **What I'll handle:**
- HebaTheme CSS customization
- Color scheme updates (branding)
- Component styling (buttons, cards, forms)
- Responsive breakpoints
- Client-side JavaScript (cart logic, form validation)
- Asset organization

#### **What you'll do:**
1. **Upload Branding Assets**
   ```bash
   # Place in public/images/
   - logo.png (Heba Planet logo)
   - hero-banner.jpg (homepage hero image)
   - favicon.ico
   - social-share-image.png
   ```

2. **Verify Branding**
   - Logo displays correctly
   - Colors match brand guidelines
   - Fonts are readable
   - Print styles work for invoices/receipts

3. **Test Interactive Features**
   - Cart add/remove items
   - Form validation messages
   - Admin bulk actions
   - Search functionality

---

### **PHASE 6: Payment Gateway Setup** (Week 3-4, Days 15-17)
**Duration:** 3 hours  
**Complexity:** High  
**My Work:** Minimal - gateways preserved  
**Your Work:** Credentials & testing

#### **All 9 gateways preserved, you need to:**

1. **Configure Credentials** in `config/settings.json`
   ```json
   {
     "stripe": { "publicKey": "pk_...", "secretKey": "sk_..." },
     "paypal": { "businessAccount": "..." },
     "authorize_net": { "loginId": "...", "transactionKey": "..." },
     "adyen": { "merchantAccount": "..." },
     "blockonomics": { "apiKey": "..." },
     "payway": { "merchantId": "..." },
     "zip": { "apiKey": "..." },
     "verifone": { "merchantId": "..." },
     "instore": { "enabled": true }
   }
   ```

2. **Test Each Gateway** (in sandbox/test mode)
   ```bash
   # Test payment flow for each gateway
   # Start app: npm start
   # Go to: http://localhost:1111/checkout
   # Select each payment method
   # Use test card numbers for each provider
   ```

3. **Verify Transactions**
   - Check MongoDB transactions collection
   - Verify order status updates after payment
   - Check admin can see payment details
   - Verify receipts email sent

4. **Set Up Webhooks** (for async payments like Stripe)
   - Update webhook URLs in payment provider dashboards
   - Point to your production domain
   - Test webhook delivery

---

### **PHASE 7: Testing & Deployment** (Week 4-5, Days 18-25)
**Duration:** 5+ hours  
**Complexity:** High  
**My Work:** None - you lead  
**Your Work:** Complete testing + deployment

#### **Testing Checklist**

**Functional Testing:**
- [ ] All 6 product categories load correctly
- [ ] Search finds all product types
- [ ] Cart operations work (add, remove, update qty)
- [ ] Digital products don't show stock warnings
- [ ] Courses show enrollment buttons instead of "Add to Cart"
- [ ] Coaching shows session duration selector
- [ ] Printables show immediate download option
- [ ] Checkout completes for all payment methods

**User Account Testing:**
- [ ] Customers can register
- [ ] Login/logout works
- [ ] Password reset works
- [ ] Customer can view order history
- [ ] Customer can download digital products
- [ ] Customer can view course enrollment status

**Admin Testing:**
- [ ] Admin can add/edit/delete products
- [ ] Admin can manage categories
- [ ] Admin can process orders
- [ ] Admin can refund transactions
- [ ] Admin can generate reports
- [ ] Admin can manage users
- [ ] Admin can modify settings

**Payment Testing:**
- [ ] Each gateway processes payments correctly
- [ ] Transaction records in MongoDB
- [ ] Order status updates to "Paid"
- [ ] Customer receives confirmation email
- [ ] Admin can see transaction details

**Security Testing:**
- [ ] XSS vulnerabilities checked
- [ ] SQL injection not possible (MongoDB)
- [ ] CSRF tokens present on all forms
- [ ] Admin routes require authentication
- [ ] Customer data not exposed in APIs

**Performance Testing:**
- [ ] Homepage loads < 2 seconds
- [ ] Product pages load < 1 second
- [ ] Search results appear < 500ms
- [ ] Checkout completes < 2 seconds
- [ ] No 404 errors in console

**Database Integrity:**
- [ ] All indexes created correctly
- [ ] No duplicate records
- [ ] References between collections valid
- [ ] Transactions recorded correctly

#### **Deployment Steps:**

1. **Production Database Setup**
   ```bash
   # Create production MongoDB instance
   # Option A: MongoDB Atlas (Cloud)
   # Option B: Self-hosted MongoDB server
   # Option C: Docker container in production environment
   
   # Create backup of test data
   mongodump --db heba-planet --out ./db-backups/pre-production
   
   # Create production database
   # Import minimal seed data (categories, admin user)
   ```

2. **Environment Configuration**
   ```bash
   # Update config/settings.json for production
   - baseUrl: "https://hebaplanet.com"
   - databaseConnectionString: "mongodb://prod-server:27017/heba-planet"
   - theme: "HebaTheme"
   - Enable HTTPS/SSL
   - Update email credentials for production account
   ```

3. **Application Deployment**
   ```bash
   # Option A: Direct Server Deployment
   git clone https://github.com/your-repo/heba-planet.git
   cd heba-planet
   npm install --production
   npm start
   
   # Option B: Docker Deployment
   docker build -t heba-planet:1.0 .
   docker run -d -p 3000:1111 \
     -e MONGO_URL="mongodb://mongodb:27017/heba-planet" \
     heba-planet:1.0
   
   # Option C: Cloud Deployment (Azure, AWS, Heroku)
   # Deploy using platform-specific CLI
   ```

4. **SSL/HTTPS Setup**
   ```bash
   # Install SSL certificate (Let's Encrypt or purchased)
   # Update config to serve HTTPS
   # Redirect HTTP to HTTPS
   ```

5. **Monitoring & Maintenance**
   ```bash
   # Set up error logging
   # Enable application monitoring (PM2, New Relic, DataDog)
   # Configure MongoDB backups (daily)
   # Set up health check endpoint
   # Configure alerts for downtime
   ```

---

## DETAILED MONGODB OPERATIONS

### **Initial Setup (Phase 1)**

```bash
# 1. Start MongoDB
mongod --dbpath "C:\data\db"  # Windows
# OR
mongod --dbpath /data/db      # macOS/Linux

# 2. Connect to MongoDB
mongosh localhost:27017

# 3. Create database and switch
use heba-planet

# 4. Create collections (optional - MongoDB auto-creates)
# This is done by the testdata.js script

# 5. Run seed data
npm run testdata
```

### **Collection Structure**

**Products Collection:**
```javascript
{
  _id: ObjectId,
  title: "Book Title",
  description: "...",
  category: "books",              // NEW: educational type
  productType: "book",            // NEW: physical/digital/course/coaching
  price: 12.99,
  stock: 50,
  ageRange: "3-5 years",         // NEW
  learningLevel: "Beginner",      // NEW
  images: ["url1", "url2"],
  variants: [],
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Courses Collection (NEW):**
```javascript
{
  _id: ObjectId,
  title: "Early Childhood Learning",
  description: "...",
  instructor: "Dr. Sarah",
  price: 49.99,
  duration: 6,                    // weeks
  enrollmentLimit: 30,
  sessionDurations: ["60min"],
  certificateEnabled: true,
  createdAt: ISODate
}
```

**Coaching Sessions Collection (NEW):**
```javascript
{
  _id: ObjectId,
  title: "Parenting Consultation",
  description: "1-on-1 coaching",
  coach: "Expert Coach",
  basePrice: 79.99,
  durations: ["30min", "60min", "90min"],
  pricePerMinute: 1.33,
  availability: {...},            // Calendar data
  createdAt: ISODate
}
```

### **Index Creation**

```javascript
// Create indexes for performance
db.products.createIndex({ title: 1 })
db.products.createIndex({ category: 1 })
db.products.createIndex({ productType: 1 })
db.customers.createIndex({ email: 1 }, { unique: true })
db.orders.createIndex({ customerId: 1 })
db.orders.createIndex({ createdAt: -1 })
db.transactions.createIndex({ orderId: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
```

### **Data Migration (if migrating from existing data)**

```bash
# Backup old data
mongodump --db expressCart --out ./db-backups/expressCart-original

# Export collections to JSON
mongoexport --db expressCart --collection products --out products.json

# Transform data if needed (update categories, add new fields)
# Then import to new database
mongoimport --db heba-planet --collection products --file products.json
```

### **Ongoing MongoDB Tasks**

**Weekly:**
- Verify database size
- Check for orphaned documents
- Review error logs

**Monthly:**
- Full database backup
- Analyze slow queries
- Optimize indexes if needed

**Per Release:**
- Test data migrations on staging first
- Backup before running migrations
- Verify data integrity after migration

---

## TESTING PROCEDURES

### **Pre-Launch Checklist (Before Phase 1)**

- [ ] Node.js v10.16.0+ installed
- [ ] MongoDB installed and running
- [ ] Git repository set up
- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database connection tested

### **Phase 1 Testing**

- [ ] Config files valid JSON
- [ ] Settings schema validates
- [ ] Test data imports successfully
- [ ] Homepage loads with new products
- [ ] Menu displays correctly
- [ ] Search indexes build without errors

### **Phase 2 Testing**

- [ ] Add products to cart
- [ ] Remove products from cart
- [ ] Update quantities
- [ ] Cart totals calculate correctly
- [ ] Digital products show no stock warnings
- [ ] Courses show enrollment button

### **Phase 3 Testing**

- [ ] Create product via admin form
- [ ] Edit product details
- [ ] Delete product
- [ ] Create order via admin
- [ ] View customer account page
- [ ] Search products by category

### **Phase 4 Testing**

- [ ] All pages render without errors
- [ ] Forms submit successfully
- [ ] Images display correctly
- [ ] Email templates render properly
- [ ] Print stylesheets work

### **Phase 5 Testing**

- [ ] CSS loads correctly
- [ ] JavaScript executes without console errors
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Branding colors consistent throughout
- [ ] Animations/transitions smooth

### **Phase 6 Testing**

- [ ] Each payment gateway processes test transactions
- [ ] Transactions recorded in MongoDB
- [ ] Order status updates correctly
- [ ] Confirmation emails sent
- [ ] Admin receives payment notifications

### **Pre-Deployment Testing**

```bash
# Performance test
npm run test

# Lint check
npm run lint

# Security audit
npm audit

# Database integrity check
# Run custom script to verify all collections/indexes
```

---

## TROUBLESHOOTING GUIDE

### **MongoDB Connection Issues**

**Problem:** `MongooseError: Cannot connect to MongoDB`
```bash
# Solution 1: Verify MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Solution 2: Check connection string in config/settings.json
# Should be: mongodb://localhost:27017/heba-planet

# Solution 3: Check MongoDB logs
# Windows: Event Viewer → Windows Logs → Application
# Linux: /var/log/mongodb/mongod.log
```

### **Payment Gateway Errors**

**Problem:** `Stripe error: Invalid API key`
```bash
# Solution:
# 1. Verify API keys in config/settings.json
# 2. Use TEST keys during development
# 3. Check keys match the correct Stripe account
# 4. Ensure no extra spaces in keys
```

### **Template Rendering Errors**

**Problem:** `handlebars not defined` or template syntax error
```bash
# Solution:
# 1. Check Handlebars syntax: {{variable}} not {variable}
# 2. Verify partials exist in views/partials/
# 3. Check layout inheritance in views/layouts/layout.hbs
# 4. Review console.log output for specific line number
```

### **Performance Issues**

**Problem:** Website loads slowly
```bash
# Solution 1: Check database performance
db.products.find().explain("executionStats")

# Solution 2: Verify indexes created
db.products.getIndexes()

# Solution 3: Check Node.js memory usage
# Increase if needed: node --max-old-space-size=4096 app.js

# Solution 4: Enable caching
# Update config for cache headers
```

---

## SCHEDULE & TIMELINE

| Phase | Duration | Dates | Status | Owner |
|-------|----------|-------|--------|-------|
| 1A: Config Files | 1 hour | Day 1 | ✅ DONE | 🤖 Copilot |
| 1B: Test Data | 1 hour | Day 2 | 🔄 NEXT | 🤖 Copilot + 👤 You |
| 2: Business Logic | 4 hours | Days 3-5 | ⏳ Waiting | 🤖 Copilot + 👤 You |
| 3: Routes & API | 3 hours | Days 6-8 | ⏳ Waiting | 🤖 Copilot + 👤 You |
| 4: Templates | 6 hours | Days 9-12 | ⏳ Waiting | 🤖 Copilot + 👤 You |
| 5: Styling & Assets | 2 hours | Days 13-14 | ⏳ Waiting | 🤖 Copilot + 👤 You |
| 6: Payment Setup | 3 hours | Days 15-17 | ⏳ Waiting | 👤 You Only |
| 7: Testing & Deploy | 5+ hours | Days 18-25 | ⏳ Waiting | 👤 You Only |

**Total Development Time:** ~27 hours  
**Total Manual Testing/Setup:** ~10 hours  
**Total Project Duration:** 5 weeks (part-time)

---

## WHAT HAPPENS NEXT

### **Immediately (Right Now):**
```
You: Decide if ready for Phase 1B (Test Data)
Me: Update lib/testdata.js with educational products
You: Set up MongoDB, run npm run testdata, verify imports
```

### **After Phase 1 Complete:**
```
You: Confirm ready for Phase 2
Me: Start updating business logic (lib/ files)
You: Review code, start app, test features
```

### **Key Dependency:**
- ✋ Do NOT skip Phase 1 - Configuration must be in place
- ✋ Do NOT modify code files during my updates - I'll handle all changes
- ✋ Do NOT deploy to production without completing Phase 7 testing
- ✋ Do NOT lose database - always backup before major changes

---

## QUICK START COMMANDS

```bash
# Install dependencies (one time)
npm install

# Start MongoDB (first terminal)
mongod --dbpath "C:\data\db"

# Run test data (creates sample data)
npm run testdata

# Start application (second terminal)
npm start

# Access application
# http://localhost:1111 (customer)
# http://localhost:1111/admin (admin - login: admin / password: password)

# Stop application
# Ctrl+C

# View MongoDB data
mongosh localhost:27017/heba-planet
show collections
db.products.find().pretty()
```

---

## SUCCESS CRITERIA

✅ **Phase 1 Complete When:**
- Config files updated with Heba Planet branding
- 20+ sample educational products in database
- Navigation menu displays 9 educational categories
- Homepage shows products correctly

✅ **Phase 2 Complete When:**
- Cart operations work for all product types
- Admin can create/edit educational products
- Orders process correctly

✅ **Phase 3 Complete When:**
- All routes return correct data
- API responses match expectations
- No 404 or 500 errors in normal operation

✅ **Phase 4 Complete When:**
- All pages render without layout breaks
- Forms display and validate correctly
- No console errors in browser

✅ **Phase 5 Complete When:**
- Branding colors applied consistently
- Responsive design verified on all devices
- All interactive features work

✅ **Phase 6 Complete When:**
- Test transactions process on all 9 gateways
- Admin receives payment confirmations
- Customers receive receipts

✅ **Phase 7 Complete When:**
- All tests pass
- No critical bugs found
- Ready for production deployment
- Site live on hebaplanet.com

---

## CONTACT & SUPPORT

During implementation:
- Ask questions about any step
- Flag blockers immediately
- Share test results and screenshots
- Confirm before moving to next phase

**Key Questions to Ask Me:**
- "Should I test X now?"
- "What are the expected MongoDB documents?"
- "How do I know if Phase X is complete?"
- "What do I do if I see error Y?"

---

## APPENDIX: MongoDB Quick Reference

```bash
# Connect
mongosh localhost:27017/heba-planet

# Collections
show collections
db.products.count()
db.orders.count()
db.customers.count()

# Find products by category
db.products.find({ category: "books" })

# Find orders for customer
db.orders.find({ customerId: ObjectId("...") })

# Update product stock
db.products.updateOne(
  { _id: ObjectId("...") },
  { $set: { stock: 45 } }
)

# Delete test data
db.products.deleteMany({})

# Backup database
mongodump --db heba-planet --out ./backups/$(date +%Y%m%d)

# Restore database
mongorestore --db heba-planet ./backups/20260530
```

---

**Last Updated:** May 30, 2026  
**Next Action:** Proceed with Phase 1B (lib/testdata.js) ❓
