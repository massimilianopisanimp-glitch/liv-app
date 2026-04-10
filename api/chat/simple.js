import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, system } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messaggi non validi' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key Anthropic non configurata' })
  }

  try {
    const opts = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }
    const trimmedSys = system?.trim()
    if (trimmedSys) opts.system = trimmedSys

    const message = await client.messages.create(opts)
    res.json({ text: message.content[0]?.text || '' })
  } catch (error) {
    console.error('Errore /api/chat/simple:', error.message)
    res.status(500).json({ error: error.message })
  }
}
