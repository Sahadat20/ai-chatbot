

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const {GoogleGenerativeAI} = require('@google/generative-ai')
const {GoogleGenAI } = require('@google/genai')


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenAI({});

// Simple chatbot route
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

        const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
    });
    console.log(response.text);

    const responseText = response.text;
    res.json({ reply: responseText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// const PORT = process.env.PORT || 5000;
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
