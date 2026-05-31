# Express Cart Shop (Customized)

This repository is a customized version of the [Express Cart](https://github.com/mrvautin/expressCart) shopping cart platform, specifically prepared for production deployment.

## Recent Customizations & Enhancements

The following major updates and preparations have been made to this project:

1. **Production Readiness & Security**
   - **Environment Variables**: Moved sensitive credentials, such as MongoDB connection strings and payment secrets, into a secure, `.gitignore`-protected `.env.production` file.
   - **Git History Cleansing**: Completely scrubbed the local git history to ensure no payment credentials or sensitive configuration files are leaked in the public repository.
   - **Deployment Ready**: Configured `ecosystem.config.js` to support robust, production-ready process management using PM2.

2. **UI & Design Updates**
   - Implemented extensive design customizations specifically for the **Cloth** theme.
   - Restored and refined CSS styling for improved layout, color coordination, and mobile responsiveness.
   - Re-compiled and minified all stylesheets to optimize load times for production.

3. **Backend Adjustments**
   - Added custom utility scripts (like `reset.js`) for easier environment management.
   - Hardened `app.js` and server configurations for production mode, ensuring development logs and stack traces are suppressed.

## Deployment Setup

To run this application in a production environment:

1. Clone this repository.
2. Run `npm install` to install all dependencies.
3. Create a `.env.production` file in the root directory and add your credentials (e.g., `MONGODB_URI`, `PORT`, `SESSION_SECRET`).
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
