const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@geniouscarmechanics.uz2bo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

async function run() {
    try {
        await client.connect();
        console.log('connected')
        const database = client.db("XiaomiMobileStore");
        const MobilesCollection = database.collection("mobiles");
        const ReviewsCollection = database.collection("reviews");
        const OrdersCollection = database.collection("orders")
        const UsersCollection = database.collection("users");

        //Get Mobile API
        app.get('/mobiles', async (req, res) => {
            const cursor = MobilesCollection.find({});
            const mobile = await cursor.toArray();
            res.send(mobile);
        });
        // get limited Mobile Api
        app.get('/mobiles/home', async (req, res) => {
            const cursor = MobilesCollection.find({}).limit(6);
            const mobile = await cursor.toArray();
            res.send(mobile);
        });
        //Post Mobiles API
        app.post('/mobiles', async (req, res) => {
            const mobiles = req.body;
            console.log("🚀 ~ file: index.js ~ line 29 ~ app.post ~ mobiles", mobiles)
            console.log('hit api');


            const result = await MobilesCollection.insertOne(mobiles);
            console.log("🚀 ~ file: index.js ~ line 34 ~ app.post ~ result", result);

            res.json(result);
        });

        //Delete Single API 
        app.delete('/mobiles/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await MobilesCollection.deleteOne(query);
            res.json(result);

        });


        //GET Single API 
        app.get('/buymobile/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const singlemobile = await MobilesCollection.findOne(query);
            res.json(singlemobile);
        });

        //Add odders
        app.post("/addorder", async (req, res) => {
            console.log(req.body);
            const result = await OrdersCollection.insertOne(req.body);
            res.send(result);
        });


        // Get Order
        app.get("/orders", async (req, res) => {
            const result = await OrdersCollection.find({}).toArray();
            res.send(result);
            console.log(result);
        });
        // Delete order
        app.delete("/deleteOrder/:id", async (req, res) => {
            console.log(req.params.id);
            const result = await OrdersCollection.deleteOne({
                _id: ObjectId(req.params.id),
            });
            res.send(result);
        });
        //Get my Order


        app.get("/myorder", async (req, res) => {
            const email = req.query.email;
            const query = { email: email }

            const cursor = OrdersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
        });
        //Update Order Status
        app.put('/updateOrder/:id', async (req, res) => {
            const order = req.body;
            const options = { upsert: true };
            const updatedOrder = {
                $set: { status: order.status }
            };
            const updateStatus = await OrdersCollection.updateOne({ _id: ObjectId(req.params.id) }, updatedOrder, options);

            res.json(updateStatus);
        });

        //Get Reviews API
        app.get('/reviews', async (req, res) => {
            const cursor = ReviewsCollection.find({});
            const review = await cursor.toArray();
            res.send(review);
        });
        //Post Reviews API
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            console.log("🚀 ~ file: index.js ~ line 29 ~ app.post ~ reviews", reviews)
            console.log('hit api');


            const result = await ReviewsCollection.insertOne(reviews);
            console.log("🚀 ~ file: index.js ~ line 34 ~ app.post ~ result", result);

            res.json(result);
        });


        //Get Reviews API
        app.get('/users', async (req, res) => {
            const cursor = UsersCollection.find({});
            const user = await cursor.toArray();
            res.send(user);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await UsersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await UsersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await UsersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            console.log("🚀 ~ file: index.js ~ line 182 ~ app.put ~ req.body", req.headers)

            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await UsersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await UsersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        })





    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir)


//Server Root Directory
app.get('/', (req, res) => {
    res.send(' Running Server Root Directory');
});
// Server Port Listening
app.listen(port, () => {
    console.log(`Server Listening The Port`, port);
});