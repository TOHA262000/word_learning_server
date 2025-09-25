const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yapm2yx.mongodb.net/?retryWrites=true&w=majority`;

// Cache client for Vercel serverless
let cachedClient = null;
async function connectToDB() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  cachedClient = client;
  return cachedClient;
}

// Root route
app.get('/', (req, res) => {
  res.send('Word learning server running');
});

// GET all words
app.get('/words', async (req, res) => {
  try {
    const client = await connectToDB();
    const words = await client.db("word_learning").collection("words").find({}).toArray();
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch words", details: err.message });
  }
});

// POST a new word
app.post('/words', async (req, res) => {
  try {
    const client = await connectToDB();
    const newWord = req.body;
    const result = await client.db("word_learning").collection("words").insertOne(newWord);
    res.json({ ...newWord, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add word", details: err.message });
  }
});

// DELETE a word by ID
app.delete('/words/:id', async (req, res) => {
  try {
    const client = await connectToDB();
    const id = req.params.id;
    const result = await client.db("word_learning").collection("words").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Word not found" });
    res.json({ message: "Word deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete word", details: err.message });
  }
});

// PUT /words/:id
app.put('/words/:id', async (req, res) => {
  try {
    const client = await connectToDB();
    const { id } = req.params;
    const replacementWord = { ...req.body };
    delete replacementWord._id;

    const result = await client.db("word_learning").collection("words")
      .findOneAndReplace({ _id: new ObjectId(id) }, replacementWord, { returnDocument: 'after' });

    if (!result.value) return res.status(404).json({ message: "No matching word found" });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: "Failed to replace word", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Word learning server running on port ${port}`);
});