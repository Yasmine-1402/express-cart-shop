const express = require('express');
const axios = require('axios');
const { indexOrders, indexTransactions } = require('../indexing');
const { getId, sendEmail, getEmailTemplate } = require('../common');
const { getPaymentConfig } = require('../config');
const { emptyCart } = require('../cart');
const crypto = require('crypto');
const router = express.Router();

router.post('/checkout_action', async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const paymobConfig = getPaymentConfig('paymob');

    // Allow environment variable overrides for secrets
    paymobConfig.apiKey = paymobConfig.apiKey || process.env.PAYMOB_API_KEY || '';
    paymobConfig.integrationId = paymobConfig.integrationId || process.env.PAYMOB_INTEGRATION_ID || '';
    paymobConfig.iframeId = paymobConfig.iframeId || process.env.PAYMOB_IFRAME_ID || '';
    paymobConfig.hmacSecret = paymobConfig.hmacSecret || process.env.PAYMOB_HMAC_SECRET || '';

    // Make sure cart is not empty
    if(!req.session.cart){
        res.status(400).json({ error: 'The are no items in your cart.' });
        return;
    }

    try {
        // Step 1: Authentication
        const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
            api_key: paymobConfig.apiKey
        });
        const authToken = authResponse.data.token;

        // Extract items for Paymob
        const paymobItems = [];
        for(const itemKey of Object.keys(req.session.cart)) {
            const item = req.session.cart[itemKey];
            paymobItems.push({
                name: item.title,
                amount_cents: Math.round(item.totalItemPrice * 100).toString(),
                description: item.title,
                quantity: item.quantity.toString()
            });
        }

        // Step 2: Order Registration
        const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: Math.round(req.session.totalCartNetAmount * 100).toString(),
            currency: "EGP",
            items: paymobItems
        });
        const paymobOrderId = orderResponse.data.id;

        // Build customer data
        const billingData = {
            apartment: "NA",
            email: req.session.customerEmail || "no-email@example.com",
            floor: "NA",
            first_name: req.session.customerFirstname || "Customer",
            street: req.session.customerAddress1 || "NA",
            building: "NA",
            phone_number: req.session.customerPhone || "NA",
            shipping_method: "NA",
            postal_code: req.session.customerPostcode || "NA",
            city: req.session.customerState || "NA",
            country: "EG",
            last_name: req.session.customerLastname || "Customer",
            state: req.session.customerState || "NA"
        };

        // Step 3: Payment Key Request
        const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
            auth_token: authToken,
            amount_cents: Math.round(req.session.totalCartNetAmount * 100).toString(),
            expiration: 3600,
            order_id: paymobOrderId.toString(),
            billing_data: billingData,
            currency: "EGP",
            integration_id: paymobConfig.integrationId
        });
        const paymentToken = paymentKeyResponse.data.token;

        // Save order to DB first as Pending
        const orderDoc = {
            orderPaymentId: paymobOrderId.toString(),
            orderPaymentGateway: 'Paymob',
            orderPaymentMessage: 'Initiated Paymob transaction',
            orderTotal: req.session.totalCartNetAmount,
            orderShipping: 0,
            orderItemCount: req.session.totalCartItems,
            orderProductCount: req.session.totalCartProducts,
            orderCustomer: getId(req.session.customerId),
            orderEmail: req.session.customerEmail,
            orderCompany: req.session.customerCompany,
            orderFirstname: req.session.customerFirstname,
            orderLastname: req.session.customerLastname,
            orderAddr1: req.session.customerAddress1,
            orderAddr2: req.session.customerAddress2,
            orderCountry: req.session.customerCountry,
            orderState: req.session.customerState,
            orderPostcode: req.session.customerPostcode,
            orderPhoneNumber: req.session.customerPhone,
            orderComment: req.session.orderComment,
            orderStatus: 'Pending',
            orderDate: new Date(),
            orderProducts: req.session.cart,
            orderType: 'Single'
        };

        const newDoc = await db.orders.insertOne(orderDoc);
        const newId = newDoc.insertedId;
        
        req.session.orderId = newId;

        // Step 4: Return Iframe URL
        const redirectUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymobConfig.iframeId}?payment_token=${paymentToken}`;
        
        res.status(200).json({ redirectUrl: redirectUrl });
    } catch (err) {
        console.error('Paymob Setup Error:', err.message);
        if (err.response) {
            console.error(err.response.data);
        }
        res.status(400).send({
            message: 'Failed to connect to Paymob. Please check your Paymob keys or try another payment method.'
        });
    }
});

// Callback for Paymob after iframe completion
router.get('/checkout_return', async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const paymobConfig = getPaymentConfig('paymob');
    paymobConfig.hmacSecret = paymobConfig.hmacSecret || process.env.PAYMOB_HMAC_SECRET || '';
    
    const queryParams = req.query;
    
    // HMAC Validation
    const hmacKeys = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success'
    ];
    
    let concatenatedString = '';
    hmacKeys.forEach(key => {
        if(queryParams[key] !== undefined) {
            concatenatedString += queryParams[key];
        }
    });

    const hmacSecret = paymobConfig.hmacSecret;
    const hashedString = crypto.createHmac('sha512', hmacSecret).update(concatenatedString).digest('hex');

    if (hashedString !== queryParams.hmac) {
        console.error('Paymob HMAC verification failed.');
        req.session.messageType = 'danger';
        req.session.message = 'Payment verification failed.';
        res.redirect(`/`);
        return;
    }

    const isSuccess = queryParams.success === 'true';
    const paymobOrderId = queryParams.order;
    const transactionId = queryParams.id;
    const amountCents = parseInt(queryParams.amount_cents, 10);
    
    // Find our order
    const order = await db.orders.findOne({ orderPaymentId: paymobOrderId });
    if (!order) {
        console.error('Paymob Order not found:', paymobOrderId);
        res.redirect('/');
        return;
    }

    // Idempotency: skip if already processed
    if (order.orderStatus === 'Paid' || order.orderStatus === 'Declined') {
        req.session.messageType = order.orderStatus === 'Paid' ? 'success' : 'danger';
        req.session.message = `Payment was already ${order.orderStatus}`;
        if(order.orderStatus === 'Paid' && req.session.cart) {
            emptyCart(req, res, 'function');
        }
        res.redirect(`/payment/${order._id}`);
        return;
    }

    // Amount verification
    if (Math.round(order.orderTotal * 100) !== amountCents) {
        console.error('Paymob amount mismatch:', amountCents, 'Expected:', Math.round(order.orderTotal * 100));
        req.session.messageType = 'danger';
        req.session.message = 'Payment verification failed (Amount mismatch).';
        res.redirect('/');
        return;
    }

    let paymentApproved = isSuccess;
    let paymentMessage = isSuccess ? 'Succeeded' : 'Declined by Paymob';
    let paymentStatus = isSuccess ? 'Paid' : 'Declined';
    
    // Create transaction record
    const transaction = await db.transactions.insertOne({
        gateway: 'paymob',
        gatewayReference: transactionId,
        gatewayMessage: paymentMessage,
        approved: paymentApproved,
        amount: order.orderTotal,
        currency: 'EGP',
        customer: order.orderCustomer,
        created: new Date(),
        order: order._id
    });

    await indexTransactions(req.app);

    // Update order
    await db.orders.updateOne({ _id: order._id }, { 
        $set: { 
            orderStatus: paymentStatus, 
            transaction: transaction.insertedId,
            orderPaymentMessage: paymentMessage
        } 
    });

    await indexOrders(req.app);

    // Set session details for display
    req.session.messageType = isSuccess ? 'success' : 'danger';
    req.session.message = paymentMessage;
    req.session.paymentApproved = paymentApproved;
    req.session.paymentDetails = `<p><strong>Order ID: </strong>${order._id}</p><p><strong>Transaction ID: </strong>${transactionId}</p>`;

    if(isSuccess && req.session.cart) {
        emptyCart(req, res, 'function');
    }

    res.redirect(`/payment/${order._id}`);
});

// Webhook for Paymob POST requests
router.post('/webhook', async (req, res, next) => {
    const db = req.app.db;
    const paymobConfig = getPaymentConfig('paymob');
    paymobConfig.hmacSecret = paymobConfig.hmacSecret || process.env.PAYMOB_HMAC_SECRET || '';

    const queryParams = req.query;
    const body = req.body;

    if (!body || !body.obj) {
        return res.status(400).send('Invalid webhook payload');
    }

    const obj = body.obj;

    // HMAC Validation
    const hmacKeys = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order.id',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success'
    ];

    let concatenatedString = '';
    hmacKeys.forEach(key => {
        const parts = key.split('.');
        let val = obj;
        parts.forEach(p => { val = val ? val[p] : undefined; });
        if (val !== undefined && val !== null) {
            // boolean values must be converted to string 'true' or 'false'
            concatenatedString += (typeof val === 'boolean') ? val.toString() : val;
        }
    });

    const hmacSecret = paymobConfig.hmacSecret;
    const hashedString = crypto.createHmac('sha512', hmacSecret).update(concatenatedString).digest('hex');

    if (hashedString !== queryParams.hmac) {
        console.error('Paymob Webhook HMAC verification failed.');
        return res.status(401).send('HMAC Verification Failed');
    }

    const isSuccess = obj.success === true || obj.success === 'true';
    const paymobOrderId = obj.order && obj.order.id ? obj.order.id.toString() : null;
    const transactionId = obj.id ? obj.id.toString() : null;
    const amountCents = parseInt(obj.amount_cents, 10);

    // Find our order
    const order = await db.orders.findOne({ orderPaymentId: paymobOrderId });
    if (!order) {
        console.error('Paymob Webhook Order not found:', paymobOrderId);
        return res.status(404).send('Order not found');
    }

    // Idempotency: skip if already processed
    if (order.orderStatus === 'Paid' || order.orderStatus === 'Declined') {
        return res.status(200).send('Already processed');
    }

    // Amount verification
    if (Math.round(order.orderTotal * 100) !== amountCents) {
        console.error('Paymob Webhook amount mismatch:', amountCents, 'Expected:', Math.round(order.orderTotal * 100));
        return res.status(400).send('Amount mismatch');
    }

    let paymentApproved = isSuccess;
    let paymentMessage = isSuccess ? 'Succeeded' : 'Declined by Paymob';
    let paymentStatus = isSuccess ? 'Paid' : 'Declined';

    // Create transaction record
    const transaction = await db.transactions.insertOne({
        gateway: 'paymob',
        gatewayReference: transactionId,
        gatewayMessage: paymentMessage,
        approved: paymentApproved,
        amount: order.orderTotal,
        currency: 'EGP',
        customer: order.orderCustomer,
        created: new Date(),
        order: order._id
    });

    await indexTransactions(req.app);

    // Update order
    await db.orders.updateOne({ _id: order._id }, { 
        $set: { 
            orderStatus: paymentStatus, 
            transaction: transaction.insertedId,
            orderPaymentMessage: paymentMessage
        } 
    });

    await indexOrders(req.app);

    res.status(200).send('Webhook processed successfully');
});

module.exports = router;
