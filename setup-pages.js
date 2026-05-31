/**
 * Setup Script: Create About and Contact Pages
 * 
 * This script creates the About and Contact pages in MongoDB Atlas
 * Run with: node setup-pages.js
 */

const MongoClient = require('mongodb').MongoClient;
const colors = require('colors');

const ATLAS_URL = process.env.MONGO_URI || 'mongodb+srv://yshehata047_db_user:HebaPlanet123@heba-planet.f27o9jq.mongodb.net/heba-planet';

const pages = [
    {
        pageSlug: 'about',
        pageName: 'About Us',
        pageTitle: 'About Heba Planet',
        pageDescription: 'Learn about Heba Planet - Your trusted source for educational resources',
        pageContent: `
<div class="about-container">
    <h1>About Heba Planet</h1>
    <p>Welcome to Heba Planet, your premier destination for educational resources and coaching services.</p>
    
    <h2>Our Mission</h2>
    <p>At Heba Planet, we are dedicated to providing high-quality educational content including:</p>
    <ul>
        <li>📚 Books and learning materials</li>
        <li>🎮 Interactive educational games</li>
        <li>📖 Comprehensive courses</li>
        <li>👨‍🏫 Professional coaching sessions</li>
        <li>✨ Exclusive bundles and packages</li>
    </ul>
    
    <h2>Why Choose Us?</h2>
    <p>We believe in the power of education to transform lives. Our carefully curated collection of resources is designed to support learners of all levels.</p>
    
    <h2>Connect With Us</h2>
    <p>Follow us on social media to stay updated with our latest offerings:</p>
    <div class="social-links">
        <a href="https://www.facebook.com/Heba.Hassan1402" target="_blank" class="social-link facebook">
            <i class="fab fa-facebook"></i> Facebook
        </a>
        <a href="https://www.instagram.com/hebahassan6305/" target="_blank" class="social-link instagram">
            <i class="fab fa-instagram"></i> Instagram
        </a>
    </div>
</div>
        `,
        pageEnabled: 'true',
        pageOrder: 1
    },
    {
        pageSlug: 'contact',
        pageName: 'Contact Us',
        pageTitle: 'Contact Heba Planet',
        pageDescription: 'Get in touch with our team',
        pageContent: `
<div class="contact-container">
    <h1>Contact Us</h1>
    <p>Have questions or feedback? We'd love to hear from you! Please fill out the form below and we'll get back to you as soon as possible.</p>
    
    <form id="contactForm" class="contact-form">
        <div class="form-group">
            <label for="contactName">Name *</label>
            <input type="text" id="contactName" name="name" required placeholder="Your full name">
        </div>
        
        <div class="form-group">
            <label for="contactEmail">Email *</label>
            <input type="email" id="contactEmail" name="email" required placeholder="your@email.com">
        </div>
        
        <div class="form-group">
            <label for="contactPhone">Phone</label>
            <input type="tel" id="contactPhone" name="phone" placeholder="Your phone number">
        </div>
        
        <div class="form-group">
            <label for="contactSubject">Subject *</label>
            <input type="text" id="contactSubject" name="subject" required placeholder="What is this about?">
        </div>
        
        <div class="form-group">
            <label for="contactMessage">Message *</label>
            <textarea id="contactMessage" name="message" rows="6" required placeholder="Your message here..."></textarea>
        </div>
        
        <button type="submit" class="btn btn-primary">Send Message</button>
    </form>
    
    <div id="contactResponse" class="contact-response" style="display:none;"></div>
</div>

<script>
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value
    };
    
    try {
        const response = await fetch('/contact/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        const responseDiv = document.getElementById('contactResponse');
        
        if (result.success) {
            responseDiv.className = 'contact-response alert alert-success';
            responseDiv.textContent = 'Thank you for your message! We will get back to you soon.';
            document.getElementById('contactForm').reset();
        } else {
            responseDiv.className = 'contact-response alert alert-danger';
            responseDiv.textContent = 'Error sending message: ' + (result.error || 'Unknown error');
        }
        responseDiv.style.display = 'block';
    } catch (error) {
        const responseDiv = document.getElementById('contactResponse');
        responseDiv.className = 'contact-response alert alert-danger';
        responseDiv.textContent = 'Error sending message: ' + error.message;
        responseDiv.style.display = 'block';
    }
});
</script>
        `,
        pageEnabled: 'true',
        pageOrder: 2
    }
];

async function setupPages() {
    let client;
    try {
        console.log(colors.cyan('\n🚀 Setting up About and Contact pages...\n'));
        
        // Connect to Atlas
        console.log(colors.yellow('📍 Connecting to MongoDB Atlas...'));
        client = new MongoClient(ATLAS_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        await client.connect();
        const db = client.db('heba-planet');
        console.log(colors.green('✓ Connected to Atlas\n'));
        
        // Insert pages
        console.log(colors.yellow('📝 Creating pages...'));
        for (const page of pages) {
            // Check if page already exists
            const existingPage = await db.collection('pages').findOne({ pageSlug: page.pageSlug });
            
            if (existingPage) {
                console.log(colors.yellow(`  ⚠ Page "${page.pageName}" already exists. Updating...`));
                await db.collection('pages').updateOne(
                    { pageSlug: page.pageSlug },
                    { $set: page }
                );
            } else {
                console.log(colors.yellow(`  ➕ Creating page "${page.pageName}"...`));
                await db.collection('pages').insertOne(page);
            }
        }
        
        console.log(colors.green('✓ Pages created successfully!\n'));
        
        // List all pages
        console.log(colors.cyan('📋 All pages in database:'));
        const allPages = await db.collection('pages').find({}).toArray();
        allPages.forEach((p, index) => {
            console.log(`  ${index + 1}. ${colors.cyan(p.pageName)} (${p.pageSlug}) - ${p.pageEnabled === 'true' ? colors.green('enabled') : colors.red('disabled')}`);
        });
        
        console.log(colors.green('\n✓ Setup completed successfully!\n'));
        console.log(colors.cyan('📌 Access your pages at:'));
        console.log(`  http://localhost:1111/about`);
        console.log(`  http://localhost:1111/contact\n`);
        
    } catch (error) {
        console.error(colors.red('\n❌ Error during setup:'), error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

setupPages();
