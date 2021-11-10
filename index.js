const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@geniouscarmechanics.uz2bo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//Server Root Directory
app.get('/', (req, res) => {
    res.send(' Running Server Root Directory');
});
// Server Port Listening
app.listen(port, () => {
    console.log(`Server Listening The Port`, port);
});