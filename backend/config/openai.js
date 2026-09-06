const OpenAI = require('openai');

// Configure OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = openai;
