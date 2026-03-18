const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Your Anthropic API key lives here — set it as an environment variable
// Never hardcode it in this file
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ERROR: ANTHROPIC_API_KEY environment variable is not set.');
  console.error('   Set it with: export ANTHROPIC_API_KEY=your-key-here');
  console.error('   Or add it to your .env file or Vercel environment variables.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Serve lesson HTML files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint — lessons call /api/lumi instead of Anthropic directly
app.post('/api/lumi', async (req, res) => {
  try {
    const { model, max_tokens, system, messages } = req.body;

    // Basic validation
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: 'Invalid request: messages array required' } });
    }
    if (messages.length > 50) {
      return res.status(400).json({ error: { message: 'Conversation too long' } });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-6',
        max_tokens: Math.min(max_tokens || 500, 800), // cap at 800 for safety
        system: system || '',
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: { message: 'Server error — please try again' } });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Luminary Lumi proxy is running 🦋' });
});

app.listen(PORT, () => {
  console.log(`🦋 Luminary Lumi proxy running on http://localhost:${PORT}`);
  console.log(`📚 Lessons available at:`);
  console.log(`   http://localhost:${PORT}/maths-fractions.html`);
  console.log(`   http://localhost:${PORT}/history-egyptians.html`);
});
