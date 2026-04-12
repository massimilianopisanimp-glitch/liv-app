import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { conversation } = req.body
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: 'Rispondi SOLO con un oggetto JSON valido. Nessun testo prima o dopo. Nessun markdown.',
      messages: [{ role: 'user', content: `Analizza questa conversazione ed estrai: {"emotion":"emozione prevalente","intensity":numero 1-10,"area":"area di vita","temi":["tema1","tema2"],"insight":"frase breve"}. Emozioni: Ansia,Paura,Tristezza,Rabbia,Vergogna,Colpa,Frustrazione,Vuoto,Confusione,Noia,Eccitazione,Serenità,Speranza,Altro. Aree: Lavoro,Relazioni,Famiglia,Sociale,Futuro,Salute,Studio,Altro.\n\nConversazione:\n${conversation}` }]
    })
    res.status(200).json({ result: msg.content[0].text })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
