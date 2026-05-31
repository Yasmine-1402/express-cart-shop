const express = require('express');
const { indexOrders } = require('../indexing');
const { getId, sendEmail, getEmailTemplate } = require('../common');
const { getPaymentConfig } = require('../config');
const { emptyCart } = require('../cart');
const router = express.Router();

// The homepage of the site
router.post('/checkout_action', async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const paymentConfig = getPaymentConfig('instapay');

    const orderDoc = {
        orderPaymentId: getId(),
        orderPaymentGateway: 'Instapay',
        orderPaymentMessage: `<div class="text-center mt-3 mb-4">
    <div style="font-size:48px; margin-bottom:15px;">💸</div>
    <h4 style="color:var(--hp-primary-dark); font-weight:700;">Instapay Transfer Required</h4>
    <p style="font-size:16px; margin-bottom:20px;">Please transfer the total amount of <strong>${config.currencySymbol}${req.session.totalCartNetAmount}</strong> to our Instapay account to confirm your order.</p>
    <div style="background:#f8f9fa; border:2px dashed #ccc; border-radius:12px; padding:15px; margin-bottom:20px;">
        <span style="font-size:14px; color:#666;">Instapay Username:</span><br>
        <strong style="font-size:20px; user-select:all;">heba.hassan14@instapay</strong>
    </div>
    <a href="https://ipn.eg/S/heba.hassan14/instapay/7MzaVY" target="_blank" class="btn btn-primary btn-lg" style="width:100%; border-radius:50px; font-weight:700; font-size:18px;">
        Pay Now with Instapay
    </a>
</div>`,
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
        orderStatus: paymentConfig.orderStatus,
        orderDate: new Date(),
        orderProducts: req.session.cart,
        orderType: 'Single'
    };

    // insert order into DB
    try{
        const newDoc = await db.orders.insertOne(orderDoc);

        // get the new ID
        const newId = newDoc.insertedId;

        // add to lunr index
        indexOrders(req.app)
        .then(() => {
            // set the results
            req.session.messageType = 'success';
            req.session.message = `<div class="text-center mt-3 mb-4">
    <div style="font-size:48px; margin-bottom:15px;">💸</div>
    <h4 style="color:var(--hp-primary-dark); font-weight:700;">Instapay Transfer Required</h4>
    <p style="font-size:16px; margin-bottom:20px;">Please transfer the total amount of <strong>${config.currencySymbol}${req.session.totalCartNetAmount}</strong> to our Instapay account to confirm your order.</p>
    <div style="background:#f8f9fa; border:2px dashed #ccc; border-radius:12px; padding:15px; margin-bottom:20px;">
        <span style="font-size:14px; color:#666;">Instapay Username:</span><br>
        <strong style="font-size:20px; user-select:all;">heba.hassan14@instapay</strong>
    </div>
    <a href="https://ipn.eg/S/heba.hassan14/instapay/7MzaVY" target="_blank" class="btn btn-primary btn-lg" style="width:100%; border-radius:50px; font-weight:700; font-size:18px;">
        Pay Now with Instapay
    </a>
</div>`;
            req.session.paymentEmailAddr = orderDoc.orderEmail;
            req.session.paymentApproved = true;
            req.session.paymentDetails = `<p><strong>Order ID: </strong>${newId}</p>
            <p><strong>Transaction ID: </strong>${orderDoc.orderPaymentId}</p>`;

            // set payment results for email
            const paymentResults = {
                message: req.session.message,
                messageType: req.session.messageType,
                paymentEmailAddr: req.session.paymentEmailAddr,
                paymentApproved: true,
                paymentDetails: req.session.paymentDetails
            };

            // clear the cart
            if(req.session.cart){
                emptyCart(req, res, 'function');
            }

            // send the email with the response
            // TODO: Should fix this to properly handle result
            sendEmail(req.session.paymentEmailAddr, `Your order with ${config.cartTitle}`, getEmailTemplate(paymentResults));

            // Return outcome
            res.json({ paymentId: newId });
        });
    }catch(ex){
        res.status(400).json({ err: 'Your order declined. Please try again' });
    }
});

module.exports = router;
