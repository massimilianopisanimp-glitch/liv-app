import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Carica .env manualmente (compatibilità ESM)
try {
  const envPath = resolve(__dirname, '../.env')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim()
    }
  })
} catch {
  // .env non trovato, usa variabili d'ambiente di sistema
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Sei Aria, un'assistente di supporto emotivo per l'app "Liv".
Il tuo scopo è aiutare le persone che attraversano momenti difficili nelle loro relazioni sentimentali.

LINEE GUIDA FONDAMENTALI:
- Parla sempre in italiano, con un tono caldo, empatico e non giudicante
- NON sei un terapeuta, uno psicologo, né un medico
- NON fare diagnosi cliniche di alcun tipo
- Aiuta l'utente a riflettere sui propri stati emotivi senza dire loro cosa devono fare
- Fai domande aperte per incoraggiare la riflessione interiore
- Valida sempre i sentimenti dell'utente ("È comprensibile che tu ti senta così...")
- Mantieni le risposte concise: 2-3 paragrafi al massimo
- Se l'utente sembra in crisi o parla di farsi del male, suggerisci con delicatezza di contattare un professionista o il numero di emergenza 112
- Se menzioni risorse, suggerisci di cercare uno psicologo o uno psicoterapeuta
- Non dare consigli diretti ("Dovresti fare X"), ma aiuta l'utente a trovare le proprie risposte
- Usa il "tu" informale per creare vicinanza

STILE:
- Inizia spesso con il riconoscimento del sentimento prima di qualsiasi altra cosa
- Usa frasi come "Ti sento", "Capisco quanto possa essere difficile", "Grazie per condividere questo con me"
- Evita il gergo clinico o i tecnicismi
- Sii presente e autentico, non artificioso

Ricorda: sei uno spazio sicuro per riflettere, non un sostituto della cura professionale.`

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messaggi non validi' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key Anthropic non configurata. Aggiungi ANTHROPIC_API_KEY nel file .env' })
  }

  try {
    // Streaming response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('Errore Anthropic:', error.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Errore nella comunicazione con il chatbot. Riprova.' })
    }
  }
})

// Endpoint non-streaming: usato da tutte le schermate tranne la chat principale
app.post('/api/chat/simple', async (req, res) => {
  const { messages, system } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messaggi non validi' })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key non configurata' })
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
})

app.listen(PORT, () => {
  console.log(`Server Liv avviato su http://localhost:${PORT}`)
})
