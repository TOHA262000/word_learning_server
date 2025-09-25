const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Word learning server runnign')
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yapm2yx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const userCollection = client.db("word_learning").collection("words");

        // GET all words
        app.get('/words', async (req, res) => {
            const words = await userCollection.find({}).toArray(); // fetch all documents
            res.send(words);
        });

        // POST a new word
        app.post('/words', async (req, res) => {
            const newWord = req.body; // expect {word, type, meaning, synonyms, examples}
            try {
                const result = await userCollection.insertOne(newWord);
                res.send({ ...newWord, _id: result.insertedId }); // return the inserted document
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to add word" });
            }
        });

        // DELETE a word by ID
        app.delete('/words/:id', async (req, res) => {
            const id = req.params.id;
            const { ObjectId } = require('mongodb');
            try {
                const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) {
                    return res.status(404).send({ error: "Word not found" });
                }
                res.send({ message: "Word deleted successfully" });
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to delete word" });
            }
        });
        // Replace a word info by ID     
        app.put('/words/:id', async (req, res) => {
            const { id } = req.params;
            const replacementWord = { ...req.body };
            delete replacementWord._id; // important

            try {
                const result = await userCollection.findOneAndReplace(
                    { _id: new ObjectId(id) },   // Make sure ObjectId conversion
                    replacementWord,
                    { returnDocument: 'after', upsert: false } // don't create if not found
                );

                // Handle the case when no document matches
                if (!result.value) {
                    // Optionally: return 200 with a message instead of 404
                    return res.status(200).send({
                        message: "No matching word found, nothing replaced",
                        replacementWord
                    });
                }

                res.send(result.value); // send the replaced document
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to replace word", message: err.message });
            }
        });


    }
    finally {

    }
}
run().catch(err => console.log(err));