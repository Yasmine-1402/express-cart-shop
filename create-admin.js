const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URI || "mongodb+srv://yshehata047_db_user:HebaPlanet123@heba-planet.f27o9jq.mongodb.net/";

MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    if (err) {
        console.error("Connection error:", err);
        return;
    }
    const db = client.db('heba-planet');
    const adminPassword = process.env.ADMIN_PASSWORD || 'HebaPlanet123!';
    const doc = {
        usersName: 'Admin',
        userEmail: process.env.ADMIN_EMAIL || 'admin@hebaplanet.com',
        userPassword: bcrypt.hashSync(adminPassword, 10),
        isAdmin: true,
        isOwner: true
    };
    db.collection('users').insertOne(doc, function(err, res) {
        if (err) {
            console.error("Insert error:", err);
        } else {
            console.log("Admin user created successfully!");
        }
        client.close();
    });
});
