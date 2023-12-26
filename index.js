const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Middleware for API key validation
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers.api_key;
  if (!apiKey) {
    return res.status(401).send('Error: provide an api_key');
  }
  next();
};

app.get('/gemini', validateApiKey, async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Error: Prompt is missing');
  }

  try {
    const genAI = new GoogleGenerativeAI(req.headers.api_key);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response || 'Unable to fetch content';
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal server error');
  }
});

app.use(bodyParser.json());

app.post('/gemini-vision', validateApiKey, async (req, res) => {
  const { image, prompt, mime_type: mime } = req.body;

  if (!image || !prompt || !mime) {
    return res.status(400).send('Base64 image data, prompt, and MIME type are required.');
  }

  try {
    const genAI = new GoogleGenerativeAI(req.headers.api_key);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    const data = {
      inlineData: {
        data: image,
        mimeType: mime,
      },
    };
    const result = await model.generateContent([prompt, data]);
    const response = {
      text: result.response.text(),
    };
    res.status(200).send(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal server error');
  }
});

app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
