const colors = require('colors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const async = require('async');
const nodemailer = require('nodemailer');
const sanitizeHtml = require('sanitize-html');
const stripHtml = require('string-strip-html');
const mkdirp = require('mkdirp');
const ObjectId = require('mongodb').ObjectId;
const countryList = require('countries-list');
const {
    getConfig,
    getPaymentConfig,
    updateConfig
} = require('./config');

// Parse country list once
const countryArray = [];
const countryCodes = {};
Object.keys(countryList.countries).forEach((country) => {
    const countryName = countryList.countries[country].name;
    countryArray.push(countryName);
    countryCodes[countryName] = {
        code: country
    };
});

// Allowed mime types for product images
const allowedMimeType = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
];

const fileSizeLimit = 10485760;

// common functions

// Removes HTML from string
const sanitize = (string) => {
    return stripHtml(string);
};

// Ensures HTML is safe
const cleanHtml = (string) => {
    return sanitizeHtml(string);
};

const mongoSanitize = (param) => {
    if(param instanceof Object){
        for(const key in param){
            if(/^\$/.test(key)){
                delete param[key];
            }
        }
    }
    return param;
};

const safeParseInt = (param) => {
    if(param){
        try{
            return parseInt(param);
        }catch(ex){
            return param;
        }
    }else{
        return param;
    }
};

const checkboxBool = (param) => {
    if(param && param === 'on'){
        return true;
    }
    if(param && param === 'true'){
        return true;
    }
    return false;
};

const convertBool = (value) => {
    if(value === 'true' || value === true){
        return true;
    }
    return false;
};

// adds products to sitemap.xml
const addSitemapProducts = (req, res, cb) => {
    const db = req.app.db;

    const config = getConfig();
    const hostname = config.baseUrl;

    db.products.find({ productPublished: true }).toArray((err, products) => {
        const posts = [];
        if(err){
            cb(null, posts);
        }
        async.eachSeries(products, (item, callback) => {
            const post = {};
            let url = item._id;
            if(item.productPermalink){
                url = item.productPermalink;
            }
            post.url = `${hostname}/product/${url}`;
            post.changefreq = 'weekly';
            post.priority = 0.7;
            posts.push(post);
            callback(null, posts);
        }, () => {
            cb(null, posts);
        });
    });
};

const clearSessionValue = (session, sessionVar) => {
    let temp;
    if(session){
        temp = session[sessionVar];
        session[sessionVar] = null;
    }
    return temp;
};

const checkDirectorySync = (directory) => {
    try{
        fs.statSync(directory);
    }catch(e){
        try{
            fs.mkdirSync(directory);
        }catch(err){
           mkdirp.sync(directory);// error : directory & sub directories to be newly created
        }
    }
};

const getThemes = () => {
    return fs.readdirSync(path.join(__dirname, '../', 'views', 'themes')).filter(file => fs.statSync(path.join(path.join(__dirname, '../', 'views', 'themes'), file)).isDirectory());
};

const getImages = async (id, req, res, callback) => {
    const db = req.app.db;

    const product = await db.products.findOne({ _id: getId(id) });
    if(!product){
        return [];
    }

    // loop files in /public/uploads/
    const files = await glob.sync(`public/uploads/${product._id.toString()}/**`, { nosort: true });

    // sort array
    files.sort();

    // declare the array of objects
    const fileList = [];

    // loop these files
    for(let i = 0; i < files.length; i++){
        // only want files
        if(fs.lstatSync(files[i]).isDirectory() === false){
            // declare the file object and set its values
            const file = {
                id: i,
                path: files[i].substring(6)
            };
            if(product.productImage === files[i].substring(6)){
                file.productImage = true;
            }
            // push the file object into the array
            fileList.push(file);
        }
    }

    // Check for URL images and add
    if(product.productImages){
        for(let i = 0; i < product.productImages.length; i++){
            const file = {
                id: fileList.length + 1,
                path: product.productImages[i]
            };
            if(product.productImage === product.productImages[i]){
                file.productImage = true;
            }
            fileList.push(file);
        }
    }

    return fileList;
};

// Minimal, dependency-free email template updater (avoids cheerio runtime issues)
const escapeHtml = (unsafe) => {
    if(unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const setInnerHtmlById = (html, id, content) => {
    const re = new RegExp('(<[^>]+id=["\']' + id + '["\'][^>]*>)([\\s\\S]*?)(<\\/[^>]+>)', 'i');
    if(re.test(html)){
        return html.replace(re, (m, open, old, close) => open + content + close);
    }
    return html;
};

const addClassToId = (html, id, className) => {
    const re = new RegExp('(<[^>]*id=["\']' + id + '["\'][^>]*)(>)', 'i');
    return html.replace(re, (m, before, close) => {
        if(/class=["']/.test(before)){
            return before.replace(/class=["']([^"']*)["']/, (mm, cls) => `class="${cls} ${className}"`) + close;
        }
        return before + ` class="${className}"` + close;
    });
};

const getEmailTemplate = (result) => {
    const config = getConfig();

    let template = fs.readFileSync(path.join(__dirname, '../public/email_template.html'), 'utf8');

    template = setInnerHtmlById(template, 'brand', escapeHtml(config.cartTitle || ''));
    template = setInnerHtmlById(template, 'paymentResult', escapeHtml(result && result.message ? result.message : ''));
    if(result && result.paymentApproved === true){
        template = addClassToId(template, 'paymentResult', 'text-success');
    }else{
        template = addClassToId(template, 'paymentResult', 'text-danger');
    }
    template = setInnerHtmlById(template, 'paymentMessage', 'Thanks for shopping with us. We hope you will shop with us again soon.');
    template = setInnerHtmlById(template, 'paymentDetails', result && result.paymentDetails ? result.paymentDetails : '');

    return template;
};

const sendEmail = (to, subject, body) => {
    const config = getConfig();

    const emailSettings = {
        host: config.emailHost,
        port: config.emailPort,
        secure: config.emailSecure,
        auth: {
            user: config.emailUser,
            pass: config.emailPassword
        }
    };

    // outlook needs this setting
    if(config.emailHost === 'smtp-mail.outlook.com'){
        emailSettings.tls = { ciphers: 'SSLv3' };
    }

    const transporter = nodemailer.createTransport(emailSettings);

    const mailOptions = {
        from: config.emailAddress, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        html: body// html body
    };

    return new Promise((resolve) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                console.error(colors.red('Email send error:'), error);
                return resolve(false);
            }
            return resolve(true);
        });
    });
};

// Escapes string for use in RegExp
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// gets the correct type of index ID
const getId = (id) => {
    if(id){
        if(id.length !== 24){
            return id;
        }
    }
    return new ObjectId(id);
};

const newId = () => {
    return new ObjectId();
};

const hooker = (order) => {
    const config = getConfig();

    return axios.post(config.orderHook, order, { responseType: 'application/json' })
    .then((response) => {
        if(response.status === 200){
            console.info('Successfully called order hook');
        }
    })
    .catch((err) => {
        console.log('Error calling hook:', err);
    });
};

const getCountryList = () => {
    return countryArray;
};

const getCountryNameToCode = (name) => {
    return countryCodes[name];
};

const cleanAmount = (amount) => {
    if(amount){
        return parseInt(amount.toString().replace('.', ''));
    }
    return amount;
};

const clearCustomer = (req) => {
    // Clear our session
    req.session.customerCompany = null;
    req.session.customerPresent = null;
    req.session.customerEmail = null;
    req.session.customerFirstname = null;
    req.session.customerLastname = null;
    req.session.customerAddress1 = null;
    req.session.customerAddress2 = null;
    req.session.customerCountry = null;
    req.session.customerState = null;
    req.session.customerPostcode = null;
    req.session.customerPhone = null;
    req.session.orderComment = null;
};

module.exports = {
    allowedMimeType,
    fileSizeLimit,
    sanitize,
    cleanHtml,
    mongoSanitize,
    safeParseInt,
    checkboxBool,
    convertBool,
    addSitemapProducts,
    clearSessionValue,
    checkDirectorySync,
    getThemes,
    getImages,
    getConfig,
    getPaymentConfig,
    updateConfig,
    getEmailTemplate,
    sendEmail,
    getId,
    newId,
    hooker,
    getCountryList,
    cleanAmount,
    clearCustomer,
    getCountryNameToCode,
    escapeRegex
};
