# Express Cart Shop (Customized)

This repository is a heavily customized and production-hardened version of the [Express Cart](https://github.com/mrvautin/expressCart) shopping cart platform.

## Detailed Log of Customizations & Enhancements

This project has been heavily modified to fit a specific deployment and business requirement. Below are all the specific details of what was implemented:

### 1. Database Configuration & Migration
- **MongoDB Atlas Integration**: Transitioned the application to use a fully managed cloud MongoDB database (MongoDB Atlas) rather than a local instance. 
- Created and utilized specific migration scripts (e.g., `migrate-compass-to-atlas.js`) to move data safely from a local Compass/development environment into the production Atlas cluster.
- Implemented connection testing scripts (`test-db-connection.js`) to verify database integrity before launching.

### 2. Payment Gateway Integrations
Configured and integrated multiple payment gateways to provide flexible checkout options for customers. The active/available payment methods include:
- **Stripe**: For seamless, secure credit card processing.
- **PayPal**: For standard PayPal account transactions.
- **Paymob / Instapay**: Integrated region-specific payment methods.
- **Cash on Delivery (COD)**: Configured offline/manual payment workflows.
- *(Other supported options initialized in the codebase: Adyen, Authorize.net, Blockonomics, Instore, Payway, Verifone, and Zip).*

### 3. Production Readiness & Security hardening
- **Environment Variables**: Completely removed sensitive credentials (like `MONGODB_URI`, `sk_live` Stripe keys, and session secrets) from the source code. Moved them into a secure, `.gitignore`-protected `.env.production` file.
- **Git History Cleansing**: Wiped the local git commit history and started an orphaned `production-clean` branch to guarantee that no past commits could leak payment secrets or admin passwords onto GitHub.
- **Process Management**: Created a robust `ecosystem.config.js` to deploy and manage the Node.js application securely using **PM2**, ensuring it automatically restarts if it crashes and handles logging efficiently.
- **Data Reset Tooling**: Added a `reset.js` script to securely clear out test orders/data before moving the shop to a live production state.

### 4. UI, Design & Theme Adjustments
- **Cloth Theme Customization**: Overhauled the frontend appearance, specifically targeting the active "Cloth" theme.
- **Layout & CSS Fixes**: Fixed broken layouts (such as on the login and checkout pages) by modifying Handlebars templates (`.hbs`) and writing custom Less/CSS rules.
- **Minification**: Ensured that any custom styles added to `style.css` and `admin.css` were properly minified into `style.min.css` so the application loads as fast as possible in production.
- **Responsive Design**: Polished the mobile and desktop views to ensure a premium user experience across all devices.

## Deployment Setup

To run this application in a production environment:

1. Clone this repository.
2. Run `npm install` to install all dependencies.
3. Create a `.env.production` file in the root directory and add your exact production credentials:
   ```ini
   NODE_ENV=production
   PORT=1111
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
   SESSION_SECRET=<your_secure_secret>
   ```
4. Start the application using PM2:
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

## Local Development

If you wish to test locally:
1. Copy `.env.example` to `.env` and fill in local development values.
2. Start the dev server:
   ```bash
   npm run dev
   ```

---
*Created and maintained as a production-hardened fork for Yasmine-1402.*
