import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messaggi non validi' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key non configurata' })
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: 'Rispondi SOLO con JSON valido. Nessun testo.',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
    res.json({ text: message.content[0]?.text || '' })
  } catch (error) {
    console.error('Errore /api/extract:', error.message)
    res.status(500).json({ error: error.message })
  }
}
