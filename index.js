const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yapm2yx.mongodb.net/word_learning?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const wordsCollection = client.db("word_learning").collection("words");

    // Root route
    app.get('/', (req, res) => {
      res.send('Word learning server running');
    });

    // GET all words
    app.get('/words', async (req, res) => {
      try {
        const words = await wordsCollection.find({}).toArray();
        res.json(words);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch words", details: err.message });
      }
    });

    // GET word by ID
    app.get('/words/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const word = await wordsCollection.findOne({ _id: new ObjectId(id) });
        if (!word) return res.status(404).json({ error: "Word not found" });
        res.json(word);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch word", details: err.message });
      }
    });

    // POST a new word
    app.post('/words', async (req, res) => {
      try {
        const newWord = req.body;
        if (!newWord.word || !newWord.meaning) {
          return res.status(400).json({ error: "Word and meaning are required" });
        }
        const result = await wordsCollection.insertOne(newWord);
        res.json({ ...newWord, _id: result.insertedId });
      } catch (err) {
        res.status(500).json({ error: "Failed to add word", details: err.message });
      }
    });

    // PUT /words/:id (replace word)
    app.put('/words/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const replacementWord = { ...req.body };
        delete replacementWord._id;

        const result = await wordsCollection.findOneAndReplace(
          { _id: new ObjectId(id) },
          replacementWord,
          { returnDocument: 'after' }
        );

        if (!result.value) return res.status(404).json({ message: "No matching word found" });
        res.json(result.value);
      } catch (err) {
        res.status(500).json({ error: "Failed to replace word", details: err.message });
      }
    });

    // DELETE /words/:id
    app.delete('/words/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await wordsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "Word not found" });
        res.json({ message: "Word deleted successfully" });
      } catch (err) {
        res.status(500).json({ error: "Failed to delete word", details: err.message });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Word learning server running on port ${port}`);
    });

  } catch (err) {
    console.error("MongoDB connection failed", err);
  }
}

run().catch(err => console.error(err));
