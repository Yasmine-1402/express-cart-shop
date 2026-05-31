# ExpressCart to Heba Planet: Complete Migration Analysis & Plan

**Project:** Transform ExpressCart into "Heba Planet" - An Educational Marketplace
**Status:** Analysis & Planning Phase
**Analysis Date:** May 30, 2026

---

## EXECUTIVE SUMMARY

This document provides a comprehensive analysis of the ExpressCart e-commerce platform and details a complete migration plan to transform it into "Heba Planet," an educational marketplace specializing in:
- Kindergarten books
- Educational workbooks
- Parenting coaching sessions
- Printable resources
- Educational games
- Online courses

**Key Principle:** All existing payment gateways, checkout flows, cart functionality, admin features, and customer accounts will be preserved to minimize risk and development time.

---

## 1. COMPLETE ARCHITECTURE OVERVIEW

### 1.1 Technology Stack

**Backend:**
- **Runtime:** Node.js (v10.16.0+)
- **Framework:** Express.js (v4.17.1)
- **Database:** MongoDB
- **Session Store:** MongoDB (connect-mongodb-session)
- **Authentication:** bcryptjs (v2.4.3)
- **Template Engine:** Express Handlebars (v3.1.0)

**Frontend:**
- **Templating:** Handlebars (.hbs files)
- **Styling:** CSS with Less support (gulp-less v4.0.1)
- **Client-side Libraries:**
  - jQuery (implicit from bootstrap)
  - Bootstrap components
  - Feather Icons (v4.25.0)
  - Date formatting: Moment.js

**Payment Processing:**
- Stripe
- PayPal
- Authorize.net
- Adyen
- Blockonomics (Crypto)
- Payway
- Zip
- Verifone
- In-store payments

**Search & Indexing:**
- Lunr.js (Full-text search in-memory index)

**Security:**
- Helmet.js (HTTP headers security)
- CSRF protection
- Bcrypt password hashing
- Rate limiting (express-rate-limit)

**Utilities:**
- i18n (Multi-language support)
- Nodemailer (Email delivery)
- Sanitize-html (XSS protection)
- AJV (JSON schema validation)

### 1.2 Application Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│              Express Application                 │
└─────────────────────────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │   Express Router Setup       │
    │ ├─ routes/admin.js          │
    │ ├─ routes/product.js        │
    │ ├─ routes/customer.js       │
    │ ├─ routes/order.js          │
    │ ├─ routes/user.js           │
    │ ├─ routes/index.js          │
    │ ├─ routes/reviews.js        │
    │ ├─ routes/transactions.js   │
    │ └─ routes/[payments].js     │
    └──────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │    Business Logic Layer      │
    │ ├─ lib/auth.js              │
    │ ├─ lib/cart.js              │
    │ ├─ lib/common.js            │
    │ ├─ lib/config.js            │
    │ ├─ lib/db.js                │
    │ ├─ lib/schema.js            │
    │ ├─ lib/indexing.js          │
    │ ├─ lib/menu.js              │
    │ └─ lib/modules/             │
    └──────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │   MongoDB Database           │
    │ ├─ users collection         │
    │ ├─ products collection      │
    │ ├─ variants collection      │
    │ ├─ customers collection     │
    │ ├─ orders collection        │
    │ ├─ transactions collection  │
    │ ├─ cart collection          │
    │ ├─ reviews collection       │
    │ ├─ discounts collection     │
    │ ├─ pages collection         │
    │ ├─ menu collection          │
    │ └─ sessions collection      │
    └──────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │   View/Presentation Layer    │
    │ ├─ Handlebars templates     │
    │ ├─ Public assets            │
    │ ├─ Theme system             │
    └──────────────────────────────┘
```

### 1.3 Request Flow

1. **Incoming Request** → Express middleware chain
2. **Session Management** → MongoDB session store
3. **Route Matching** → Router determines endpoint
4. **Authentication** → `lib/auth.js` (if admin route)
5. **Business Logic** → Appropriate lib module
6. **Database Operations** → MongoDB queries
7. **Response Generation** → Handlebars template rendering
8. **Response Sent** → Browser/Client

### 1.4 Core Components

**Middleware Stack:**
- Morgan (Logging)
- Body Parser
- Cookie Parser
- CSRF Protection
- Session Middleware
- Helmet (Security Headers)
- Rate Limiting
- i18n (Localization)

**Route Groups:**
- **Public Routes:** `/` (home), `/product/:id`, `/payment/:orderId`, `/customer/*`
- **Admin Routes:** `/admin/*` (restricted)
- **API Routes:** All routes can return JSON

**Database Connection:**
- Single MongoDB connection
- Database selection based on NODE_ENV (test vs production)
- Collections initialized on connection

---

## 2. DATABASE SCHEMA DOCUMENTATION

### 2.1 Collections Overview

#### **users** Collection
Stores administrative users for the platform.

```javascript
{
  _id: ObjectId,
  userEmail: String (unique),
  userPassword: String (bcrypted),
  isAdmin: Boolean,
  apiKey: ObjectId (optional),
  created: Date
}
```

**Indexes:** userEmail (unique)
**Purpose:** Admin authentication and authorization
**Relationships:** None direct; referenced implicitly in audit trails

---

#### **products** Collection
Core product catalog for the marketplace.

```javascript
{
  _id: ObjectId,
  productPermalink: String (unique),
  productTitle: String,
  productPrice: String (decimal format: "10.99"),
  productDescription: String (HTML),
  productGtin: String (optional, max 16 chars),
  productBrand: String (optional),
  productPublished: Boolean,
  productTags: String (comma-separated),
  productComment: Boolean (enable comments?),
  productStock: Number | null,
  productStockDisable: Boolean,
  productSubscription: String (optional),
  productAddedDate: Date,
  productImage: String (filename, stored in public/uploads/),
  images: [String] (array of filenames for gallery)
}
```

**Indexes:** 
- productPermalink (unique)
- productPublished
- productAddedDate

**Relationships:** 
- 1-to-Many with `variants`
- 1-to-Many with `reviews`

**Full-Text Search:** Indexed via Lunr.js on productTitle, productTags, productDescription

---

#### **variants** Collection
Product variants/options (size, color, edition, etc.).

```javascript
{
  _id: ObjectId,
  product: ObjectId (references products._id),
  title: String,
  price: String (decimal format),
  stock: Number | null,
  added: Date
}
```

**Indexes:**
- product (foreign key)

**Relationships:** Many-to-One with `products`

---

#### **customers** Collection
Customer accounts for the storefront (non-admin).

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (bcrypted),
  company: String,
  firstName: String,
  lastName: String,
  address1: String,
  address2: String (optional),
  country: String,
  state: String,
  postcode: String,
  phone: String,
  created: Date
}
```

**Indexes:**
- email (unique)

**Relationships:**
- 1-to-Many with `orders`

**Full-Text Search:** Indexed via Lunr.js on email, firstName + lastName, phone

---

#### **orders** Collection
Customer orders with complete purchase history.

```javascript
{
  _id: ObjectId,
  orderPaymentId: ObjectId,
  orderPaymentGateway: String (e.g., "Stripe", "PayPal", "Instore"),
  orderPaymentMessage: String,
  orderTotal: Number,
  orderShipping: Number,
  orderItemCount: Number,
  orderProductCount: Number,
  orderCustomer: ObjectId (references customers._id),
  orderEmail: String,
  orderCompany: String,
  orderFirstname: String,
  orderLastname: String,
  orderAddr1: String,
  orderAddr2: String,
  orderCountry: String,
  orderState: String,
  orderPostcode: String,
  orderPhoneNumber: String,
  orderComment: String,
  orderStatus: String (e.g., "Pending", "Shipped", "Delivered"),
  orderDate: Date,
  orderProducts: {
    [cartKey]: {
      productId: ObjectId,
      variantId: ObjectId | null,
      quantity: Number,
      title: String,
      price: String,
      totalItemPrice: Number,
      productSubscription: String | null
    }
  },
  orderType: String (e.g., "Single", "Subscription"),
  transaction: ObjectId (references transactions._id),
  trackingNumber: String (optional),
  productStockUpdated: Boolean,
  updatedDate: Date (optional)
}
```

**Indexes:**
- orderCustomer (foreign key)
- orderStatus
- orderDate
- orderEmail

**Relationships:**
- Many-to-One with `customers`
- 1-to-One with `transactions`

**Full-Text Search:** Indexed via Lunr.js on orderEmail, orderLastname, orderPostcode

---

#### **transactions** Collection
Payment transaction records for audit and reconciliation.

```javascript
{
  _id: ObjectId,
  gatewayReference: String (unique per gateway),
  transactionEmail: String,
  transactionAmount: Number,
  transactionStatus: String (e.g., "Approved", "Declined", "Pending"),
  transactionCurrency: String,
  transactionType: String (e.g., "charge", "refund"),
  transactionId: String,
  invoiceId: String (optional),
  transactionDate: Date
}
```

**Indexes:**
- gatewayReference (unique)
- transactionDate

**Relationships:**
- 1-to-Many with `orders`

**Full-Text Search:** Indexed via Lunr.js on gatewayReference, amount

---

#### **cart** Collection
Persistent cart storage across sessions.

```javascript
{
  _id: ObjectId,
  sessionId: String (unique, links to session),
  items: {
    [cartKey]: {
      productId: ObjectId,
      variantId: ObjectId | null,
      quantity: Number,
      price: String,
      title: String,
      totalItemPrice: Number
    }
  },
  lastUpdated: Date
}
```

**Indexes:**
- sessionId (unique)

**Note:** Cart is also stored in `req.session.cart` (session memory)

---

#### **discounts** Collection
Discount codes and promotional vouchers.

```javascript
{
  _id: ObjectId,
  code: String (unique),
  type: String (enum: "amount", "percent"),
  value: Number,
  usageLimit: Number | null,
  usageCount: Number,
  expiryDate: Date | null,
  created: Date,
  createdBy: ObjectId (references users._id)
}
```

**Indexes:**
- code (unique)
- expiryDate

**Relationships:**
- Many-to-One with `users`

---

#### **reviews** Collection
Product reviews and ratings.

```javascript
{
  _id: ObjectId,
  product: ObjectId (references products._id),
  customer: ObjectId (references customers._id),
  rating: Number (1-5),
  title: String,
  comment: String (HTML),
  verified: Boolean (purchased customer?),
  created: Date,
  updatedDate: Date
}
```

**Indexes:**
- product (foreign key)
- customer (foreign key)
- created

**Relationships:**
- Many-to-One with `products`
- Many-to-One with `customers`

---

#### **pages** Collection
Static CMS pages (About, Terms, Privacy, etc.).

```javascript
{
  _id: ObjectId,
  pageSlug: String (unique),
  pageTitle: String,
  pageContent: String (HTML),
  published: Boolean,
  created: Date,
  updatedDate: Date
}
```

**Indexes:**
- pageSlug (unique)
- published

---

#### **menu** Collection
Navigation menu configuration.

```javascript
{
  _id: ObjectId,
  items: [
    {
      title: String,
      link: String,
      order: Number
    }
  ]
}
```

**Note:** Single document, upserted

---

#### **sessions** Collection
Express session storage (managed by connect-mongodb-session).

```javascript
{
  _id: String (sessionId),
  expires: Date (TTL index),
  session: String (serialized session JSON),
  createdAt: Date
}
```

**Indexes:**
- expires (TTL: auto-delete after expiration)

---

### 2.2 Database Relationships Diagram

```
┌─────────────┐
│   users     │
└──────┬──────┘
       │ (creates)
       ↓
┌─────────────┐
│  discounts  │
└─────────────┘

┌─────────────┐        ┌──────────────┐
│  products   │◄──────►│  variants    │
└──────┬──────┘        └──────────────┘
       │ (referenced)
       ↓
┌─────────────────────────────────┐
│      orders.orderProducts       │
│  (embedded cart items)          │
└─────────────────────────────────┘
       ↑
       │
┌──────┴──────┐
│  customers  │
└──────┬──────┘
       │ (places)
       ↓
┌─────────────┐        ┌──────────────┐
│   orders    │◄──────►│ transactions │
└─────────────┘        └──────────────┘

┌─────────────┐
│  products   │
└──────┬──────┘
       │ (has)
       ↓
┌──────────────┐        ┌──────────────┐
│   reviews    │◄──────►│  customers   │
└──────────────┘        └──────────────┘

┌─────────────┐
│   pages     │
└─────────────┘

┌────────────┐
│   menu     │
└────────────┘
```

---

## 3. PRODUCT MODEL DOCUMENTATION

### 3.1 Product Structure

**Purpose:** Central catalog entity representing individual items for sale

**Key Features:**
- Title, description, pricing
- Stock management (optional)
- Product variants (sizes, editions, formats)
- Published/draft status
- Tags and metadata
- Image gallery support
- Subscription products support
- Comments/reviews enablement
- GTIN/EAN support for inventory sync

### 3.2 Product Validation Schema

File: `lib/schemas/newProduct.json`

```json
{
  "productPermalink": {
    "required": true,
    "type": "string",
    "minLength": 2,
    "constraints": "isNotEmpty"
  },
  "productTitle": {
    "required": true,
    "type": "string",
    "minLength": 5,
    "constraints": "isNotEmpty"
  },
  "productPrice": {
    "required": true,
    "type": "string",
    "format": "amount (XX.XX)",
    "constraints": "Must be decimal format"
  },
  "productDescription": {
    "required": true,
    "type": "string",
    "minLength": 25,
    "constraints": "isNotEmpty, supports HTML"
  },
  "productGtin": {
    "type": "string | null",
    "maxLength": 16,
    "format": "alphanumeric"
  },
  "productBrand": {
    "type": "string",
    "maxLength": 50
  },
  "productPublished": {
    "required": true,
    "type": "boolean"
  },
  "productTags": {
    "type": "string",
    "format": "comma-separated"
  },
  "productComment": {
    "type": "boolean",
    "default": false
  },
  "productStock": {
    "type": "number | null",
    "notes": "Only tracked if config.trackStock = true"
  },
  "productStockDisable": {
    "type": "boolean",
    "notes": "If true, stock warnings disabled"
  },
  "productSubscription": {
    "type": "string",
    "notes": "Recurring/subscription product identifier"
  }
}
```

### 3.3 Product Lifecycle

```
1. CREATE (Admin)
   └─ POST /admin/product/insert
      └─ Validation → DB Insert → Lunr Index Update

2. DISPLAY (Customer)
   └─ GET /product/:permalink
      └─ Fetch from DB → Check variants → Load reviews → Render

3. UPDATE (Admin)
   └─ POST /admin/product/update
      └─ Validation → DB Update → Lunr Index Update

4. DELETE (Admin)
   └─ GET /admin/product/delete/:id
      └─ Remove from DB → Lunr Index Update → Image cleanup

5. IMAGE MANAGEMENT
   └─ POST /admin/product/setasmainimage
   └─ POST /admin/product/deleteimage
      └─ File system + DB update

6. VARIANT MANAGEMENT
   └─ POST /admin/product/addvariant
   └─ POST /admin/product/editvariant
   └─ POST /admin/product/removevariant
      └─ Variant collection CRUD
```

### 3.4 Product Pricing

- Base product price stored as string in "XX.XX" format
- Variants can have different prices
- Final cart price = (Product price OR Variant price) + Shipping - Discounts
- No taxes calculated (external responsibility)

### 3.5 Product Search & Discovery

**Search Implementation:** Lunr.js (client-side full-text search)

```javascript
// Indexed Fields (with boost weights)
- productTitle (boost: 10)
- productTags (boost: 5)
- productDescription (boost: 1)
```

**Search Trigger:** `/admin/products/filter/:search`

---

## 4. PAYMENT INTEGRATION REPORT

### 4.1 Payment Gateway Architecture

**Integration Pattern:**
- Modular: Each gateway in `lib/payments/[gateway].js`
- Configuration-driven: Gateway config in `config/payment/config/[gateway].json`
- Schema validation: Gateway schemas in `config/payment/schema/[gateway].json`
- Transaction recording: All payments logged to `transactions` collection

### 4.2 Supported Payment Gateways

#### 1. **Stripe**
- **File:** `lib/payments/stripe.js`
- **Integration Type:** API-based
- **Features:** Cards, recurring billing
- **Config:** Public/Secret keys
- **Webhook:** Order confirmation via webhook
- **Status:** Fully integrated

#### 2. **PayPal**
- **File:** `lib/payments/paypal.js`
- **Integration Type:** Redirect-based
- **Features:** Cards, PayPal accounts
- **Config:** Client ID, Secret
- **Webhook:** Return URL confirmation
- **Status:** Fully integrated

#### 3. **Authorize.net**
- **File:** `lib/payments/authorizenet.js`
- **Integration Type:** Form-based (Accept.js)
- **Features:** Card payments
- **Config:** Login ID, Transaction Key
- **Status:** Fully integrated

#### 4. **Adyen**
- **File:** `lib/payments/adyen.js`
- **Integration Type:** API-based
- **Features:** Multiple payment methods
- **Config:** API credentials
- **Status:** Fully integrated

#### 5. **Blockonomics**
- **File:** `lib/payments/blockonomics.js`
- **Integration Type:** Cryptocurrency (Bitcoin)
- **Features:** Bitcoin payments
- **Config:** API key
- **Status:** Fully integrated

#### 6. **Payway**
- **File:** `lib/payments/payway.js`
- **Integration Type:** API-based
- **Features:** Card payments
- **Config:** API credentials
- **Status:** Fully integrated

#### 7. **Zip**
- **File:** `lib/payments/zip.js`
- **Integration Type:** Redirect-based (BNPL)
- **Features:** Buy now, pay later
- **Config:** API credentials
- **Status:** Fully integrated

#### 8. **Verifone**
- **File:** `lib/payments/verifone.js`
- **Integration Type:** Hosted checkout (iframe)
- **Features:** Card payments
- **Config:** User ID, API Key, Entity ID, Payment Contract ID
- **Implementation:** setupVerifone() creates checkout session
- **Status:** Fully integrated

#### 9. **In-Store**
- **File:** `routes/order.js` (manual entry)
- **Integration Type:** Manual order creation
- **Features:** Staff-entered orders
- **Status:** Fully integrated

### 4.3 Payment Flow Diagram

```
Customer → Product Selection → Cart → Checkout
              ↓
         Customer Info Entry
              ↓
         Select Payment Method
              ↓
    ┌─────────────────────────────────┐
    │   PAYMENT GATEWAY PROCESSING     │
    │                                 │
    │  → Gateway-specific flow        │
    │  → Customer auth/confirmation   │
    │  → Transaction processing       │
    │  → Return to application        │
    └─────────────────────────────────┘
              ↓
         Order Creation (routes/order.js)
              ↓
    ┌─────────────────────────────────┐
    │   TRANSACTION RECORDING          │
    │                                 │
    │  → Insert to transactions coll  │
    │  → Update order with trans ref  │
    │  → Update stock if enabled      │
    └─────────────────────────────────┘
              ↓
         Email Confirmation
              ↓
         Clear Cart
              ↓
    Redirect to Payment Result Page
```

### 4.4 Transaction Recording

**Table:** `transactions` collection

**Fields Recorded:**
- Transaction ID (from gateway)
- Gateway reference
- Amount (normalized currency)
- Currency ISO code
- Transaction status (Approved/Declined/Pending)
- Customer email
- Timestamp
- Transaction type (charge/refund)

**Webhook/Notification Handling:**
- Gateway notifies payment success/failure
- Application creates/updates order based on transaction
- Customer notified via email
- Admin notified in dashboard

### 4.5 Payment Security Measures

✓ **HTTPS/TLS:** Required for all payment operations
✓ **PCI DSS:** Card data never stored on server (gateway handles)
✓ **CSRF Protection:** All forms protected with CSRF tokens
✓ **Rate Limiting:** Applied to payment endpoints
✓ **API Key Protection:** Keys stored in environment variables
✓ **Helmet Security Headers:** Protects against common attacks

### 4.6 Payment Configuration Files

**Location:** `config/payment/`

**Structure:**
```
config/payment/
├─ config/
│  ├─ stripe.json (public key, secret key)
│  ├─ paypal.json (client ID, secret)
│  ├─ authorizenet.json
│  ├─ adyen.json
│  ├─ blockonomics.json
│  ├─ payway.json
│  ├─ zip.json
│  └─ verifone.json
└─ schema/
   ├─ stripe.json (validation schema)
   ├─ paypal.json
   ├─ ... (mirror of config)
   └─ verifone.json
```

---

## 5. THEME AND FRONTEND STRUCTURE REPORT

### 5.1 Theme System Architecture

**Locations:**
- Themes stored in: `views/themes/`
- Current active theme: Configured in `config/settings.json` → `theme` property
- Default templates: `views/` (non-theme files)
- Public assets: `public/`

**Theme Discovery:**
- Automatic scanning in `lib/common.js` → `getThemes()`
- Returns list of directories in `views/themes/`

### 5.2 Theme Structure

```
views/
├─ themes/
│  ├─ [ThemeName]/
│  │  ├─ index.hbs (homepage)
│  │  ├─ product.hbs (product detail)
│  │  ├─ products.hbs (product listing)
│  │  ├─ cart.hbs (shopping cart)
│  │  ├─ checkout.hbs
│  │  ├─ [other theme templates]
│  │  └─ [theme-specific styles/scripts]
│  │
│  └─ Cloth/
│     └─ [current theme files]
│
├─ layouts/
│  └─ layout.hbs (master layout)
│
├─ partials/
│  ├─ confirmModal.hbs
│  ├─ globalSearchModal.hbs
│  ├─ productCard.hbs
│  ├─ cartItem.hbs
│  └─ [other shared components]
│
├─ [default templates - used if not in theme]
├─ customer.hbs
├─ customers.hbs
├─ dashboard.hbs
├─ product.hbs
├─ products.hbs
└─ ... [admin templates]
```

### 5.3 Template Hierarchy

**Resolution Order:**
1. Check active theme directory (`views/themes/[themeName]/`)
2. Fall back to default template in `views/`

**Example:** For home page
- If theme exists: `views/themes/Cloth/index.hbs`
- Else: `views/index.hbs`

### 5.4 Frontend Technology Stack

**Templating:**
- Express Handlebars
- Helper functions in `app.js`
- Custom helpers:
  - `__()` - i18n translation
  - `__n()` - i18n pluralization
  - `availableLanguages` - language selector
  - `partial()` - theme provider

**CSS Framework:**
- Bootstrap (implicit from structure)
- LESS preprocessor support
- Custom CSS via `config.settings.json` → `customCss`

**JavaScript:**
- jQuery (implicit from admin UI)
- Feather Icons (SVG icons)
- Client validation
- AJAX cart operations

**Icons:**
- Feather Icons (v4.25.0)

### 5.5 Static Assets

**Location:** `public/`

```
public/
├─ images/
│  ├─ logo.png
│  └─ [theme images]
├─ javascripts/
│  ├─ admin.js / admin.min.js
│  ├─ expressCart.js / expressCart.min.js
│  ├─ common.js / common.min.js
│  ├─ jquery.bootpag.min.js (pagination)
│  ├─ jquery.dotdotdot.min.js (text truncation)
│  └─ pushy.min.js (mobile menu)
├─ stylesheets/
│  ├─ admin.css / admin.min.css
│  ├─ style.css / style.min.css
│  ├─ pushy.css / pushy.min.css
│  ├─ codemirror-style.min.css (editor)
│  ├─ font/ (web fonts)
│  ├─ less/ (source LESS files)
│  └─ [minified versions]
├─ uploads/ (product images)
├─ robots.txt
└─ email_template.html (transactional email)

```

### 5.6 Handlebars Helpers

**Global Helpers Available to All Templates:**

| Helper | Purpose |
|--------|---------|
| `__()` | i18n translation (replace {{__('key')}} with translated text) |
| `__n()` | i18n pluralization (singular/plural forms) |
| `availableLanguages` | Loop through configured languages |
| `partial()` | Load theme-specific partial |
| Custom CSS | Inject via `config.customCss` |
| Custom JS | Inject via `config.injectJs` |

### 5.7 Frontend Page Structure

**Admin Pages:**
- `/admin` - Dashboard
- `/admin/products` - Product list
- `/admin/product/new` - Create product
- `/admin/product/edit/:id` - Edit product
- `/admin/orders` - Order list
- `/admin/order/:id` - Order detail
- `/admin/customers` - Customer list
- `/admin/users` - Admin user management
- `/admin/settings` - Configuration
- `/admin/settings/pages` - CMS page management
- `/admin/settings/menu` - Navigation menu

**Customer-Facing Pages:**
- `/` - Homepage
- `/product/:permalink` - Product detail
- `/products` - Product listing
- `/cart` - Shopping cart
- `/checkout` - Checkout (multi-step)
- `/customer/login` - Login/register
- `/customer/account` - Customer account
- `/pages/:slug` - CMS pages

### 5.8 Mobile Responsiveness

- Pushy library for mobile navigation
- Bootstrap breakpoints (responsive grid)
- Mobile-first CSS approach

---

## 6. SHOPPING CART WORKFLOW

### 6.1 Cart Architecture

**Storage:** Dual-storage model
- **Session Memory:** `req.session.cart` (fast, current session)
- **Database:** `cart` collection (persistence, recovery)

**Cart Structure:**

```javascript
req.session.cart = {
  "[uniqueCartKey]": {
    productId: ObjectId,
    variantId: ObjectId | null,
    quantity: Number,
    title: String,
    price: String,
    productImage: String,
    totalItemPrice: Number (quantity * price),
    productSubscription: String | null
  },
  // ... more items
}
```

**Cart Summary Tracking:**
- `req.session.totalCartAmount` - Final amount (after shipping/discounts)
- `req.session.totalCartNetAmount` - Subtotal (before shipping/discounts)
- `req.session.totalCartItems` - Number of unique products in cart
- `req.session.totalCartProducts` - Total quantity of items
- `req.session.totalCartShipping` - Shipping cost
- `req.session.totalCartDiscount` - Discount applied

### 6.2 Cart Operations

**File:** `lib/cart.js`

#### **Add Item to Cart**
```
POST /cart/add
├─ Product lookup (products collection)
├─ Variant lookup (if selected)
├─ Check stock availability
├─ Create cart key (hash of product + variant)
├─ Add/update to req.session.cart
├─ Save to cart collection (optional)
└─ updateTotalCart()
```

#### **Remove Item from Cart**
```
POST /cart/delete/:cartKey
├─ Remove from req.session.cart
├─ updateTotalCart()
└─ Delete from cart collection
```

#### **Update Quantity**
```
POST /cart/update/:cartKey
├─ Update quantity in session
├─ Recalculate price
├─ updateTotalCart()
└─ Sync to DB
```

#### **Empty Cart**
```
POST /cart/empty (or emptyCart())
├─ Delete req.session.cart
├─ Delete req.session.shippingAmount
├─ Delete req.session.orderId
├─ Delete req.session.discountCode
├─ Delete from cart collection
├─ updateTotalCart()
└─ Clear subscription flag
```

### 6.3 Cart Calculations

**updateTotalCart() Flow:**

```
1. Reset totals
   ├─ totalCartAmount = 0
   ├─ totalCartItems = 0
   └─ totalCartProducts = 0

2. Calculate product totals
   └─ Loop through req.session.cart
      ├─ Sum totalItemPrice → totalCartAmount
      ├─ Count unique items → totalCartItems
      └─ Sum quantities → totalCartProducts

3. Set net amount (before shipping/discounts)
   └─ totalCartNetAmount = totalCartAmount

4. Check for subscription products
   └─ updateSubscriptionCheck()

5. Calculate shipping
   └─ config.modules.loaded.shipping.calculateShipping()
      └─ (Normally $0 for subscription, varies by country/amount)

6. Apply discount (if code entered)
   └─ Look up discount code in DB
   └─ Calculate discount amount (fixed or percentage)
   └─ Set totalCartDiscount

7. Calculate final total
   └─ totalCartAmount = (totalCartNetAmount - totalCartDiscount) + totalCartShipping
```

### 6.4 Shipping Calculation

**Module:** `lib/modules/shipping-basic.js`

**Rules:**
- Free shipping if cart subtotal ≥ $100
- Domestic (Australia): $10
- International: $25
- Subscription products: FREE shipping
- No country selected: Estimated domestic ($10)

### 6.5 Discount Application

**Module:** `lib/modules/discount-voucher.js`

**Process:**
1. Customer enters discount code
2. Look up in `discounts` collection
3. Check expiration and usage limits
4. Calculate discount:
   - **Fixed amount:** Subtract from subtotal
   - **Percentage:** Apply % to subtotal
5. Apply to cart
6. Update `totalCartDiscount` in session

### 6.6 Cart Persistence

**Trigger Points:**
- Add item
- Remove item
- Update quantity
- Apply discount
- Checkout start

**Recovery on Return:**
- Customer logs in
- System loads cart from `cart` collection
- Repopulates `req.session.cart`

---

## 7. ORDER WORKFLOW

### 7.1 Order Creation Flow

**Route:** POST `/customer/checkout` or POST `/admin/order/create`

```
┌─────────────────────────────┐
│  Order Creation Request     │
│  (from cart)                │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Validate Customer Info     │
│  (email, address, etc)      │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Create Order Document      │
│                             │
│  Fields:                    │
│  - orderPaymentId (UUID)    │
│  - orderPaymentGateway      │
│  - orderTotal               │
│  - orderProducts (cart copy)│
│  - orderCustomer (link)     │
│  - orderStatus: "Pending"   │
│  - orderDate: now()         │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Insert to orders collection│
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Update Lunr Index          │
│  (for admin search)         │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  PAYMENT PROCESSING         │
│  (to payment gateway)       │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Payment Approved?          │
├─────────────────────────────┤
│  YES ↓              NO ↓     │
└──────┬──────────────┬────────┘
       ↓              ↓
    SUCCESS       FAILURE
    (continue)    (error)
       ↓
┌─────────────────────────────┐
│  Create Transaction Record  │
│  - gatewayReference         │
│  - transactionStatus        │
│  - transactionAmount        │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Update Stock (if enabled)  │
│  └─ Decrease by qty ordered │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Empty Shopping Cart        │
│  └─ Delete session/DB cart  │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Send Confirmation Email    │
│  └─ Order details to customer
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│  Redirect to Success Page   │
│  (/payment/orderId)         │
└─────────────────────────────┘
```

### 7.2 Order Status Lifecycle

**Possible Statuses:**
- `Pending` - Order created, awaiting fulfillment
- `Processing` - Being prepared for shipment
- `Dispatched` / `Shipped` - Handed to carrier
- `Delivered` - Arrived at customer
- `Cancelled` - Order cancelled
- `Refunded` - Payment refunded
- `Failed` - Payment failed/declined

**Status Transitions:**
- Admin can manually update status: POST `/admin/order/updateorder`
- Tracking number can be added when shipped

### 7.3 Order Data Model

**Collection:** `orders`

**Example Document:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  orderPaymentId: ObjectId("507f1f77bcf86cd799439012"),
  orderPaymentGateway: "Stripe",
  orderPaymentMessage: "Payment approved",
  orderTotal: 115.99,
  orderShipping: 10.00,
  orderItemCount: 2,
  orderProductCount: 3,
  orderCustomer: ObjectId("507f1f77bcf86cd799439013"),
  orderEmail: "customer@example.com",
  orderCompany: "ACME Corp",
  orderFirstname: "John",
  orderLastname: "Doe",
  orderAddr1: "123 Main St",
  orderAddr2: "Apt 4B",
  orderCountry: "Australia",
  orderState: "NSW",
  orderPostcode: "2000",
  orderPhoneNumber: "02-1234-5678",
  orderComment: "Please leave at door",
  orderStatus: "Shipped",
  orderDate: ISODate("2026-05-30T10:30:00Z"),
  orderProducts: {
    "product_variant_key_1": {
      productId: ObjectId("507f1f77bcf86cd799439014"),
      variantId: null,
      quantity: 2,
      title: "Educational Math Workbook",
      price: "29.99",
      totalItemPrice: 59.98,
      productSubscription: null
    },
    "product_variant_key_2": {
      productId: ObjectId("507f1f77bcf86cd799439015"),
      variantId: ObjectId("507f1f77bcf86cd799439016"),
      quantity: 1,
      title: "Reading Game (Advanced)",
      price: "45.99",
      totalItemPrice: 45.99,
      productSubscription: null
    }
  },
  orderType: "Single",
  transaction: ObjectId("507f1f77bcf86cd799439017"),
  trackingNumber: "AU123456789",
  productStockUpdated: true,
  updatedDate: ISODate("2026-05-31T14:20:00Z")
}
```

### 7.4 Order Management (Admin)

**Routes:**
- `GET /admin/orders` - List all orders (paginated)
- `GET /admin/orders/bystatus/:status` - Filter by status
- `GET /admin/orders/filter/:search` - Full-text search
- `GET /admin/order/view/:id` - Order detail
- `POST /admin/order/updateorder` - Update status/tracking
- `GET /admin/order/delete/:id` - Delete order
- `GET /admin/order/create` - Manual order creation form
- `POST /admin/order/create` - Process manual order

### 7.5 Invoice & Receipt Generation

**Email Template:** `public/email_template.html`

**Content Sent:**
- Order ID and date
- Product list with prices
- Shipping address
- Total amount
- Payment method
- Transaction reference

---

## 8. AUTHENTICATION AND AUTHORIZATION WORKFLOW

### 8.1 User Types

**1. Admin Users** (`users` collection)
- Can access `/admin` routes
- Full platform management
- Can be limited to specific permissions (basic implementation)

**2. Customers** (`customers` collection)
- Can browse products
- Can create account and login
- Can view own orders
- Can manage own address/info

**3. Anonymous Users**
- Can browse public products
- Can add to cart
- Can checkout as guest
- Can view published pages

### 8.2 Admin Authentication

**Route:** POST `/admin/login_action`

**Process:**
```
1. GET /admin/login (render form)
2. Admin enters email + password
3. Lookup in users collection by email
4. Compare password hash with bcrypt
5. If match:
   ├─ Create session
   ├─ Set req.session.user = {email, isAdmin}
   ├─ Redirect to /admin/dashboard
   └─ Session persisted to MongoDB
6. If no match:
   └─ Return 400 error "User not found or password incorrect"
```

**Session Details:**
- Stored in `sessions` collection (MongoDB TTL storage)
- Default expiration: 24 hours
- Cookie: `connect.sid`
- HTTPS only (recommended)

### 8.3 Admin Authorization

**Middleware:** `lib/auth.js` → `restrict()` and `checkAccess()`

**Route Protection:**
```javascript
router.get('/admin/dashboard', restrict, (req, res) => {
  // Only logged-in admins reach here
});

router.post('/admin/product/insert', restrict, checkAccess, (req, res) => {
  // Only logged-in admins with appropriate permissions reach here
});
```

**Restricted Routes:**
- Product management (new/edit/delete)
- Order management (update/delete)
- Settings management
- File uploads
- Page/menu management
- User management

**Non-Restricted Admin Routes:**
- Dashboard view
- Orders/products list (read-only)
- Settings view (read-only)

**API Key Authentication:**
- Header: `apikey` (ObjectId)
- Looks up user with `apiKey` and `isAdmin: true`
- Allows programmatic access to admin functions

### 8.4 Customer Authentication

**Flow:**
```
1. POST /customer/create (registration)
   ├─ Validate email not in use
   ├─ Hash password with bcrypt (10 rounds)
   ├─ Insert to customers collection
   └─ Set req.session.customerPresent = true

2. POST /customer/login (login)
   ├─ Find customer by email
   ├─ Compare password hash
   └─ Set session variables:
      ├─ req.session.customerPresent = true
      ├─ req.session.customerId
      ├─ req.session.customerEmail
      └─ req.session.customer[Field] (address, phone, etc)

3. Session Persistence
   └─ Customer recognized on subsequent requests
   └─ Cart linked to customerPresent

4. GET /customer/account
   ├─ Requires customerPresent
   ├─ Shows customer's orders
   └─ Allows address/info updates

5. POST /customer/logout
   └─ Clear req.session.customerPresent
```

### 8.5 Password Security

**Hashing:**
- Library: bcryptjs (v2.4.3)
- Salt rounds: 10
- Always compare hashes, never store plain text

**Policy:**
- Minimum length: Enforced by schema (optional, configurable)
- Characters: No enforced complexity (configurable)
- Reset: No built-in password reset (security consideration)

### 8.6 Session Management

**Session Store:** MongoDB (connect-mongodb-session)

**TTL:** Auto-delete expired sessions (configurable)

**Session Variables Tracked:**
- `req.session.user` (admin)
- `req.session.customerPresent` (customer)
- `req.session.customerId`
- `req.session.cart` (shopping cart)
- `req.session.totalCartAmount`
- `req.session.discountCode`
- `req.session.message` (flash message)
- `req.session.messageType` (success/danger/warning)

### 8.7 CSRF Protection

**Middleware:** `csurf` (v1.11.0)

**Implementation:**
- All forms include hidden CSRF token
- Admin POST requests require valid token
- Prevents cross-site request forgery

### 8.8 Security Practices

| Measure | Implementation |
|---------|-----------------|
| **Password Hashing** | bcryptjs (10 rounds) |
| **CSRF Protection** | csurf middleware |
| **XSS Prevention** | HTML sanitization (sanitize-html) |
| **SQL Injection** | MongoDB (not SQL, but injection prevention via MongoSanitize) |
| **HTTP Headers** | Helmet.js |
| **Rate Limiting** | express-rate-limit (login endpoint) |
| **HTTPS** | Recommended (Helmet enforces) |
| **Secure Cookies** | httpOnly, Secure flags set |
| **Session Timeout** | Configurable (default 24h) |

---

# HEBA PLANET MIGRATION PLAN

## PART 1: MIGRATION STRATEGY

### Vision
Transform ExpressCart into **Heba Planet**, an educational marketplace, while preserving:
- All payment gateway integrations (9 gateways)
- Checkout and cart functionality
- Admin dashboard and management tools
- Customer account system
- Order and transaction tracking

### Scope
**IN Scope:**
- Product catalog transformation (product data model, categories)
- Marketplace content (product descriptions, images, resources)
- Theme/branding (visual redesign)
- New product categories/types
- Educational-specific features (courses, downloadables, sessions)
- Content management system

**OUT of Scope:**
- Database structure changes (preserve MongoDB collections)
- Payment processing (reuse existing integrations)
- Authentication system (keep bcrypt + sessions)
- Checkout flow (minor UX adjustments only)

### Key Preservation Points
✅ All 9 payment gateways remain functional
✅ Cart and checkout workflows unchanged
✅ Admin CRUD operations preserved
✅ Customer account system intact
✅ Order/transaction tracking maintained
✅ Session and authentication logic unchanged

---

## PART 2: DETAILED FILE MODIFICATION GUIDE

### TOTAL FILES TO MODIFY: **68 files**
### BREAKDOWN:
- Core Config: 4 files
- Database: 2 files
- Routes: 9 files
- Templates: 27 files
- Styles/Assets: 14 files
- Configuration: 8 files

---

## SECTION A: CONFIGURATION FILES (4 files)

### 1. **config/settings.json** ⚠️ CRITICAL
**Current Purpose:** Store e-commerce settings (title, currency, payment gateways)
**Required Changes:**
- `cartTitle` → Change from "CLOTH" to "Heba Planet"
- `cartDescription` → "Educational Marketplace for Books, Games, Courses & Coaching"
- `cartLogo` → URL to new Heba Planet logo
- `currencySymbol` → Adapt to target currency (e.g., "ر.س" for Saudi Riyal, "$" for USD)
- `currencyISO` → Change to appropriate ISO code (e.g., "SAR", "USD")
- `theme` → Update to new theme: "HebaTheme" or "Educational"
- `footerHtml` → Update footer with Heba Planet branding
- `googleAnalytics` → Update to Heba Planet property ID
- Add new categories in config or database (if using product tags)
- `emailAddress` → Update to Heba Planet support email

**Why Modified:**
- Every public-facing reference to store name needs updating
- Currency reflects target market
- Theme references the new design system
- Analytics tracks the right property

**Preserved:**
- `paymentGateway` array (all 9 gateways remain)
- `databaseConnectionString` (same MongoDB)
- `modules.enabled` (shipping, discount, reviews remain)
- `trackStock` setting (can be kept or adjusted)
- `secretCookie` and `secretSession` (regenerate with new values)

---

### 2. **config/menu.json** ⚠️ IMPORTANT
**Current Purpose:** Navigation menu configuration
**Required Changes:**
- Update `items` array with new navigation structure:
  ```javascript
  [
    { title: "Home", link: "/", order: 1 },
    { title: "Shop Books", link: "/products?category=books", order: 2 },
    { title: "Workbooks", link: "/products?category=workbooks", order: 3 },
    { title: "Games", link: "/products?category=games", order: 4 },
    { title: "Courses", link: "/products?category=courses", order: 5 },
    { title: "Coaching Sessions", link: "/products?category=coaching", order: 6 },
    { title: "Printables", link: "/products?category=printables", order: 7 },
    { title: "About Us", link: "/pages/about", order: 8 },
    { title: "Blog", link: "/pages/blog", order: 9 },
    { title: "Contact", link: "/pages/contact", order: 10 }
  ]
  ```

**Why Modified:**
- Navigation reflects new product categories
- Links guide customers to relevant sections
- Menu management happens through this config

---

### 3. **config/settingsSchema.json** ⚠️ CRITICAL
**Current Purpose:** JSON schema validation for settings.json
**Required Changes:**
- Add new configuration options:
  - `courseModuleEnabled` (boolean) - Enable course/subscription features
  - `coachingSessionsEnabled` (boolean) - Enable coaching sessions
  - `printableDeliveryEnabled` (boolean) - Enable digital delivery
  - `courseStartDate` (date format) - Course start scheduling
  - `sessionDuration` (string) - Coaching session duration (e.g., "60min", "90min")
- Update property definitions and validation rules
- Add enum values for new product types

**Why Modified:**
- Schema validates settings when app starts
- New features require configuration options
- Prevents invalid settings from being saved

**Preserved:**
- All existing payment gateway schema definitions
- Existing property validations

---

### 4. **locales/en.json** ⚠️ IMPORTANT
**Current Purpose:** English language strings for i18n
**Required Changes:**
- Update cart/product terminology:
  - Old: "Products"
  - New: "Products", "Books", "Courses", "Coaching Sessions"
- Update category names
- Update email templates text
- Add new strings for educational features:
  - Course registration messages
  - Coaching session booking messages
  - Digital delivery confirmations
  - Certificate generation messages
- Update footer and header text
- Update all hardcoded strings visible to customers

**Pattern Example:**
```json
{
  "product.list.title": "Browse Our Educational Resources",
  "product.filter.books": "Books & Workbooks",
  "product.filter.courses": "Online Courses",
  "product.filter.coaching": "Parenting Coaching",
  "product.filter.games": "Educational Games",
  "product.filter.printables": "Printable Resources",
  "cart.items": "Items in Cart",
  "checkout.proceed": "Complete Purchase",
  "email.order.title": "Your Heba Planet Order",
  "email.course.registered": "Course Registration Confirmed"
}
```

**Supported Languages:** Add Italian (it.json) translations as well

---

## SECTION B: DATABASE INITIALIZATION (2 files)

### 5. **lib/testdata.js** ⚠️ IMPORTANT
**Current Purpose:** Populate test/demo database with sample products
**Required Changes:**
- Replace all "CLOTH" / clothing products with educational items
- Create sample products for each category:
  
  **Books (Kindergarten):**
  - "My First Alphabet Book" - $12.99
  - "Colors and Shapes Discovery" - $11.99
  - "Numbers 1-10 Learning Book" - $13.99
  
  **Educational Workbooks:**
  - "Math Practice Workbook K-2" - $9.99
  - "Reading Comprehension Workbook" - $10.99
  - "Handwriting Practice Book" - $8.99
  
  **Games:**
  - "Letters & Sounds Board Game" - $24.99
  - "Number Sequence Card Game" - $14.99
  - "Word Builder Puzzle Set" - $19.99
  
  **Courses:**
  - "Introduction to Early Childhood Learning" (subscription) - $49.99/month
  - "Advanced Parenting Strategies" (subscription) - $59.99/month
  
  **Coaching Sessions:**
  - "One-on-One Parenting Consultation" (60 min) - $79.99
  - "Family Communication Workshop" (90 min) - $99.99
  
  **Printables:**
  - "Monthly Activity Calendar" (digital) - $4.99
  - "Learning Goals Tracker" (digital) - $3.99

- Add product tags: "books", "workbooks", "games", "courses", "coaching", "printables"
- Update descriptions to reflect educational benefits
- Add proper variants (e.g., course duration options, coaching time slots)
- Create sample users and admin account

**Why Modified:**
- Test data reflects actual product offerings
- Developers can test with realistic data
- Demo site shows actual marketplace

---

### 6. **lib/db.js** ⚠️ REVIEW ONLY (may not need modification)
**Current Purpose:** MongoDB connection and collection setup
**Assessment:**
- Collection names are generic (products, orders, customers, etc.)
- **NO CHANGES REQUIRED** - Database structure preserved as-is
- Note: Existing data from ExpressCart can be migrated if you have a live database

**Action:** Review only to confirm collections are appropriate for new use case

---

## SECTION C: BUSINESS LOGIC MODIFICATIONS (6 files)

### 7. **lib/common.js** ⚠️ MAJOR CHANGES
**Current Purpose:** Utility functions used throughout the application
**Required Changes:**

**A. Product Image Handling:**
- Allowed MIME types: (keep as-is - still images)
- Max file size: Keep at 10MB (for course covers, product images)

**B. Add New Helper Functions:**
```javascript
// Get product categories for filtering
const getProductCategories = () => {
  return ['Books', 'Workbooks', 'Games', 'Courses', 'Coaching', 'Printables'];
};

// Determine if product is a course/subscription
const isSubscriptionProduct = (product) => {
  return product.productSubscription !== null && product.productSubscription !== undefined;
};

// Calculate course/coaching pricing
const getSessionPrice = (product, variant) => {
  // Courses: monthly recurring
  // Coaching: per-session flat rate
  // Return appropriate pricing format
};

// Generate course certificate placeholder
const generateCourseCertificate = (order, customer) => {
  // Return certificate generation path
};

// Get delivery method for product type
const getDeliveryMethod = (product) => {
  // Digital = email download
  // Physical = shipping
  // Course = online enrollment
  // Coaching = calendar booking
};
```

**C. Email Template Updates:**
- Update `getEmailTemplate()` to support:
  - Course registration confirmations
  - Coaching session booking confirmations
  - Digital resource delivery
  - Course start reminders

**Why Modified:**
- New product types need special handling
- Courses are subscriptions (recurring revenue)
- Coaching sessions need booking/calendar integration
- Digital resources need download links

---

### 8. **lib/cart.js** ⚠️ MODERATE CHANGES
**Current Purpose:** Shopping cart management and calculation
**Required Changes:**

**A. Subscription Product Handling (Already Partially Implemented):**
- Verify `productSubscription` field is properly populated
- Ensure courses/coaching sessions are marked as subscriptions
- Prevent shipping calculation for digital products

**B. Add New Functions:**
```javascript
// Check if cart contains digital products only
const hasOnlyDigitalProducts = (cart) => {
  // Return true if all items are digital (courses, printables)
};

// Calculate digital delivery fees (if any)
const calculateDigitalDeliveryFee = (cart) => {
  // Currently $0, but framework for future use
};

// Validate cart contents before checkout
const validateCartForCheckout = (cart) => {
  // Ensure all products are still available
  // Check if sessions are still open for coaching
  // Verify course capacity
};
```

**C. Shipping Calculation Updates:**
- Exclude digital products from shipping charges
- Update `lib/modules/shipping-basic.js` to recognize product types

**Why Modified:**
- Digital resources don't need physical shipping
- Courses/coaching have different fulfillment
- Cart validation prevents invalid orders

---

### 9. **lib/auth.js** ⚠️ MINIMAL CHANGES (if any)
**Current Purpose:** Authentication and authorization middleware
**Assessment:**
- Authentication logic works for new marketplace
- No role-based permissions needed yet (only admin/customer)
- **NO CHANGES REQUIRED** for core auth
- Review for future: Role-based access control (coaches, course instructors)

**Potential Future Enhancements:**
- Add "instructor" role for course/coaching management
- Add "moderator" role for content review
- Preserve for now; implement in Phase 2

---

### 10. **lib/config.js** ⚠️ MINIMAL CHANGES (if any)
**Current Purpose:** Load and validate configuration
**Assessment:**
- Configuration loading mechanism works for new settings
- Validation via settingsSchema.json (which we update)
- **NO CHANGES REQUIRED** for core logic

**Potential Changes:**
- Add helper function: `getEducationalConfig()` to fetch course/coaching settings

---

### 11. **lib/menu.js** ⚠️ MINIMAL CHANGES (if any)
**Current Purpose:** Menu item CRUD operations
**Assessment:**
- Menu structure works for new navigation
- No changes to function signatures
- **NO CHANGES REQUIRED**

---

### 12. **lib/indexing.js** ⚠️ MODERATE CHANGES
**Current Purpose:** Create Lunr.js full-text search indexes
**Required Changes:**

**A. Update Product Indexing Boosting:**
```javascript
const indexProducts = async (app) => {
    // Update boost weights for educational context
    const productsIndex = lunr(function(){
        this.field('productTitle', { boost: 15 }); // Higher boost for exact titles
        this.field('productTags', { boost: 10 }); // Categories are important
        this.field('productDescription', { boost: 8 }); // Description search
        // this.field('productCategory', { boost: 20 }); // If added to schema
        // ... rest of indexing
    });
};
```

**B. Index New Fields (if added):**
- If adding `productCategory` field, include in index
- If adding `productLevel` (K-2, 3-5, etc.), include
- If adding `productAgeRange` (ages 3-6, 6-9, etc.), include

**Why Modified:**
- Boost weights affect search relevance
- Educational products need to be discoverable by learning level
- Categories should rank highly in search results

---

## SECTION D: ROUTE MODIFICATIONS (9 files)

### 13. **routes/index.js** ⚠️ MAJOR CHANGES
**Current Purpose:** Customer-facing routes (homepage, products, cart, payment)
**Required Changes:**

**A. Homepage (GET `/`):**
- Update template rendering to pass Heba Planet branding
- Add featured categories section
- Add testimonials/success stories
- Update hero section imagery

**B. Product Listing (GET `/products`):**
- Add category filtering by product tag
- Add age/grade level filtering
- Add difficulty level filtering
- Update sorting options to include "popularity", "rating", "newest"
- Add product tags as visible filters

**C. Product Detail (GET `/product/:permalink`):**
- Display age range recommendations
- Display learning level
- Display customer reviews/ratings
- For courses: Show course curriculum, duration
- For coaching: Show coach profile, availability
- For printables: Show preview images, file format

**D. Cart Operations:**
- Add "Add to Cart" logic for different product types
- For digital products: Immediate delivery notification
- For courses: Enrollment flow
- For coaching: Session booking integration

**E. Checkout Flow (POST `/checkout`):**
- Verify cart validity
- For courses: Create course enrollment record
- For coaching: Create session booking record
- For digital: Prepare delivery
- For physical: Prepare shipping

**F. Payment Processing (GET `/payment/:orderId`):**
- Stock management logic (keep for physical products only)
- Update success message based on product type
- For digital: Generate download link
- For courses: Send enrollment credentials
- For coaching: Send calendar invite

**Why Modified:**
- Different product types have different customer journeys
- Educational context requires additional product metadata
- Checkout needs to handle enrollments, not just orders

---

### 14. **routes/product.js** ⚠️ MAJOR CHANGES
**Current Purpose:** Product admin CRUD operations
**Required Changes:**

**A. Product Creation/Editing Form (GET `/admin/product/new`, `/admin/product/edit/:id`):**
- Add new fields to form:
  - `productCategory` (dropdown: Books, Workbooks, Games, Courses, Coaching, Printables)
  - `productLevel` (dropdown: K, 1-2, 3-5, 6-8, 9-12, Adult)
  - `productAgeRange` (text: e.g., "Ages 3-6")
  - `productCourseLength` (text: e.g., "8 weeks" or "12 modules")
  - `productCoachingDuration` (dropdown: 30min, 60min, 90min)
  - `productDigitalDownload` (checkbox: is this digital/downloadable?)
  - `productDeliveryType` (dropdown: Physical Shipping, Digital Download, Course Enrollment, Coaching Booking)
  - `productIncludes` (textarea: bullet list of what's included)

**B. Product Validation Schema Update:**
- Add validators for new fields in `lib/schemas/newProduct.json`
- Add enum values for dropdowns

**C. Variant Management Update:**
- For courses: variants = course duration options (e.g., "Self-paced", "12-week cohort")
- For coaching: variants = session types (e.g., "Email consultation", "Video call")
- For physical books: variants = editions/formats (e.g., "Hardcover", "Paperback")

**D. Image/Gallery Management:**
- Keep current image upload system
- Add course cover image handling
- Add preview image thumbnails for printables

**E. Subscription Product Setup:**
- For courses: Set `productSubscription` to "monthly" or "lifetime"
- For coaching: Set `productSubscription` to null (one-time purchases)

**Why Modified:**
- Admin needs to categorize products correctly
- Educational metadata essential for discovery
- Different product types need different information

---

### 15. **routes/order.js** ⚠️ MAJOR CHANGES
**Current Purpose:** Order management (list, view, update, create)
**Required Changes:**

**A. Order Creation Enhancement:**
- For course orders: Create course enrollment record
- For coaching orders: Create session booking record
- For digital orders: Prepare download link generation
- Update order status flow for digital products

**B. Order Management Interface Updates:**
- Show product type icons (📚 for books, 🎓 for courses, 👨‍🏫 for coaching)
- For courses: Show enrollment status, certificate status
- For coaching: Show session date/time, coach info
- For digital: Show download link, expiration date

**C. Order Status Updates:**
- Add new status for courses: "Enrolled", "In Progress", "Completed"
- Add new status for coaching: "Scheduled", "Completed", "Rescheduled"
- Add new status for digital: "Delivered", "Downloaded"

**D. Email Notifications Update:**
- Course orders: Send enrollment confirmation with login credentials
- Coaching orders: Send booking confirmation with coach profile
- Digital orders: Send immediate download link

**Why Modified:**
- Different product types have different fulfillment requirements
- Admin needs visibility into course/coaching status
- Customers need product-specific confirmations

---

### 16. **routes/customer.js** ⚠️ MODERATE CHANGES
**Current Purpose:** Customer registration, login, account management
**Required Changes:**

**A. Customer Registration (POST `/customer/create`):**
- Add optional profile fields:
  - `studentLevel` / `childAgeRange` - for personalized recommendations
  - `interests` - checkboxes for product categories
  - `receiveNewsletter` - opt-in for course updates

**B. Customer Account (GET `/customer/account`):**
- Display orders grouped by type:
  - Physical orders (with shipping status)
  - Course enrollments (with progress, completion date, certificate)
  - Coaching sessions (with date/time, notes from coach)
  - Digital downloads (with download links if not expired)
- Add actions:
  - "Download Certificate" for completed courses
  - "Schedule Session" for coaching booking
  - "Redownload" for digital resources
  - "Leave Review" for completed products

**C. Customer Profile Update (POST `/customer/update`):**
- Allow updating child age range, interests
- Add learning preferences settings

**D. Customer Orders Display:**
- Add product-specific information display
- Show course progress bar
- Show coaching session details
- Show digital delivery confirmation

**Why Modified:**
- Customers need to see product-type-specific information
- Self-service actions (download, schedule) reduce support burden
- Profile personalization improves recommendations

---

### 17. **routes/admin.js** ⚠️ MAJOR CHANGES
**Current Purpose:** Admin dashboard, settings, user management
**Required Changes:**

**A. Dashboard (GET `/admin` or `/admin/dashboard`):**
- Add educational-specific widgets:
  - Course enrollment trends
  - Coaching session bookings
  - Digital download statistics
  - New review/rating submissions
- Update revenue metrics to show product type breakdown

**B. Settings Page (GET `/admin/settings`):**
- Add new settings sections:
  - **Course Settings:**
    - Enable/disable course feature
    - Default course duration
    - Certificate generation settings
  - **Coaching Settings:**
    - Enable/disable coaching feature
    - Available session durations
    - Coach profile management
  - **Digital Delivery Settings:**
    - Download link expiration (days)
    - Max download attempts
  - **Educational Settings:**
    - Recommended age ranges
    - Learning levels offered
    - Subject categories

**C. Pages Management (GET/POST `/admin/settings/pages*`):**
- Add predefined pages:
  - "About Heba Planet" (about us)
  - "For Parents" (landing for parents)
  - "For Teachers" (landing for educators)
  - "FAQ" (FAQ page)
  - "Contact Us" (contact form)
  - "Privacy Policy" (legal)
  - "Terms of Service" (legal)

**D. Menu Management (GET/POST `/admin/settings/menu*`):**
- Already configured in menu.json
- Ensure admin UI works with new structure

**E. User Management (GET/POST `/admin/users*`):**
- Keep current user management
- Add user role field for future instructor/coach user types
- Add audit log for admin actions

**F. File Upload (POST `/admin/file/upload`):**
- Keep current image upload
- Add PDF upload support for printables
- Add video file upload support for courses (future)

**Why Modified:**
- New features require configuration
- Admin needs control over educational settings
- Pages need content-specific to educational marketplace

---

### 18. **routes/user.js** ⚠️ MODERATE CHANGES
**Current Purpose:** Admin user authentication and management
**Required Changes:**

**A. Login/Password Management:**
- Keep bcrypt authentication (no changes)
- Add "Admin" label for clarity

**B. User Listing (GET `/admin/users`):**
- Add column: "Permissions" or "Role"
- Add column: "Last Login"
- Future: Add role assignment (currently all admins)

**C. User Creation (POST `/admin/user/insert`):**
- Add optional field: `userRole` (default: "admin")
- Keep as-is for now; role system in Phase 2

**D. API Key Management:**
- Keep current API key functionality
- Document for partner integrations

**Why Modified:**
- Prepare data structure for future role-based access
- Improve user management visibility
- Track admin activity

---

### 19. **routes/reviews.js** ⚠️ MINOR CHANGES
**Current Purpose:** Customer product reviews and ratings
**Required Changes:**

**A. Review Creation (POST `/product/:id/review`):**
- Keep current 5-star rating system
- Add educational-specific review prompts:
  - "Would you recommend this for children ages X-Y?"
  - "Would you use this again?"
  - "What did you like most about this resource?"

**B. Review Display (GET `/product/:id/reviews`):**
- Filter reviews by product type
- Highlight verified purchases (user has completed course or bought physical item)
- Sort by: "Most Helpful", "Newest", "Highest Rating"

**C. Review Management (Admin):**
- Add approval workflow for reviews (optional)
- Add "featured review" option for homepage testimonials

**Why Modified:**
- Educational products need learning-outcome reviews
- Verification adds credibility
- Featured reviews drive conversions

---

### 20. **routes/transactions.js** ⚠️ MINIMAL CHANGES
**Current Purpose:** Payment transaction tracking
**Assessment:**
- Payment processing logic stays the same
- No changes required for core functionality
- **NO CHANGES NEEDED** to routes/transactions.js

---

## SECTION E: TEMPLATE FILES (27 files)

### Summary of Template Changes

**Key Principle:** All templates will reference "Heba Planet" instead of the generic/clothing theme, and will display educational product information appropriately.

### 21-23. **Core Layout Templates (3 files)**

**21. views/layouts/layout.hbs** ⚠️ MAJOR
- Update header logo/branding
- Update header navigation menu links
- Update footer with Heba Planet copyright
- Update footer with new social media links
- Add language selector (if keeping i18n)
- Update stylesheet links for new theme

**22. views/[theme-specific]/layouts/layout.hbs** ⚠️ NEW
- Create new "HebaTheme" with educational color scheme
- Professional blue/green colors (educational branding)
- Clean, accessible design

**23. views/partials/** ⚠️ MAJOR (Multiple files)
- Update header partial: New logo, navigation
- Update footer partial: New links, social media
- Update productCard partial: Show age range, level, category badge
- Update cartItem partial: Show digital/course/coaching badge
- Update new partials:
  - `courseCard.hbs` - Course thumbnail with curriculum preview
  - `coachingCard.hbs` - Coach profile card
  - `certificatePreview.hbs` - Course certificate
  - `sessionBookingModal.hbs` - Coaching session booking
  - `digitalResourceBadge.hbs` - Digital product badge

---

### 24-27. **Product-Related Templates (4 files)**

**24. views/product.hbs** ⚠️ MAJOR
- Update to show educational metadata:
  - Age range recommendation
  - Learning level
  - Product category
  - Product type badge (📚 book, 🎓 course, 👨‍🏫 coaching, 📥 printable)
- Update product images gallery
- Update "Add to Cart" button (conditional: "Enroll Now" for courses, "Book Session" for coaching)
- Add customer reviews section
- For courses: Add curriculum/contents section
- For coaching: Add coach profile section
- For printables: Add preview images, file format info
- Update related products section

**25. views/products.hbs** ⚠️ MAJOR
- Add category filter sidebar:
  - Books
  - Workbooks
  - Games
  - Courses
  - Coaching Sessions
  - Printables
- Add learning level filter
- Add age range filter
- Update product card to show:
  - Category badge
  - Age range
  - Learning level
  - Number of reviews/rating
- Update sorting options: "New", "Popular", "Top Rated", "Price: Low-High", "Price: High-Low"

**26. views/product-new.hbs** ⚠️ MAJOR
- Add new form fields:
  - Product category (dropdown)
  - Learning level (dropdown)
  - Age range (text)
  - Course/coaching specific fields
  - Delivery type (dropdown)
  - Digital/downloadable (checkbox)
- Update form layout to organize by product type
- Add preview for new fields

**27. views/product-edit.hbs** ⚠️ MAJOR
- Mirror changes from product-new.hbs
- Add variant management for educational variants
- Add image gallery uploader
- Add thumbnail previewer

---

### 28-30. **Customer-Facing Templates (3 files)**

**28. views/customer.hbs** ⚠️ NEW (if doesn't exist)
- Customer login/registration page
- Update with Heba Planet branding
- Add registration form for optional profile fields

**29. views/customer-account.hbs** (from customer.js rendering) ⚠️ MAJOR
- Order list grouped by type:
  - **Physical Orders:** Show shipping status, tracking
  - **Courses:** Show enrollment status, progress bar, certificates
  - **Coaching:** Show scheduled sessions, completed count
  - **Digital:** Show download status, links
- Add action buttons:
  - "Download Certificate" for courses
  - "Redownload" for digital resources
  - "Book Another Session" for coaching
  - "Rate This Product" for all types
- Update customer profile section
- Add profile preferences (age range, interests)

**30. views/customers.hbs** ⚠️ MINOR
- Admin customer list view
- Add columns: Name, Email, Orders, Registrations
- Keep current admin styling

---

### 31-33. **Order-Related Templates (3 files)**

**31. views/order.hbs** ⚠️ MAJOR
- Update order detail display
- Show product-specific information:
  - Books: shipping status, tracking
  - Courses: enrollment date, completion date, certificate link
  - Coaching: session date/time, coach notes
  - Digital: download links, file formats
- Add timeline view of order status
- Add admin actions:
  - Update order status
  - For courses: Mark complete, generate certificate
  - For coaching: Reschedule session

**32. views/order-create.hbs** ⚠️ MODERATE
- Update form labels for Heba Planet
- Keep customer info form
- Update product selector for new product types

**33. views/orders.hbs** ⚠️ MODERATE
- Admin orders list
- Add column: "Product Type" (🎓, 📚, 👨‍🏫, 📥)
- Add column: "Status" with color coding
- Add filter by type
- Update sorting options

---

### 34-36. **Cart & Checkout Templates (3 files)**

**34. views/cart.hbs** ⚠️ MAJOR
- Update shopping cart display
- Group items by type:
  - Books/Workbooks (physical)
  - Games (physical)
  - Courses (enrollments)
  - Coaching (bookings)
  - Printables (digital)
- Update item cards:
  - Physical: Show quantity, price, subtotal
  - Courses: Show duration, start date, subscription term
  - Coaching: Show session duration, available dates
  - Digital: Show file format, delivery method
- Update cart summary:
  - Subtotal
  - Shipping (only for physical items)
  - Discount (if applied)
  - Tax (if applicable)
  - **Total**
- Update action buttons:
  - "Continue Shopping"
  - "Apply Coupon"
  - "Proceed to Checkout"
  - "Save for Later" (for wishlists)

**35. views/checkout.hbs** ⚠️ MAJOR (if exists, else create)
- Multi-step checkout flow:
  - Step 1: Shipping/Delivery Address (show only for physical items)
  - Step 2: Billing Address
  - Step 3: Shipping Method (show only for physical items)
  - Step 4: Review Order
  - Step 5: Select Payment Method
- Conditional sections based on product types in cart
- For courses: Show course details, term length
- For coaching: Show session details, coach info
- For digital: Show delivery method (email)
- Update order summary
- Add payment gateway selection
- Update payment processing for each gateway

**36. views/[theme]/cart.hbs** (theme-specific) ⚠️ MAJOR
- Mirror updates from default cart.hbs
- Apply new theme styling
- Update colors, fonts, layout

---

### 37-39. **Admin Dashboard Templates (3 files)**

**37. views/dashboard.hbs** ⚠️ MAJOR
- Update with Heba Planet branding
- Add widgets:
  - **Total Revenue** (compare monthly)
  - **New Orders** (this month)
  - **Active Courses** (enrollments)
  - **Coaching Sessions** (booked)
  - **Recent Reviews** (with ratings)
  - **Top Products** (by sales)
  - **Trending Searches** (what customers search for)
- Add charts:
  - Revenue by product type
  - Course enrollment trends
  - Coaching session popularity
- Add quick links:
  - New Product
  - View Orders
  - View Customers
  - Settings

**38. views/settings.hbs** ⚠️ MAJOR
- Reorganize sections for educational context:
  - **Store Settings:** Title, description, logo, URL, currency
  - **Course Settings:** Enable courses, certificate template
  - **Coaching Settings:** Enable coaching, session durations
  - **Digital Settings:** Download expiration, delivery method
  - **Payment:** Payment gateway selection
  - **Shipping:** Shipping rates, methods
  - **Discounts:** Discount code management
  - **Email:** Email configuration
  - **Pages:** CMS page management
  - **Menu:** Navigation menu
  - **Theme:** Theme selection
  - **Language:** Language settings
  - **Analytics:** Google Analytics ID
  - **Advanced:** Custom CSS, Custom JS, API keys

**39. views/settings-page(s).hbs** ⚠️ MODERATE
- Keep CMS functionality
- Pre-populate with educational pages:
  - About Heba Planet
  - For Parents
  - For Teachers
  - FAQ
  - Contact Us
  - Privacy Policy
  - Terms of Service

---

### 40-42. **User Management Templates (3 files)**

**40. views/users.hbs** ⚠️ MODERATE
- Admin user list
- Add columns: Name, Email, Role, Last Login, Actions
- Add action buttons: Edit, Delete, Reset Password
- Add "Add New User" button

**41. views/user-new.hbs** ⚠️ MINOR
- Admin user creation form
- Add field: User role (dropdown: Admin, Instructor, Moderator) - future-proofing
- Keep password setup

**42. views/user-edit.hbs** ⚠️ MINOR
- Admin user editing form
- Allow role assignment (future)
- Allow password reset

---

### 43-47. **CMS & Menu Templates (5 files)**

**43. views/settings-menu.hbs** ⚠️ MINOR
- Menu management interface
- Keep current drag-and-drop functionality
- Ensure educational menu items work

**44. views/settings-pages.hbs** ⚠️ MODERATE
- CMS pages management list
- Add columns: Title, Slug, Status (Published/Draft), Actions
- Add "New Page" button
- Add search/filter

**45. views/settings-pages/new.hbs** ⚠️ MODERATE
- New page creation form
- Title field
- Slug field (auto-generate from title)
- Content editor (HTML/WYSIWYG)
- Publish checkbox
- Meta description (optional)

**46. views/settings-pages/edit.hbs** ⚠️ MODERATE
- Mirror new.hbs
- Pre-populate fields
- Add update button

**47. views/settings-discount*.hbs** (3 files: new/edit/list) ⚠️ MINOR
- Discount code management
- Add columns: Code, Type, Value, Expiry, Usage
- Add "New Discount" button
- Allow creating % or fixed-amount discounts
- Set expiration and usage limits

---

### 48-49. **Error & Misc Templates (2 files)**

**48. views/error.hbs** ⚠️ MINOR
- Error page display
- Update with Heba Planet branding
- Add helpful messages based on error type

**49. views/login.hbs** ⚠️ MODERATE
- Admin login form
- Update with Heba Planet branding
- Add "Forgot Password" link (future)
- Update form styling

---

### 50-51. **Transaction & Review Templates (2 files)**

**50. views/transaction.hbs** ⚠️ MINOR
- Transaction detail view
- Show payment details, gateway response, status
- Keep current structure

**51. views/reviews.hbs** ⚠️ MODERATE
- Product reviews page
- Add educational-specific reviews display
- Show review helpfulness voting
- Add moderation UI for admin

---

## SECTION F: STATIC ASSETS (14 files)

### 52-55. **JavaScript Files (4 files)**

**52. public/javascripts/common.js** ⚠️ MODERATE
- Update cart manipulation functions for product types
- Add functions:
  - `addProductToCart(productId, type)` - Handle different product types
  - `getProductTypeIcon(type)` - Return appropriate icon
  - `validateCourseEnrollment()` - Check course capacity
  - `validateCoachingSessionAvailability()` - Check session slots
- Keep currency formatting
- Keep form validation

**53. public/javascripts/expressCart.js** ⚠️ MODERATE
- Update product page interactions
- Add course/coaching booking interactions
- Add age range recommendation display
- Add product type filtering
- Add digital resource preview modal

**54. public/javascripts/admin.js** ⚠️ MODERATE
- Update admin form handlers
- Add product type-specific field visibility
- Add dashboard widget interactions
- Add settings form handlers

**55. public/javascripts/admin.min.js** ⚠️ MINOR
- Minified version of admin.js
- Will be regenerated during build

---

### 56-60. **Stylesheet Files (5 files)**

**56. public/stylesheets/style.css** ⚠️ MAJOR
- Update color scheme:
  - Replace clothing store colors with educational theme
  - Primary: Professional blue (#1e3a8a or #0066cc)
  - Secondary: Light green (#10b981 or #34d399)
  - Accent: Warm orange (#f97316 for CTAs)
- Add styles for new components:
  - `.product-badge { badge styles }`
  - `.course-card { course card styles }`
  - `.coaching-card { coach profile card styles }`
  - `.age-range-badge { age range display }`
  - `.learning-level-badge { level badge }`
  - `.certificate-preview { certificate display }`
  - `.session-booking { booking form styles }`
- Update product listing grid
- Update product detail page layout
- Update cart/checkout layout
- Add responsive breakpoints for mobile

**57. public/stylesheets/admin.css** ⚠️ MAJOR
- Update admin dashboard styling
- Add widgets styling for course/coaching metrics
- Update settings form layouts
- Add color coding for product types
- Update status indicator colors

**58. public/stylesheets/pushy.css** ⚠️ MINOR
- Mobile navigation styling
- Keep functional, update colors to match theme

**59. public/stylesheets/admin.min.css** ⚠️ MINOR
- Minified version (auto-generated)

**60. public/stylesheets/style.min.css** ⚠️ MINOR
- Minified version (auto-generated)

---

### 61-62. **LESS Source Files (2 files)**

**61. public/stylesheets/less/variables.less** ⚠️ MAJOR
- Define color variables:
  ```less
  @primary-color: #1e3a8a; // Professional blue
  @secondary-color: #10b981; // Light green
  @accent-color: #f97316; // Warm orange
  @success-color: #22c55e;
  @danger-color: #ef4444;
  @warning-color: #eab308;
  @info-color: #06b6d4;
  ```
- Define typography:
  ```less
  @font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  @headings-font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  ```
- Define spacing variables
- Define breakpoints for responsive design

**62. public/stylesheets/less/[other].less** ⚠️ MAJOR
- Create LESS files for different sections:
  - `products.less` - Product listing and detail styles
  - `cart.less` - Cart and checkout styles
  - `dashboard.less` - Admin dashboard styles
  - `courses.less` - Course-specific styles
  - `coaching.less` - Coaching-specific styles
  - `responsive.less` - Mobile responsiveness

---

### 63-64. **Font & Icon Files (2 files)**

**63. public/stylesheets/font/** ⚠️ MINOR
- Keep existing web fonts
- Add educational-themed font weights

**64. public/images/** ⚠️ MAJOR
- Replace/add:
  - `logo.png` - New Heba Planet logo
  - `favicon.ico` - New favicon
  - `hero-bg.jpg` - Homepage hero image (educational theme)
  - `product-placeholder.png` - Default product image
  - `course-placeholder.png` - Default course image
  - `coaching-placeholder.png` - Default coach image
  - `icons/book.svg` - Category icons (from Feather Icons)
  - `icons/play-circle.svg` - Course icon
  - `icons/user.svg` - Coaching icon
  - `icons/download.svg` - Digital resource icon

---

### 65-66. **Configuration Files (2 files)**

**65. Dockerfile** ⚠️ MINOR (if using Docker)
- Update image name/labels
- No functional changes needed
- Keep Node.js version consistent

**66. docker-compose.yml** ⚠️ MINOR (if using Docker)
- Update service names if desired
- Keep MongoDB and app services
- No functional changes needed

---

### 67-68. **Build & Deployment Files (2 files)**

**67. package.json** ⚠️ REVIEW ONLY
- Keep all dependencies as-is
- Update "name" and "description":
  ```json
  {
    "name": "heba-planet",
    "description": "Heba Planet - Educational Marketplace",
    "version": "1.0.0"
  }
  ```
- Keep all scripts
- Keep all dependencies

**68. README.md** ⚠️ IMPORTANT
- Update project description
- Add Heba Planet-specific setup instructions
- Document new features (courses, coaching, etc.)
- Update demo site URL
- Add contributing guidelines
- Add feature roadmap

---

## SECTION G: NEW FILES TO CREATE (Not modifications)

These are NEW files to add (beyond the 68 modifications):

### **New Schema Files (for validation):**
- `lib/schemas/newCourse.json` - Course validation
- `lib/schemas/editCourse.json` - Course editing
- `lib/schemas/newCoach.json` - Coach profile
- `lib/schemas/newCertificate.json` - Certificate data

### **New Module Files:**
- `lib/modules/courses.js` - Course enrollment management
- `lib/modules/coaching.js` - Coaching session management
- `lib/modules/digital-delivery.js` - Digital file delivery

### **New Payment Support:**
- `config/payment/config/crypto.json` - Crypto gateway config (if adding)
- `config/payment/schema/crypto.json` - Crypto validation

### **New Template Files:**
- `views/course-detail.hbs` - Course detail page
- `views/course-enroll.hbs` - Course enrollment form
- `views/coach-profile.hbs` - Coach profile display
- `views/session-booking.hbs` - Session booking form
- `views/certificate.hbs` - Certificate template
- `views/themes/HebaTheme/` - New theme directory and files

### **New Utility Files:**
- `lib/courses.js` - Course logic
- `lib/coaching.js` - Coaching session logic
- `lib/certificates.js` - Certificate generation

---

## PART 3: DETAILED MIGRATION CHECKLIST

### Phase 1: Configuration & Data (Week 1)
- [ ] Update `config/settings.json` with Heba Planet branding
- [ ] Update `config/menu.json` with new navigation
- [ ] Update `config/settingsSchema.json` with new fields
- [ ] Update `locales/en.json` with educational terminology
- [ ] Create Italian translations in `locales/it.json`
- [ ] Update `lib/testdata.js` with sample educational products
- [ ] Create sample admin user and test customers
- [ ] Create sample courses and coaching products

### Phase 2: Core Business Logic (Week 2)
- [ ] Update `lib/common.js` with helper functions
- [ ] Update `lib/cart.js` for product type handling
- [ ] Verify `lib/auth.js` works with new roles
- [ ] Update `lib/indexing.js` for new search fields
- [ ] Create `lib/courses.js` - Course enrollment management
- [ ] Create `lib/coaching.js` - Coaching session management
- [ ] Create new schema files for validation

### Phase 3: Routes & Controllers (Week 2-3)
- [ ] Update `routes/index.js` for new product types
- [ ] Update `routes/product.js` for admin product management
- [ ] Update `routes/order.js` for fulfillment handling
- [ ] Update `routes/customer.js` for customer experience
- [ ] Update `routes/admin.js` for dashboard & settings
- [ ] Update `routes/user.js` for user management
- [ ] Verify `routes/reviews.js` for educational reviews
- [ ] Verify `routes/transactions.js` still works

### Phase 4: Frontend Templates (Week 3-4)
- [ ] Update layout templates (header, footer)
- [ ] Update product detail template
- [ ] Update product listing template
- [ ] Create new course detail template
- [ ] Create new coaching session template
- [ ] Update cart/checkout templates
- [ ] Update admin dashboard template
- [ ] Update admin settings templates
- [ ] Create CMS pages for educational content
- [ ] Update error & login templates

### Phase 5: Styling & Assets (Week 4)
- [ ] Update color scheme in stylesheets
- [ ] Add new component styles
- [ ] Create educational-themed logo
- [ ] Add product category icons
- [ ] Update admin dashboard styling
- [ ] Test responsive design on mobile
- [ ] Optimize image sizes
- [ ] Minify CSS & JS

### Phase 6: Testing & QA (Week 4-5)
- [ ] Functional testing: Product creation/update/delete
- [ ] Functional testing: Cart operations
- [ ] Functional testing: Course enrollment
- [ ] Functional testing: Coaching session booking
- [ ] Functional testing: All payment gateways
- [ ] Security testing: Admin login, API keys
- [ ] Performance testing: Load times, database queries
- [ ] Cross-browser testing: Chrome, Firefox, Safari, Edge
- [ ] Mobile testing: Responsive design
- [ ] Email testing: Confirmations, notifications

### Phase 7: Deployment (Week 5)
- [ ] Update production environment variables
- [ ] Run database migrations (if needed)
- [ ] Deploy to staging
- [ ] Smoke testing on staging
- [ ] Deploy to production
- [ ] Monitor for errors/issues
- [ ] Send announcement email to customers (if migration)

---

## PART 4: RISK ASSESSMENT & MITIGATION

### Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Payment gateway disruption** | Critical | Test all gateways before deployment; have fallback payment method |
| **Data loss** | Critical | Backup database before migration; test restore procedure |
| **Customer account loss** | High | Migrate customer data carefully; verify with sample |
| **Cart/order data corruption** | High | Run data validation after migration; test checkout flow |
| **Performance degradation** | Medium | Profile database queries; optimize indexes; load testing |
| **Browser incompatibility** | Medium | Cross-browser testing; progressive enhancement |
| **Email delivery issues** | Medium | Test email system; whitelist sender domain; use reliable SMTP |
| **Mobile UX issues** | Medium | Test on multiple devices; use responsive framework |

### Mitigation Strategies

1. **Backup & Recovery:**
   - Full database backup before starting
   - Daily backups during migration
   - Test restore from backup

2. **Testing:**
   - Comprehensive testing checklist
   - Staging environment mirrors production
   - User acceptance testing

3. **Rollback Plan:**
   - Keep old codebase running during migration
   - DNS failover capability
   - 30-day monitoring period

4. **Communication:**
   - Notify customers of changes
   - Provide customer support during transition
   - Clear documentation for admins

---

## CONCLUSION

This migration plan transforms ExpressCart into "Heba Planet" while preserving all critical functionality. The modular approach allows for phased implementation and testing at each stage.

**Total Effort Estimate:** 5 weeks (with team of 2-3 developers)
**Files Modified:** 68
**New Files Created:** 12+
**Testing Duration:** 2-3 weeks

**Key Success Factors:**
1. ✅ Preserve all existing payment gateways
2. ✅ Maintain data integrity
3. ✅ Comprehensive testing before launch
4. ✅ Staged rollout to production
5. ✅ Clear documentation for admin users

---

*End of Migration Analysis Document*
