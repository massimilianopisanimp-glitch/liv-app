import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'

/* ─── PALETTE ──────────────────────────────────────────────────────────── */
const C = {
  bg:       '#ffffff',
  card:     '#FFFFFF',
  border:   'rgba(0,0,0,.07)',
  text:     '#2D2D2D',
  muted:    'rgba(45,45,45,.45)',
  faint:    'rgba(45,45,45,.06)',
  accent:   '#6B9080', accentRgb: '107,144,128', accentDim: 'rgba(107,144,128,.10)',
  purple:   '#6B9080', purpleDim: 'rgba(107,144,128,.10)',
  teal:     '#6B9080', tealDim:   'rgba(107,144,128,.10)',
  amber:    '#8B9070', amberDim:  'rgba(139,144,112,.13)',
  rose:     '#906B6B', roseDim:   'rgba(144,107,107,.10)',
  barBg:    '#EDECEA',
  tabBarBg: '#ffffff',
}

/* ─── ACCENT HELPERS ───────────────────────────────────────────────────── */
function hexToRgb(hex) {
  const h = hex.replace('#','')
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  return `${r},${g},${b}`
}
function applyAccent(hex) {
  const rgb = hexToRgb(hex)
  C.accent = hex; C.accentRgb = rgb; C.accentDim = `rgba(${rgb},.10)`
  C.purple = hex; C.purpleDim = `rgba(${rgb},.10)`
  C.teal   = hex; C.tealDim   = `rgba(${rgb},.10)`
  document.documentElement.style.setProperty('--c-accent', hex)
  document.documentElement.style.setProperty('--c-accent-dim', `rgba(${rgb},.10)`)
  document.documentElement.style.setProperty('--accent', hex)
  document.documentElement.style.setProperty('--accent-rgb', rgb)
}

/* ─── COSTANTI ─────────────────────────────────────────────────────────── */
const EMOTIONS = ['Ansia','Paura','Tristezza','Rabbia','Vergogna','Colpa','Frustrazione','Vuoto','Confusione','Noia','Eccitazione','Serenità','Speranza','Altro']
const AREAS = [
  {id:'lavoro',l:'Lavoro',e:'💼'},{id:'relazioni',l:'Relazioni',e:'❤️'},
  {id:'famiglia',l:'Famiglia',e:'🏠'},{id:'sociale',l:'Sociale',e:'👥'},
  {id:'futuro',l:'Futuro',e:'🔮'},{id:'salute',l:'Salute',e:'⚡'},
  {id:'studio',l:'Studio',e:'🧠'},{id:'altro',l:'Altro',e:'✨'},
]
const A_SECS = [
  {t:'Stato emotivo',max:18,q:['Mi sono sentito/a in tensione o agitato/a','Ho avuto difficoltà a rilassarmi','Mi sono sentito/a giù di morale','Ho provato poco interesse o piacere','Mi sono sentito/a sopraffatto/a','Ho avuto sbalzi emotivi intensi']},
  {t:'Pensieri ricorrenti',max:15,q:['Ripenso spesso al passato','Immagino scenari negativi futuri','Mi giudico duramente','Ho pensieri difficili da interrompere','Mi preoccupo eccessivamente']},
  {t:'Relazioni',max:15,q:["Temo il rifiuto o l'abbandono","Fatico a fidarmi","Evito i conflitti","Mi chiudo quando mi sento ferito/a","Mi sento dipendente dall'approvazione"]},
  {t:'Funzionamento',max:15,q:['Sonno disturbato','Difficoltà di concentrazione','Stanchezza persistente','Impatto su lavoro/studio','Impatto sulle relazioni']},
  {t:'Regolazione emotiva',max:12,q:['Fatico a calmarmi','Evito situazioni difficili','Reagisco impulsivamente','Fatico a identificare ciò che provo']},
]
const A_LIFE = ['Relazione sentimentale','Amicizie','Famiglia','Lavoro / Studio','Situazione economica','Salute fisica','Tempo libero','Autostima','Ambiente in cui vivo']
const SAFETY = [/voglio morire/i,/suicid/i,/farmi del male/i,/uccidere/i]

/* ─── SYSTEM PROMPTS ───────────────────────────────────────────────────── */

const SYS_CHAT = `Sei Liv, un'intelligenza artificiale. Non sei uno psicologo, non sei un terapeuta — sei uno strumento di ascolto e riflessione. Puoi commettere errori e non sostituisci un professionista.

CHI SEI:
Sei come un amico con una buona formazione psicologica. Conosci l'utente nel tempo — ricordi le sue storie, i suoi pattern, le situazioni di cui ha parlato. Quando ti ritrovi con lui, ti interessi genuinamente a come sono andate le cose. Non sei formale, non sei clinico. Sei presente, curioso, caldo.
Il tuo compito non è risolvere i problemi dell'utente — è accompagnarlo nel capire se stesso meglio. Ogni persona ha già le risorse per stare meglio: il tuo ruolo è aiutarla a trovarle, non dargliele tu.

IL TUO OBIETTIVO PRINCIPALE:
Aiutare l'utente a dare un nome preciso alle emozioni che sta provando e a capirle meglio. Molte persone sanno che stanno male ma non sanno cosa sentono esattamente. Il tuo compito è accompagnarle in questa esplorazione.

FLUSSO DELLA CONVERSAZIONE:

1. APERTURA CON IL NUMERO
Ricevi un numero da 1 a 10. Usalo come punto di partenza con una risposta breve e genuina. Poi, se hai conversazioni precedenti, chiedi degli sviluppi in modo naturale — come farebbe un amico: 'L'ultima volta mi hai parlato di X — com'è andata alla fine?' oppure 'Ti ricordo un po' giù la settimana scorsa per Y — come stai rispetto a quello?'

2. ESPLORAZIONE DELL'EMOZIONE
Non dare nomi tu per primo — guida l'utente a trovarli. 'Come descriveresti questa sensazione?' 'È più vicina alla tristezza o alla frustrazione?' 'Dove la senti nel corpo?' Quando trova un nome, esplora: 'Quanto è forte da 1 a 10?' 'Ce ne sono altre sotto?'

3. APPROFONDIMENTO
Esplora il contesto con curiosità genuina. Cosa ha scatenato questa emozione? È una situazione nuova o un pattern che conosce? Cosa dice di ciò che è importante per lui?

4. RISTRUTTURAZIONE COGNITIVA
Quando emerge un pensiero rigido o catastrofico ('non valgo niente', 'non cambierà mai', 'sono sempre così'), guidalo gentilmente:
- 'Cosa ti fa pensare che sia così?'
- 'Ci sono momenti in cui non è stato vero?'
- 'Se un tuo amico ti dicesse la stessa cosa di sé stesso, cosa gli risponderesti?'
Non imporre prospettive alternative — accompagna l'utente a trovarle da solo.

5. SCRITTURA RIFLESSIVA GUIDATA
Quando emerge un tema significativo, proponi: 'Ti va di provare una cosa? Scrivi per 5 minuti su questo: [prompt personalizzato e specifico basato su quello che è emerso]. Non ci sono risposte giuste.' Quando l'utente condivide, rispecchia senza analizzare — rifletti i temi che emergono, fai una domanda aperta.

6. CHIUSURA
Verso la fine, offri una piccola riflessione su quello che è emerso: 'Oggi hai nominato per la prima volta X — mi sembra importante.' oppure 'Noto che ogni volta che parli di Y, emerge anche Z.' Non analizzare — osservare.

COME USARE IL CONTESTO DELLE CONVERSAZIONI PRECEDENTI:
Usalo per fare domande genuine e specifiche su come si sono risolte le situazioni precedenti. Non riepilogare — chiedi. 'Hai poi parlato con quella persona?' 'Com'è andata con il lavoro?' 'Stai ancora pensando a quella cosa che mi hai detto?' Trattalo come un amico che ricorda, non come un database che recupera dati.

STILE:
- Tono caldo, curioso, diretto — come un amico con formazione psicologica
- Una domanda per messaggio, mai di più
- Risposte brevi: 2-3 frasi massimo
- Mai diagnosi, mai etichette cliniche, mai consigli diretti
- Mai 'dovresti' o 'devi'
- Usa sempre 'tu'
- Mai emoji
- Varia il linguaggio — non ripetere sempre le stesse frasi

SICUREZZA:
Se l'utente esprime pensieri suicidari o autolesionismo:
→ 'Quello che mi stai dicendo è importante. Ti chiedo di contattare il Telefono Amico al 02 2327 2327 o il 112. Non sei solo/a.'
→ Non continuare la conversazione normale.

DISCLAIMER — primo messaggio:
Ricorda sempre all'utente nel primo messaggio che sei un'intelligenza artificiale e non sostituisci un professionista della salute mentale.`

const SYS_INSIGHT = `Analizza questa conversazione e rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo prima o dopo. Formato esatto: {"temi":["tema1","tema2"],"insight":"frase riassuntiva in italiano","domanda_riflessiva":"domanda in italiano","emotion":"emozione prevalente","intensity":7,"area":"area di vita"}. Emozioni valide: Ansia, Paura, Tristezza, Rabbia, Vergogna, Colpa, Frustrazione, Vuoto, Confusione, Noia, Eccitazione, Serenità, Speranza, Altro. Aree valide: Lavoro, Relazioni, Famiglia, Sociale, Futuro, Salute, Studio, Altro. Se non ci sono dati sufficienti restituisci: {"temi":[],"insight":null,"domanda_riflessiva":null,"emotion":null,"intensity":null,"area":null}`

const SYS_AUTO_CHECKIN = `Analizza questa conversazione e restituisci SOLO un oggetto JSON valido, senza testo aggiuntivo, senza markdown, senza backtick.
Formato: {"emotion":"EMOZIONE","intensity":N,"area":"AREA"}
- emotion: scegli UNA tra [Ansia, Paura, Tristezza, Rabbia, Vergogna, Colpa, Frustrazione, Vuoto, Confusione, Noia, Eccitazione, Serenità, Speranza, Altro]
- intensity: numero intero da 1 a 10 (intensità emotiva complessiva della conversazione)
- area: scegli UNA tra [Lavoro, Relazioni, Famiglia, Sociale, Futuro, Salute, Studio, Altro]
Rispondi SOLO con il JSON, nessun altro testo.`

const SYS_FINDER_BASE = `Sei un assistente AI che aiuta le persone a trovare il tipo di professionista della salute mentale più adatto a loro. Non sei uno psicologo, non sei un terapeuta — sei uno strumento informativo. Puoi commettere errori e le tue indicazioni non sostituiscono una valutazione professionale.

PROFESSIONISTI CHE CONOSCI:
- Psicologo clinico
- Psicoterapeuta cognitivo-comportamentale (CBT)
- Psicoterapeuta sistemico-relazionale
- Sessuologo
- Psicoterapeuta psicodinamico
- EMDR specialist
- Psicoterapeuta della Gestalt

COME LAVORI:
1. Inizia presentandoti con esattamente queste parole: "Sono un assistente AI — non sono un professionista della salute mentale e posso commettere errori. Sono qui per aiutarti a capire quale tipo di supporto professionale potrebbe fare al caso tuo. Le mie indicazioni non sostituiscono una valutazione clinica."
2. Fai 3-4 domande mirate e personalizzate sui bisogni dell'utente. Usa i dati che hai già (check-in, conversazioni) per non chiedere cose che conosci già.
3. Dopo le risposte, consiglia il professionista più adatto spiegando perché.
4. Descrivi cosa fa concretamente quel professionista in seduta e cosa aspettarsi.
5. Chiudi sempre con: "Ricorda che questa è solo un'indicazione generale. Un primo colloquio con un professionista è il modo migliore per capire se è la scelta giusta per te."

STILE:
- Tono caldo e chiaro, mai clinico
- Una domanda per messaggio
- Mai diagnosi o etichette
- Risposte brevi e dirette
- Usa sempre "tu"

SICUREZZA:
Se l'utente esprime pensieri suicidari o autolesionismo:
→ "Quello che mi stai dicendo è importante. Ti chiedo di contattare il Telefono Amico al 02 2327 2327 o il 112. Non sei solo/a."
→ Non continuare la conversazione normale.`

const SYS_REPORT = `Sei Liv. Scrivi un report psicologico mensile: 4-5 frasi, caldo, non clinico, in italiano.
Evidenzia le aree di maggiore impatto e chiudi con una domanda riflessiva.`

const SYS_PROFILE = `Sei Liv, un'intelligenza artificiale. Analizza i dati di check-in dell'umore e i temi delle conversazioni dell'utente e restituisci SOLO un oggetto JSON valido, senza testo aggiuntivo, senza markdown, senza backtick.

Formato richiesto:
{"schemi":["stringa 1","stringa 2","stringa 3"],"sintesi":"2-3 frasi calde","domanda":"una domanda riflessiva personalizzata"}

REGOLE:
- "schemi": array di massimo 3 pattern cognitivi/emotivi ricorrenti che emergono dai dati. Linguaggio caldo, concreto, in prima persona (es. "Tendi a sentirti sopraffatto/a quando..."). Mai diagnosi, mai etichette cliniche.
- "sintesi": 2-3 frasi che descrivono il periodo emotivo dell'utente in modo caldo e non giudicante.
- "domanda": una sola domanda riflessiva personalizzata basata sugli schemi identificati.
- Se i dati sono insufficienti (meno di 3 check-in): {"schemi":[],"sintesi":null,"domanda":null}
- Rispondi SOLO con il JSON, nessun altro testo.`

/* ─── PROCESSED CHAT IDS (per evitare doppi auto check-in) ─────────────── */
function getProcessedChatIds() {
  try { return new Set(JSON.parse(localStorage.getItem('liv_ci_processed') || '[]')) } catch { return new Set() }
}
function markChatProcessed(chatId) {
  const s = getProcessedChatIds(); s.add(String(chatId))
  try { localStorage.setItem('liv_ci_processed', JSON.stringify([...s])) } catch {}
}

/* ─── STORAGE (localStorage) ───────────────────────────────────────────── */
function useStore(k, init) {
  const key = 'liv_' + k
  const [v, sv] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init } catch { return init }
  })
  const set = useCallback(val => {
    const n = typeof val === 'function' ? val(v) : val
    sv(n)
    try { localStorage.setItem(key, JSON.stringify(n)) } catch {}
  }, [key, v])
  return [v, set]
}

/* ─── API ──────────────────────────────────────────────────────────────── */
async function callAI(msgs, sys, model) {
  const r = await fetch('/api/chat/simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: msgs, system: sys, ...(model ? { model } : {}) }),
  })
  const d = await r.json()
  if (d.error) throw new Error(d.error)
  return d.text || 'Riprova tra un momento.'
}

async function streamAI(msgs, sys, onChunk) {
  const r = await fetch('/api/chat/simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: msgs, system: sys, stream: true }),
  })
  if (!r.ok) throw new Error('Errore server')
  const reader = r.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.text) onChunk(parsed.text)
      } catch (e) { if (e.message !== 'Unexpected token') throw e }
    }
  }
}

/* ─── LOGO ─────────────────────────────────────────────────────────────── */
function Logo({ size = 28 }) {
  return (
    <img src="/logo.png" alt="Liv" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, userSelect: 'none' }} />
  )
}

function LogoAnimated({ size = 36, thinking = false }) {
  return (
    <img src="/logo.png" alt="Liv"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0,
        animation: thinking ? 'pulse-logo 1.4s ease-in-out infinite' : 'none' }} />
  )
}

/* ─── MOOD BULB ────────────────────────────────────────────────────────── */
function MoodBulb({ mood }) {
  const pct = mood / 10
  const themeRgb = C.accentRgb
  const yellowRgb = '255,220,100'
  const grayRgb = '140,140,140'
  function brighten(rgb, a) {
    const [r, g, b] = rgb.split(',').map(Number)
    const br = c => Math.min(255, Math.round(c + (255 - c) * a))
    return `${br(r)},${br(g)},${br(b)}`
  }
  function mix(rgb1, rgb2, a) {
    const [r1,g1,b1] = rgb1.split(',').map(Number)
    const [r2,g2,b2] = rgb2.split(',').map(Number)
    return `${Math.round(r1+(r2-r1)*a)},${Math.round(g1+(g2-g1)*a)},${Math.round(b1+(b2-b1)*a)}`
  }
  const bright = brighten(themeRgb, 0.7)
  const distFrom50 = Math.abs(mood - 6) / 6
  const isAbove = mood >= 6
  const mixed = mix(bright, isAbove ? yellowRgb : grayRgb, distFrom50)
  const bulbMain = `rgb(${mixed})`
  const glowOp = isAbove ? distFrom50 * 0.5 : 0
  const glowC = `rgba(${mixed},${glowOp})`
  const glowR = 50 + pct * 60
  const eyeLx = 46, eyeRx = 66, eyeY = 58
  const eyeRyL = mood < 1.5 ? 2 : mood < 3 ? 3 : mood < 5 ? 4 : mood < 7 ? 4.5 : 1
  const eyeRxL = mood < 1.5 ? 3 : mood < 3 ? 3.5 : mood < 5 ? 4 : 4.5
  const sparkR = (mood < 2 || mood >= 7.5) ? 0 : 1 + pct * 1.5
  const sparkOp = (mood < 2 || mood >= 7.5) ? 0 : 0.85
  const happyEyeL = `M${eyeLx-5} ${eyeY+1} Q${eyeLx} ${eyeY-5} ${eyeLx+5} ${eyeY+1}`
  const happyEyeR = `M${eyeRx-5} ${eyeY+1} Q${eyeRx} ${eyeY-5} ${eyeRx+5} ${eyeY+1}`
  const mouthPath = mood < 1.5 ? 'M42 72 Q56 67 70 72'
    : mood < 3 ? 'M43 71 Q56 71 69 71'
    : mood < 5 ? 'M43 70 Q56 74 69 70'
    : mood < 7 ? 'M41 69 Q56 76 71 69'
    : 'M39 68 Q56 79 73 68'
  const fc = '#2d2520'
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 140, height: 155 }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-55%)', width: glowR, height: glowR, borderRadius: '50%', background: `radial-gradient(circle,${glowC} 0%,transparent 70%)`, transition: 'all .6s ease', pointerEvents: 'none' }} />
      <svg width="125" height="150" viewBox="0 0 120 145" fill="none" style={{ overflow: 'visible', transition: 'filter .5s', filter: mood > 6 ? `drop-shadow(0 0 ${6+pct*16}px rgba(${mixed},0.4))` : 'none' }}>
        <defs>
          <radialGradient id="mbGlow" cx="38%" cy="35%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="60%" stopColor={bulbMain} />
            <stop offset="100%" stopColor={bulbMain} />
          </radialGradient>
          <radialGradient id="mbShine" cx="35%" cy="28%" r="35%">
            <stop offset="0%" stopColor="white" stopOpacity={.3+pct*.3} />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="108" rx="18" ry="4" fill="#8a8a8a" opacity={0.1+pct*0.15} style={{ transition: 'all .5s' }} />
        <ellipse cx="60" cy="55" rx="44" ry="46" fill="url(#mbGlow)" style={{ transition: 'fill .5s' }} />
        <ellipse cx="60" cy="55" rx="44" ry="46" fill="url(#mbShine)" />
        {mood >= 7.5 ? <>
          <path d={happyEyeL} stroke={fc} strokeWidth="2.8" strokeLinecap="round" fill="none" style={{ transition: 'all .45s' }} />
          <path d={happyEyeR} stroke={fc} strokeWidth="2.8" strokeLinecap="round" fill="none" style={{ transition: 'all .45s' }} />
        </> : <>
          <ellipse cx={eyeLx} cy={eyeY} rx={eyeRxL} ry={eyeRyL} fill={fc} style={{ transition: 'all .45s' }} />
          <ellipse cx={eyeRx} cy={eyeY} rx={eyeRxL} ry={eyeRyL} fill={fc} style={{ transition: 'all .45s' }} />
          {mood >= 2 && mood < 7.5 && <>
            <circle cx={eyeLx+1.8} cy={eyeY-1.5} r={sparkR} fill="white" opacity={sparkOp} style={{ transition: 'all .4s' }} />
            <circle cx={eyeRx+1.8} cy={eyeY-1.5} r={sparkR} fill="white" opacity={sparkOp} style={{ transition: 'all .4s' }} />
          </>}
        </>}
        <path d={mouthPath} stroke={fc} strokeWidth="2.5" strokeLinecap="round" fill="none" style={{ transition: 'd .45s' }} />
      </svg>
    </div>
  )
}

/* ─── UI PRIMITIVES ────────────────────────────────────────────────────── */
function Ico({ n, sz = 22, c = 'currentColor' }) {
  const p = { width: sz, height: sz, flexShrink: 0 }
  if (n === 'home')     return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  if (n === 'pulse')    return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  if (n === 'chat')     return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
  if (n === 'clip')     return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
  if (n === 'search')   return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  if (n === 'back')     return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  if (n === 'book')     return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  if (n === 'send')     return <svg {...p} viewBox="0 0 24 24" fill={c}><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
  if (n === 'ok')       return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  if (n === 'shield')   return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  if (n === 'settings') return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  if (n === 'chart')    return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
  if (n === 'profile')  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
  if (n === 'logout')   return <svg {...p} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
  return null
}

function Btn({ children, onClick, disabled, variant = 'primary', style: s = {} }) {
  const base = { width: '100%', padding: '16px 20px', borderRadius: 16, border: 'none', fontSize: 16, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', transition: 'all .2s', ...s }
  const vars = {
    primary: { background: disabled ? C.faint : C.accent,  color: disabled ? 'rgba(0,0,0,.2)' : '#fff' },
    ghost:   { background: C.faint, color: C.muted },
    grad:    { background: disabled ? C.faint : C.accent,  color: disabled ? 'rgba(0,0,0,.2)' : '#fff' },
    amber:   { background: disabled ? C.faint : C.amber,   color: disabled ? 'rgba(0,0,0,.2)' : '#fff' },
    danger:  { background: 'rgba(144,107,107,.12)', color: C.rose, border: `1px solid rgba(144,107,107,.2)` },
  }
  return <button className="tap" onClick={!disabled ? onClick : undefined} style={{ ...base, ...vars[variant] }}>{children}</button>
}

function Card({ children, style: s = {} }) {
  return <div style={{ background: C.card, borderRadius: 20, padding: '18px 20px', border: `1px solid ${C.border}`, ...s }}>{children}</div>
}

/* ─── ONBOARDING ───────────────────────────────────────────────────────── */
function Onboarding({ done }) {
  const [phase, setPhase] = useState('intro')
  const [slide, setSlide] = useState(0)
  const [legal, setLegal] = useState(false)
  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('')

  const FOCUSES = [
    { id: 'ansia',    emoji: '🌊', label: 'Ansia e stress',      desc: 'Pensieri che non si spengono' },
    { id: 'lavoro',   emoji: '💼', label: 'Lavoro e performance', desc: 'Pressione, burnout, equilibrio' },
    { id: 'relazioni',emoji: '❤️', label: 'Relazioni',            desc: 'Connessione, conflitti, solitudine' },
    { id: 'crescita', emoji: '🌱', label: 'Crescita personale',   desc: 'Capire me stesso meglio' },
  ]
  const slides = [
    { title: 'Ciao, sono Liv.', body: 'Il tuo spazio privato per capire cosa ti succede dentro.\nTraccia emozioni, schemi e pensieri — senza giudicarti, mai.', icon: <Logo size={120}/> },
    { title: 'Come funziona', body: 'Ogni giorno o quando preferisci fai un check-in veloce.\nParla con Liv quando ne hai bisogno.\nUna volta al mese, fai il check-up completo per vedere come stai davvero.', icon: <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.tealDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico n="pulse" sz={36} c={C.teal}/></div> },
    { title: 'Non è terapia.', body: 'Liv non sostituisce uno psicologo.\nSe stai attraversando un momento difficile, siamo qui per aiutarti a trovare il giusto tipo di percorso psicologico.', icon: <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.roseDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico n="shield" sz={36} c={C.rose}/></div> },
    { isLegal: true },
  ]
  const phaseToIdx = { intro: slide, name: 4, profile: 5, focus: 6 }
  const curDot = phaseToIdx[phase] ?? 0

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle,rgba(${C.accentRgb},.06) 0%,transparent 70%)`, pointerEvents: 'none' }} />

      {/* dots progress */}
      <div style={{ paddingTop: 52, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 1, flexShrink: 0 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ width: i === curDot ? 24 : 6, height: 6, borderRadius: 3, background: i === curDot ? C.purple : i < curDot ? C.purpleDim : C.faint, transition: 'all .35s' }} />
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'clamp(20px,5vw,48px) clamp(20px,6vw,56px)', zIndex: 1, overflowY: 'auto' }} className="si" key={phase + slide}>

        {/* SLIDES */}
        {phase === 'intro' && !slides[slide].isLegal && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ marginBottom: 32 }}>{slides[slide].icon}</div>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: C.text, marginBottom: 14, fontFamily: "'DM Serif Display',serif", lineHeight: 1.2 }}>{slides[slide].title}</h1>
            <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.75, whiteSpace: 'pre-line', maxWidth: 310 }}>{slides[slide].body}</p>
          </div>
        )}

        {/* LEGAL */}
        {phase === 'intro' && slides[slide].isLegal && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.amberDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Ico n="shield" sz={36} c={C.amber}/></div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'DM Serif Display',serif" }}>Prima di iniziare</h1>
            </div>
            <div style={{ background: C.card, borderRadius: 20, padding: 20, fontSize: 13, color: 'rgba(0,0,0,.6)', lineHeight: 1.75, border: `1px solid ${C.border}`, maxHeight: 200, overflowY: 'auto', marginBottom: 20 }}>
              <div style={{ marginBottom: 14 }}><strong style={{ color: C.amber }}>⚠️ Disclaimer</strong><br/>Liv non è un dispositivo medico né un servizio di psicoterapia. Non diagnostica e non sostituisce il parere di un professionista. In caso di crisi, chiama il 112.</div>
              <div style={{ marginBottom: 14 }}><strong style={{ color: C.teal }}>🔒 Privacy</strong><br/>I tuoi dati sono trattati nel rispetto del GDPR. Le conversazioni non vengono condivise con terze parti.</div>
              <div><strong style={{ color: C.purple }}>💚 Il nostro impegno</strong><br/>Liv è uno spazio di supporto, non di giudizio. Sei al sicuro qui.</div>
            </div>
            <div className="tap" onClick={() => setLegal(!legal)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: C.card, borderRadius: 16, border: `1px solid ${legal ? C.teal : C.border}`, marginBottom: 8, transition: 'border-color .2s' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${legal ? C.teal : 'rgba(0,0,0,.15)'}`, background: legal ? C.teal : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all .2s' }}>
                {legal && <Ico n="ok" sz={13} c="#fff"/>}
              </div>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.65 }}>Confermo di avere <strong style={{ color: C.text }}>più di 18 anni</strong>, di aver letto la Privacy Policy e acconsento al trattamento dei dati.</p>
            </div>
            <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.7, textAlign: 'center', padding: '0 4px' }}>Continuando dichiari di aver letto e accettato che Liv è uno strumento di supporto emotivo e non sostituisce un professionista della salute mentale. Le tue conversazioni restano sul tuo dispositivo. Solo dati aggregati anonimi vengono condivisi per migliorare il servizio.</p>
          </div>
        )}

        {/* NOME */}
        {phase === 'name' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: C.text, marginBottom: 10, fontFamily: "'DM Serif Display',serif" }}>Come ti chiami?</h2>
            <p style={{ color: C.muted, fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>Userò il tuo nome per rendere tutto più personale.</p>
            <input autoFocus placeholder="Il tuo nome..." value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setPhase('focus')}
              style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1.5px solid ${name.trim() ? C.accent : C.border}`, background: C.card, color: C.text, fontSize: 18, outline: 'none', transition: 'border-color .2s' }}/>
          </div>
        )}

        {/* PROFILO */}
        {phase === 'profile' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: C.text, marginBottom: 10, fontFamily: "'DM Serif Display',serif" }}>Qualcosa su di te</h2>
            <p style={{ color: C.muted, fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Aiuta Liv a capire meglio chi sei. Opzionale.</p>
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Mese e anno di nascita</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${birthMonth ? C.accent : C.border}`, background: C.card, color: birthMonth ? C.text : C.muted, fontSize: 15, outline: 'none' }}>
                  <option value="">Mese</option>
                  {['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
                <select value={birthYear} onChange={e => setBirthYear(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${birthYear ? C.accent : C.border}`, background: C.card, color: birthYear ? C.text : C.muted, fontSize: 15, outline: 'none' }}>
                  <option value="">Anno</option>
                  {Array.from({ length: 71 }, (_, i) => 2010 - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <p style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Sesso</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Maschio','Femmina','Preferisco non specificare'].map(g => (
                  <button key={g} className="tap" onClick={() => setGender(g)}
                    style={{ flex: 1, padding: '11px 6px', borderRadius: 12, border: `1.5px solid ${gender === g ? C.accent : C.border}`, background: gender === g ? C.accentDim : C.card, color: gender === g ? C.accent : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FOCUS */}
        {phase === 'focus' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8, fontFamily: "'DM Serif Display',serif" }}>Ehi {name}! Cosa ti porta qui?</h2>
            <p style={{ color: C.muted, fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>Aiutami a capire come supportarti meglio.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FOCUSES.map(f => (
                <button key={f.id} className="tap" onClick={() => setFocus(f.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 20, border: `1.5px solid ${focus === f.id ? C.accent : C.border}`, background: focus === f.id ? C.accentDim : C.card, textAlign: 'left', width: '100%', transition: 'all .2s' }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{f.emoji}</span>
                  <div>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{f.label}</div>
                    <div style={{ color: C.muted, fontSize: 13 }}>{f.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BUTTON AREA */}
      <div style={{ padding: '8px 24px 48px', zIndex: 1, flexShrink: 0 }}>
        {phase === 'intro' && !slides[slide].isLegal && (
          <Btn variant="primary" onClick={() => { if (slide < slides.length - 1) setSlide(slide + 1) }}>Avanti →</Btn>
        )}
        {phase === 'intro' && slides[slide].isLegal && (
          <Btn variant="grad" onClick={() => legal && setPhase('name')} disabled={!legal}>Accetto e inizia →</Btn>
        )}
        {phase === 'name' && (
          <Btn variant="primary" onClick={() => name.trim() && setPhase('profile')} disabled={!name.trim()}>Continua →</Btn>
        )}
        {phase === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn variant="primary" onClick={() => setPhase('focus')}>Continua →</Btn>
            <button onClick={() => setPhase('focus')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>Puoi saltare questo passaggio</button>
          </div>
        )}
        {phase === 'focus' && focus && (
          <Btn variant="grad" onClick={() => done({ name, focus, profile: { birthMonth: birthMonth || null, birthYear: birthYear ? parseInt(birthYear) : null, gender: gender || null } })}>Entra in Liv →</Btn>
        )}
      </div>
    </div>
  )
}

/* ─── HOME ──────────────────────────────────────────────────────────────── */
function Home({ checkins, chats, onNav, userName, user }) {
  const last = checkins[checkins.length - 1]
  const h = new Date().getHours()
  const gr = h < 5 ? 'Buona notte' : h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'

  const pad = 'clamp(12px,3vw,32px)'
  const padH = 'clamp(14px,4vw,40px)'

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: `${pad} ${padH} 0` }} className="fu">

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <div>
          <p style={{ color: C.muted, fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{gr}</p>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 400, fontFamily: "'DM Serif Display',serif", lineHeight: 1.1 }}>
            {userName ? `Come stai, ${userName}?` : 'Come stai oggi?'}
          </h1>
        </div>
        <button className="tap" onClick={() => onNav('profile')}
          style={{ background: C.faint, border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
          <Ico n="profile" sz={20} c={C.accent}/>
        </button>
      </div>

      {/* diario card */}
      <button className="tap" onClick={() => onNav('diario')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: 0, marginBottom: 10, flexShrink: 0 }}>
        <Card style={{ width: '100%' }}>
          {last ? <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8 }}>Ultimo umore registrato</p>
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 600 }}>Vedi tutti →</span>
            </div>
            <div style={{ color: C.teal, fontSize: 20, fontWeight: 700, textTransform: 'capitalize', marginBottom: 4 }}>{last.emotion}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: C.tealDim, color: C.teal, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{last.area}</span>
              <span style={{ color: C.muted, fontSize: 12 }}>Mood {last.mood}/10</span>
              <span style={{ color: C.accent, fontSize: 12, fontWeight: 600, marginLeft: 'auto' }}>Il tuo Diario →</span>
            </div>
          </> : <>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>Non hai ancora registrato nulla.</p>
            <p style={{ color: 'rgba(0,0,0,.2)', fontSize: 12 }}>Inizia con il tuo primo check-in ↓</p>
          </>}
        </Card>
      </button>

      {/* CTA principale: check-in */}
      <button className="tap" onClick={() => onNav('checkin')} style={{ width: '100%', padding: '16px 20px', borderRadius: 22, border: 'none', background: C.accent, marginBottom: 10, textAlign: 'left', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: -10, top: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(0,0,0,.03)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ico n="pulse" sz={22} c="#fff"/>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 2 }}>Come mi sento ora</div>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>Registra il mio umore</div>
          </div>
        </div>
      </button>

      {/* griglia 2×2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        paddingBottom: pad,
      }}>
        {[
          { id: 'chat',    icon: 'chat',    title: 'Parliamo',          sub: 'Rifletti con Liv' },
          { id: 'assess',  icon: 'clip',    title: 'Test di autovalutazione', sub: 'Auto-analisi mensile' },
          { id: 'profile', icon: 'chart',   title: 'Il mio profilo',    sub: 'Trend e insight' },
          { id: 'finder',  icon: 'search',  title: 'Trova il percorso', sub: 'Supporto professionale' },
        ].map(item => (
          <button key={item.id} className="tap home-card" onClick={() => onNav(item.id)}
            style={{ width: '100%', padding: 'clamp(12px,2vw,20px)', borderRadius: 20, border: `0.5px solid ${C.border}`, background: C.card, textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico n={item.icon} sz={18} c={C.accent}/>
            </div>
            <div>
              <div style={{ color: C.text, fontSize: 'clamp(12px,1.4vw,15px)', fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
              <div style={{ color: C.muted, fontSize: 'clamp(10px,1.1vw,12px)' }}>{item.sub}</div>
            </div>
          </button>
        ))}
      </div>

    </div>
  )
}

/* ─── CHECK-IN ──────────────────────────────────────────────────────────── */
function EmoPicker({ title, sub, sel, intens, color, onSel, onInt, onNext, canSkip, excl, customEmo, onCustomEmo }) {
  return (
    <div>
      <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, fontFamily: "'DM Serif Display',serif", textAlign: 'center', marginBottom: sub ? 4 : 20 }}>{title}</h2>
      {sub && <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>{sub}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {EMOTIONS.filter(e => e === 'Altro' || e !== excl).map(e => (
          <button key={e} className="tap" onClick={() => onSel(e)}
            style={{ padding: '11px 8px', borderRadius: 100, border: `1.5px solid ${sel === e ? color : C.border}`, background: sel === e ? `${color}18` : C.card, color: sel === e ? color : 'rgba(45,45,45,.5)', fontSize: 13, fontWeight: 600, transition: 'all .18s', textAlign: 'center' }}>
            {e}
          </button>
        ))}
      </div>
      {sel === 'Altro' && (
        <input autoFocus placeholder="Descrivi l'emozione..." value={customEmo || ''} onChange={e => onCustomEmo && onCustomEmo(e.target.value)}
          style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${customEmo ? color : C.border}`, background: C.card, color: C.text, fontSize: 15, outline: 'none', marginBottom: 16, transition: 'border-color .2s' }}/>
      )}
      {sel && sel !== 'Altro' && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Quanto è intensa?</span>
            <span style={{ color: color, fontWeight: 700, fontSize: 16 }}>{intens}<span style={{ fontSize: 11, color: C.muted }}>/10</span></span>
          </div>
          <input type="range" min="1" max="10" value={intens} onChange={e => onInt(parseInt(e.target.value))}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 11, marginTop: 8 }}>
            <span>Appena percettibile</span><span>Molto intensa</span>
          </div>
        </Card>
      )}
      {sel === 'Altro' && customEmo?.trim() && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Quanto è intensa?</span>
            <span style={{ color: color, fontWeight: 700, fontSize: 16 }}>{intens}<span style={{ fontSize: 11, color: C.muted }}>/10</span></span>
          </div>
          <input type="range" min="1" max="10" value={intens} onChange={e => onInt(parseInt(e.target.value))}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 11, marginTop: 8 }}>
            <span>Appena percettibile</span><span>Molto intensa</span>
          </div>
        </Card>
      )}
      <Btn variant={canSkip && !sel ? 'ghost' : 'amber'} onClick={onNext}
        disabled={!canSkip && !sel || (sel === 'Altro' && !customEmo?.trim())}>
        {canSkip && !sel ? 'Salta questo passaggio' : 'Continua →'}
      </Btn>
    </div>
  )
}

function CheckIn({ onBack, onDone }) {
  const [step, ss] = useState(1)
  const [d, sd] = useState({ mood: 6, emotion: '', emotionInt: 5, customEmotion: '', secEmotion: null, secInt: 5, customSecEmotion: '', area: '', customArea: '' })
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    const areaLabel = d.area === 'Altro' && d.customArea ? d.customArea : d.area
    const emoLabel = d.emotion === 'Altro' && d.customEmotion ? d.customEmotion : d.emotion
    const secEmoLabel = d.secEmotion === 'Altro' && d.customSecEmotion ? d.customSecEmotion : d.secEmotion
    const seed = `Ho appena fatto il check-in: mood ${d.mood}/10, emozione principale "${emoLabel}" (intensità ${d.emotionInt}/10)${secEmoLabel ? `, emozione secondaria "${secEmoLabel}" (${d.secInt}/10)` : ''}. Area di vita più impattante: "${areaLabel}".`
    onDone({ ...d, emotionLabel: emoLabel, secEmotionLabel: secEmoLabel, areaLabel }, seed)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button className="tap" onClick={step === 1 ? onBack : () => ss(step - 1)} style={{ background: 'none', border: 'none', display: 'flex', padding: 4 }}><Ico n="back" sz={22} c={C.muted}/></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? C.teal : i === step ? C.amber : C.faint, transition: 'all .3s' }} />)}
          </div>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 5, fontWeight: 500 }}>Come mi sento ora · {step}/4</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(20px,4vw,40px) clamp(16px,5vw,48px)' }} className="si" key={step}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <h2 style={{ color: C.text, fontSize: 24, fontWeight: 700, fontFamily: "'DM Serif Display',serif", textAlign: 'center' }}>Com'è il tuo umore ora?</h2>
            <MoodBulb mood={d.mood}/>
            <div style={{ width: '100%' }}>
              <input type="range" min="0" max="10" value={d.mood} onChange={e => sd({ ...d, mood: parseInt(e.target.value) })}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ color: C.muted, fontSize: 12 }}>0</span>
                <span style={{ color: C.amber, fontSize: 28, fontWeight: 700 }}>{d.mood}<span style={{ fontSize: 14, color: C.muted }}>/10</span></span>
                <span style={{ color: C.muted, fontSize: 12 }}>10</span>
              </div>
            </div>
            <Btn variant="amber" onClick={() => ss(2)}>Continua →</Btn>
          </div>
        )}
        {step === 2 && <EmoPicker title="Quale emozione senti più forte?" sel={d.emotion} intens={d.emotionInt} color={C.teal}
          onSel={e => sd({ ...d, emotion: e, customEmotion: '' })} onInt={v => sd({ ...d, emotionInt: v })}
          customEmo={d.customEmotion} onCustomEmo={v => sd({ ...d, customEmotion: v })} onNext={() => ss(3)} canSkip={false}/>}
        {step === 3 && <EmoPicker title="C'è un'altra emozione?" sub="Facoltativo" sel={d.secEmotion} intens={d.secInt} color={C.purple}
          onSel={e => sd({ ...d, secEmotion: d.secEmotion === e ? null : e, customSecEmotion: '' })} onInt={v => sd({ ...d, secInt: v })}
          customEmo={d.customSecEmotion} onCustomEmo={v => sd({ ...d, customSecEmotion: v })} onNext={() => ss(4)} canSkip={true} excl={d.emotion}/>}
        {step === 4 && (
          <div>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, fontFamily: "'DM Serif Display',serif", textAlign: 'center', marginBottom: 8 }}>Qual è l'area che pesa di più?</h2>
            <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Quella che sta influenzando di più il tuo stato</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {AREAS.map(a => (
                <button key={a.id} className="tap" onClick={() => sd({ ...d, area: a.l, customArea: a.id === 'altro' ? (d.customArea || '') : '' })}
                  style={{ padding: '10px 18px', borderRadius: 100, border: `1.5px solid ${d.area === a.l ? C.teal : C.border}`, background: d.area === a.l ? C.tealDim : C.card, display: 'flex', alignItems: 'center', gap: 6, transition: 'all .18s' }}>
                  <span style={{ fontSize: 15 }}>{a.e}</span>
                  <span style={{ color: d.area === a.l ? C.teal : 'rgba(45,45,45,.5)', fontSize: 13, fontWeight: 600 }}>{a.l}</span>
                </button>
              ))}
            </div>
            {d.area === 'Altro' && (
              <input autoFocus placeholder="Specifica l'area..." value={d.customArea || ''} onChange={e => sd({ ...d, customArea: e.target.value })}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${d.customArea ? C.teal : C.border}`, background: C.card, color: C.text, fontSize: 15, outline: 'none', marginBottom: 16, transition: 'border-color .2s' }}/>
            )}
            {d.area && (d.area !== 'Altro' || d.customArea?.trim()) && (
              <Btn variant="grad" onClick={submit} disabled={saving}>
                {saving ? 'Un momento...' : 'Parliamo con Liv →'}
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── MOOD GATE ──────────────────────────────────────────────────────────── */
function MoodFace({ val }) {
  const mood = val
  const pct = mood / 10
  const eyeLx = 46, eyeRx = 66, eyeY = 58
  const eyeRyL = mood < 1.5 ? 2 : mood < 3 ? 3 : mood < 5 ? 4 : mood < 7 ? 4.5 : 1
  const eyeRxL = mood < 1.5 ? 3 : mood < 3 ? 3.5 : mood < 5 ? 4 : 4.5
  const sparkR = (mood < 2 || mood >= 7.5) ? 0 : 1 + pct * 1.5
  const sparkOp = (mood < 2 || mood >= 7.5) ? 0 : 0.85
  const happyEyeL = `M${eyeLx-5} ${eyeY+1} Q${eyeLx} ${eyeY-5} ${eyeLx+5} ${eyeY+1}`
  const happyEyeR = `M${eyeRx-5} ${eyeY+1} Q${eyeRx} ${eyeY-5} ${eyeRx+5} ${eyeY+1}`
  const mouthPath = mood < 1.5 ? 'M42 72 Q56 67 70 72'
    : mood < 3 ? 'M43 71 Q56 71 69 71'
    : mood < 5 ? 'M43 70 Q56 74 69 70'
    : mood < 7 ? 'M41 69 Q56 76 71 69'
    : 'M39 68 Q56 79 73 68'
  const fc = '#2d2520'
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 140, height: 155 }}>
      <svg width="125" height="150" viewBox="0 0 120 145" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="mgGlow" cx="38%" cy="35%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="60%" stopColor={C.accent} />
            <stop offset="100%" stopColor={C.accent} />
          </radialGradient>
          <radialGradient id="mgShine" cx="35%" cy="28%" r="35%">
            <stop offset="0%" stopColor="white" stopOpacity={.25+pct*.25} />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="108" rx="18" ry="4" fill="#8a8a8a" opacity={0.1+pct*0.15} style={{ transition: 'all .5s' }} />
        <ellipse cx="60" cy="55" rx="44" ry="46" fill="url(#mgGlow)" style={{ transition: 'fill .5s' }} />
        <ellipse cx="60" cy="55" rx="44" ry="46" fill="url(#mgShine)" />
        {mood >= 7.5 ? <>
          <path d={happyEyeL} stroke={fc} strokeWidth="2.8" strokeLinecap="round" fill="none" style={{ transition: 'all .45s' }} />
          <path d={happyEyeR} stroke={fc} strokeWidth="2.8" strokeLinecap="round" fill="none" style={{ transition: 'all .45s' }} />
        </> : <>
          <ellipse cx={eyeLx} cy={eyeY} rx={eyeRxL} ry={eyeRyL} fill={fc} style={{ transition: 'all .45s' }} />
          <ellipse cx={eyeRx} cy={eyeY} rx={eyeRxL} ry={eyeRyL} fill={fc} style={{ transition: 'all .45s' }} />
          {mood >= 2 && mood < 7.5 && <>
            <circle cx={eyeLx+1.8} cy={eyeY-1.5} r={sparkR} fill="white" opacity={sparkOp} style={{ transition: 'all .4s' }} />
            <circle cx={eyeRx+1.8} cy={eyeY-1.5} r={sparkR} fill="white" opacity={sparkOp} style={{ transition: 'all .4s' }} />
          </>}
        </>}
        <path d={mouthPath} stroke={fc} strokeWidth="2.5" strokeLinecap="round" fill="none" style={{ transition: 'd .45s' }} />
      </svg>
    </div>
  )
}

function MoodGate({ onBack, onContinue }) {
  const [val, setVal] = useState(6)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `0.5px solid ${C.border}`, background: C.card }}>
        <button className="tap" onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, marginRight: 8, borderRadius: 10 }}>
          <Ico n="back" sz={20} c={C.text}/>
        </button>
      </div>
      {/* body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 36px 40px' }}>
        <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: C.text, textAlign: 'center', marginBottom: 28, lineHeight: 1.3 }}>Come stai in questo momento?</p>
        <MoodFace val={val}/>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 56, color: C.text, lineHeight: 1, margin: '16px 0 36px' }}>{val}</div>
        <div style={{ width: '100%', marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 11, marginBottom: 10 }}>
            <span>0</span><span>10</span>
          </div>
          <input type="range" min={0} max={10} step={1} value={val}
            onChange={e => setVal(Number(e.target.value))}
            style={{ width: '100%' }}/>
        </div>
        <button className="tap" onClick={() => onContinue(val)}
          style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: C.accent, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}>
          Continua →
        </button>
      </div>
    </div>
  )
}

/* ─── CHAT ──────────────────────────────────────────────────────────────── */
function ChatView({ onBack, seed, moodSeed, sys, accent, title, subtitle, initMsg, isFinder, onSaveChat, onAutoCI }) {
  const firstMsg = initMsg || 'Ciao. Sono qui. Come stai in questo momento?'
  const autoStart = isFinder || !!seed
  // Se c'è un seed o è il finder, partiamo vuoti e generiamo il messaggio contestuale
  const [msgs, sm] = useState(autoStart ? [] : [{ role: 'assistant', content: firstMsg }])
  const [inp, si] = useState('')
  const [load, sl] = useState(false)
  const [thinking, setThinking] = useState(autoStart)
  const [seeded, setSd] = useState(false)
  const [toast, setToast] = useState(false)
  const bot = useRef(null)
  const ta = useRef(null)


  useEffect(() => { bot.current?.scrollIntoView({ behavior: 'auto' }) }, [msgs, load])

  function makeChunkHandler() {
    return function onChunk(chunk) {
      sm(p => {
        const u = [...p]
        u[u.length - 1] = { role: 'assistant', content: u[u.length - 1].content + chunk }
        return u
      })
    }
  }
  useEffect(() => {
    if (!seeded && autoStart) {
      setSd(true)
      sl(true)
      let contextSys
      if (seed) {
        contextSys = `${sys || SYS_CHAT}

CONTESTO CHECK-IN APPENA COMPLETATO: ${seed}

Genera il tuo messaggio di apertura. Inizia esattamente con: "Sono Liv, un'intelligenza artificiale — non sono uno psicologo né un professionista della salute mentale. Sono qui per ascoltarti." Poi, nella stessa risposta, fai riferimento specifico all'emozione o all'umore registrato dall'utente e concludi con una singola domanda aperta su come sta. Massimo 3-4 frasi in totale.`
      } else {
        // finder auto-start: let AI present itself per its system prompt
        contextSys = sys || SYS_CHAT
      }
      sm([{ role: 'assistant', content: '' }])
      setThinking(false)
      streamAI([{ role: 'user', content: '[avvia]' }], contextSys, makeChunkHandler())
        .catch(() => {
          sm([{ role: 'assistant', content: firstMsg }])
        })
        .finally(() => { sl(false) })
    }
  }, [])

  async function run(text, base) {
    const cur = base || msgs
    const um = { role: 'user', content: text }
    const next = [...cur, um]
    sm(next)
    sl(true)
    setThinking(true)
    try {
      const safe = SAFETY.some(p => p.test(text))
      if (safe) {
        sm(p => [...p, { role: 'assistant', content: 'Sento molta sofferenza nelle tue parole. Se sei in pericolo chiama subito il **112**. Sono qui con te.' }])
      } else {
        sm(p => [...p, { role: 'assistant', content: '' }])
        setThinking(false)
        await streamAI(next, sys || SYS_CHAT, makeChunkHandler())
      }
    } catch {
      sm(p => {
        const u = [...p]
        const last = u[u.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          u[u.length - 1] = { role: 'assistant', content: "Mi dispiace, c'è stato un errore. Riprova." }
        } else {
          u.push({ role: 'assistant', content: "Mi dispiace, c'è stato un errore. Riprova." })
        }
        return u
      })
    }
    sl(false)
    setThinking(false)
  }

  async function send() {
    const t = inp.trim(); if (!t || load) return
    si(''); if (ta.current) ta.current.style.height = 'auto'
    await run(t)
  }

  async function handleBack() {
    const userMsgs = msgs.filter(m => m.role === 'user')
    console.log('[handleBack] userMsgs:', userMsgs.length, '| isFinder:', isFinder, '| onSaveChat:', !!onSaveChat)
    if (!isFinder && userMsgs.length >= 1 && onSaveChat) {
      const chatId = Date.now()
      const preview = userMsgs[0]?.content?.slice(0, 100) || ''

      const conversation = msgs.map(m => `${m.role === 'user' ? 'Utente' : 'Liv'}: ${m.content}`).join('\n')

      async function callExtract() {
        const r = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation }),
        })
        if (!r.ok) throw new Error('Errore /api/extract')
        const { result, error } = await r.json()
        if (error) throw new Error(error)
        return JSON.parse(result.replace(/```json|```/g, '').trim())
      }

      async function extractWithRetry() {
        try {
          return await callExtract()
        } catch (err) {
          console.warn('[handleBack] estrazione fallita:', err.message, '— retry tra 2s')
          await new Promise(r => setTimeout(r, 2000))
          try {
            return await callExtract()
          } catch (err2) {
            console.error('[handleBack] retry fallito:', err2.message)
            return {}
          }
        }
      }

      const parsed = await extractWithRetry()
      console.log('[handleBack] parsed:', parsed)

      const chatData = {
        date: new Date().toISOString().split('T')[0],
        id: chatId, msgCount: msgs.length, preview,
        temi: parsed.temi || [],
        insight: parsed.insight || null,
        domanda_riflessiva: parsed.domanda_riflessiva || null,
        messages: msgs.map(m => ({ role: m.role, content: m.content })),
      }
      console.log('[handleBack] chiamo onSaveChat con:', chatData)
      onSaveChat(chatData)

      if (onAutoCI && parsed.emotion && parsed.intensity && parsed.area) {
        const moodMatch = seed ? seed.match(/Mood iniziale:\s*(\d+)\/10/) : null
        const moodVal = moodMatch ? parseInt(moodMatch[1], 10) : null
        console.log('[handleBack] creo auto check-in:', parsed.emotion, parsed.intensity, parsed.area, '| mood slider:', moodVal)
        onAutoCI({ emotion: parsed.emotion, emotionInt: parsed.intensity, area: parsed.area, chatId, moodSeed: moodVal })
        markChatProcessed(chatId)
        setToast(true)
        setTimeout(() => setToast(false), 3000)
      }
    }
    onBack()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${C.border}`, flexShrink: 0, background: C.bg }}>
        <button className="tap" onClick={handleBack} style={{ background: 'none', border: 'none', display: 'flex', padding: 4, cursor: 'pointer' }}>
          <Ico n="back" sz={22} c={C.muted}/>
        </button>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><img src="/logo.png" alt="Liv" style={{ width: '65%', height: '65%', objectFit: 'contain' }} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 400, fontSize: 16, fontFamily: "'DM Serif Display',serif", lineHeight: 1.1 }}>{title || 'Liv'}</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>{subtitle || 'in ascolto'}</div>
        </div>
        {thinking && (
          <img src="/logo.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain', marginRight: 4, animation: 'pulse-logo 1.4s ease-in-out infinite' }} />
        )}
      </div>

      {/* Messaggi */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {msgs.map((m, i) => (
          <div key={i} className={i === msgs.length - 1 ? 'fu' : ''} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 }}><img src="/logo.png" alt="Liv" style={{ width: '65%', height: '65%', objectFit: 'contain' }} /></div>
            )}
            <div style={{
              maxWidth: '78%',
              padding: '10px 14px',
              borderRadius: m.role === 'assistant' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
              background: m.role === 'assistant' ? '#fff' : C.accent,
              border: m.role === 'assistant' ? `0.5px solid ${C.border}` : 'none',
              color: m.role === 'assistant' ? C.text : '#fff',
              fontSize: 15,
              lineHeight: 1.72,
              whiteSpace: 'pre-wrap',
            }}>{m.content || (m.role === 'assistant' && load ? <span style={{ opacity: .4 }}>…</span> : '')}</div>
          </div>
        ))}
        <div ref={bot}/>
      </div>

      {/* Toast auto check-in */}
      {toast && (
        <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: 'rgba(45,45,45,.85)', color: '#fff', fontSize: 12, fontWeight: 500, padding: '8px 18px', borderRadius: 100, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10 }}>
          Check-in salvato automaticamente
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 16px 24px', background: C.bg, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', background: C.card, borderRadius: 28, border: `0.5px solid ${C.border}`, padding: '8px 8px 8px 18px', gap: 8, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
          <textarea ref={ta} value={inp}
            onChange={e => { si(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Scrivi un messaggio…" rows={1}
            style={{ flex: 1, background: 'transparent', border: 'none', color: C.text, fontSize: 15, outline: 'none', resize: 'none', lineHeight: 1.6, maxHeight: 140, padding: '4px 0', fontFamily: "'DM Sans',sans-serif" }}/>
          <button className="tap" onClick={send} disabled={!inp.trim() || load}
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: inp.trim() && !load ? C.accent : 'rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s', cursor: inp.trim() && !load ? 'pointer' : 'default' }}>
            <Ico n="send" sz={15} c={inp.trim() && !load ? '#fff' : 'rgba(0,0,0,.2)'}/>
          </button>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(0,0,0,.18)', fontSize: 10, marginTop: 7, fontWeight: 400 }}>Liv può commettere errori · Non sostituisce un professionista</p>
      </div>
    </div>
  )
}

/* ─── ASSESSMENT ────────────────────────────────────────────────────────── */
function Assessment({ onBack, onSaveReport }) {
  const [step, ss] = useState(0)
  const [ans, sa] = useState({})
  const [life, sl] = useState({})
  const [rep, sr] = useState('')
  const [loadRep, slr] = useState(false)
  const [saved, setSaved] = useState(false)

  const ok = () => {
    if (step < 5) return A_SECS[step].q.every((_, i) => ans[`${step}_${i}`] !== undefined)
    if (step === 5) return A_LIFE.every((_, i) => life[i] !== undefined)
    return true
  }

  async function genRep(scores, lifeRes) {
    slr(true)
    const sum = scores.map(s => `${s.t}: ${Math.round(s.pct)}%`).join(', ')
    const ls = lifeRes.map(l => `${l.a}: ${l.v > 0 ? '+' + l.v : l.v}`).join(', ')
    try {
      const r = await callAI([{ role: 'user', content: `Report mensile:\nDistress: ${sum}\nVita: ${ls}` }], SYS_REPORT)
      sr(r)
      if (onSaveReport) {
        onSaveReport({ scores, lifeResults: lifeRes, aiReflection: r, totalPct: (scores.reduce((a, s) => a + s.score, 0) / scores.reduce((a, s) => a + s.max, 0)) * 100 })
        setSaved(true)
      }
    } catch { sr('Non è stato possibile generare il report AI.') }
    slr(false)
  }

  function next() {
    if (!ok()) return
    if (step === 5) {
      const scores = A_SECS.map((s, si) => { let sc = 0; s.q.forEach((_, qi) => sc += (ans[`${si}_${qi}`] || 0)); return { t: s.t, score: sc, max: s.max, pct: (sc / s.max) * 100 } })
      genRep(scores, A_LIFE.map((a, i) => ({ a, v: life[i] })))
    }
    ss(s => s + 1)
  }

  if (step === 6) {
    const scores = A_SECS.map((s, si) => { let sc = 0; s.q.forEach((_, qi) => sc += (ans[`${si}_${qi}`] || 0)); return { t: s.t, score: sc, max: s.max, pct: (sc / s.max) * 100 } })
    const tot = scores.reduce((a, s) => a + s.score, 0)
    const maxT = scores.reduce((a, s) => a + s.max, 0)
    const pct = (tot / maxT) * 100
    const lv = pct > 66 ? 'Elevato' : pct > 33 ? 'Moderato' : 'Basso'
    const lc = lv === 'Basso' ? C.teal : C.amber
    const top2 = [...scores].sort((a, b) => b.pct - a.pct).slice(0, 2)
    const negL = A_LIFE.map((a, i) => ({ a, v: life[i] })).filter(l => l.v < 0).sort((a, b) => a.v - b.v).slice(0, 2)
    const posL = A_LIFE.map((a, i) => ({ a, v: life[i] })).filter(l => l.v > 0).sort((a, b) => b.v - a.v).slice(0, 2)

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button className="tap" onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', padding: 4 }}><Ico n="back" sz={22} c={C.muted}/></button>
          <span style={{ color: C.teal, fontSize: 13, fontWeight: 600, letterSpacing: .5 }}>✓ Report mensile completato</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,4vw,40px) clamp(16px,5vw,48px)' }} className="fu">
          <h2 style={{ color: C.text, fontSize: 24, fontWeight: 700, fontFamily: "'DM Serif Display',serif", marginBottom: 4 }}>Il tuo report</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>{new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>

          <Card style={{ marginBottom: 14 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>Stato di benessere</p>
            <div style={{ fontSize: 30, fontWeight: 700, color: lc, marginBottom: 10 }}>{lv}</div>
            <div style={{ height: 6, borderRadius: 3, background: C.faint, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: lc, transition: 'width .8s ease' }}/>
            </div>
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 14 }}>Aree con più impatto</p>
            {top2.map((s, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{s.t}</span>
                  <span style={{ color: C.rose, fontSize: 13, fontWeight: 700 }}>{Math.round(s.pct)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.faint, overflow: 'hidden' }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', borderRadius: 3, background: C.rose + 'bb' }}/>
                </div>
              </div>
            ))}
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ background: C.roseDim, borderRadius: 20, padding: '16px', border: `1px solid ${C.rose}22` }}>
              <p style={{ color: C.rose, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 12 }}>Da osservare</p>
              {negL.length > 0 ? negL.map((l, i) => <div key={i} style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.35 }}>{l.a}</div>)
                : <div style={{ color: C.muted, fontSize: 13 }}>—</div>}
            </div>
            <div style={{ background: C.tealDim, borderRadius: 20, padding: '16px', border: `1px solid ${C.teal}22` }}>
              <p style={{ color: C.teal, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 12 }}>Punti di forza</p>
              {posL.length > 0 ? posL.map((l, i) => <div key={i} style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.35 }}>{l.a}</div>)
                : <div style={{ color: C.muted, fontSize: 13 }}>—</div>}
            </div>
          </div>

          <Card style={{ background: `linear-gradient(135deg,${C.purpleDim},${C.tealDim})`, border: `1px solid ${C.accent}20`, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Logo size={20}/>
              <span style={{ color: C.purple, fontWeight: 600, fontSize: 14 }}>Riflessione Liv</span>
            </div>
            {loadRep
              ? <div style={{ display: 'flex', gap: 8, padding: '6px 0' }}>{[0, 1, 2].map(i => <div key={i} className={`b${i}`} style={{ width: 7, height: 7, borderRadius: '50%', background: C.purple }}/>)}</div>
              : <p style={{ color: 'rgba(0,0,0,.7)', fontSize: 14, lineHeight: 1.78 }}>{rep}</p>}
          </Card>
          <Btn variant="ghost" onClick={onBack}>Torna alla home</Btn>
        </div>
      </div>
    )
  }

  const sec = step < 5 ? A_SECS[step] : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button className="tap" onClick={step === 0 ? onBack : () => ss(step - 1)} style={{ background: 'none', border: 'none', display: 'flex', padding: 4 }}><Ico n="back" sz={22} c={C.muted}/></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[0, 1, 2, 3, 4, 5].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? C.teal : i === step ? C.amber : C.faint, transition: 'all .3s' }} />)}
          </div>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 5, fontWeight: 500 }}>Check-up mensile · sezione {step + 1}/6</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,4vw,40px) clamp(16px,5vw,48px) 100px' }} className="si" key={step}>
        {step < 5 && sec && (
          <div>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, fontFamily: "'DM Serif Display',serif", marginBottom: 4 }}>{sec.t}</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Ultime 2 settimane</p>
            {sec.q.map((q, i) => (
              <Card key={i} style={{ marginBottom: 12 }}>
                <p style={{ color: 'rgba(0,0,0,.75)', fontSize: 14, fontWeight: 500, marginBottom: 14, lineHeight: 1.65 }}>{q}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {['Mai', 'Raram.', 'Spesso', 'Sempre'].map((lbl, val) => (
                    <button key={val} className="tap" onClick={() => sa({ ...ans, [`${step}_${i}`]: val })}
                      style={{ padding: '10px 4px', borderRadius: 12, border: `2px solid ${ans[`${step}_${i}`] === val ? C.amber : C.border}`, background: ans[`${step}_${i}`] === val ? C.amberDim : C.card, color: ans[`${step}_${i}`] === val ? C.amber : 'rgba(0,0,0,.35)', fontSize: 11, fontWeight: 600, transition: 'all .2s' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
        {step === 5 && (
          <div>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, fontFamily: "'DM Serif Display',serif", marginBottom: 4 }}>Ambiti di vita</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Come incidono sul tuo benessere adesso?</p>
            {A_LIFE.map((area, i) => (
              <Card key={i} style={{ marginBottom: 12 }}>
                <p style={{ color: 'rgba(0,0,0,.75)', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{area}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[-2, -1, 0, 1, 2].map(val => {
                    const ac = val < 0 ? C.rose : val > 0 ? C.teal : 'rgba(100,116,139,1)'
                    const lbs = { '-2': '--', '-1': '-', '0': '=', '1': '+', '2': '++' }
                    return (
                      <button key={val} className="tap" onClick={() => sl({ ...life, [i]: val })}
                        style={{ flex: 1, height: 44, borderRadius: 12, border: `2px solid ${life[i] === val ? ac : C.border}`, background: life[i] === val ? `${ac}22` : C.card, color: life[i] === val ? ac : 'rgba(0,0,0,.28)', fontSize: 18, fontWeight: 700, transition: 'all .2s' }}>
                        {lbs[val]}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(0,0,0,.18)', fontSize: 10, marginTop: 8, fontWeight: 500 }}>
                  <span>Negativo</span><span>Neutro</span><span>Positivo</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px 28px', background: `linear-gradient(to top,${C.bg} 65%,transparent)`, zIndex: 10 }}>
        <Btn variant={ok() ? 'amber' : 'ghost'} onClick={next} disabled={!ok()}>
          {step === 5 ? 'Genera il mio report →' : 'Continua →'}
        </Btn>
      </div>
    </div>
  )
}

/* ─── DIARIO ────────────────────────────────────────────────────────────── */
function Diario({ checkins, chats, onBack, onAutoCI }) {
  const [expandedChat, setExpandedChat] = useState(null)
  // Auto check-in per chat esistenti non ancora processate
  useEffect(() => {
    if (!onAutoCI) return
    const processed = getProcessedChatIds()
    const existing = checkins.filter(c => c.auto).map(c => String(c.chatId)).filter(Boolean)
    const toProcess = chats.filter(c =>
      c.id &&
      !processed.has(String(c.id)) &&
      !existing.includes(String(c.id)) &&
      (c.msgCount || 0) >= 1 &&
      (c.temi?.length > 0 || c.insight)
    )
    if (toProcess.length === 0) return
    // Processa sequenzialmente in background, 1 alla volta, con pausa 800ms
    ;(async () => {
      for (const chat of toProcess) {
        markChatProcessed(chat.id)
        const text = [
          chat.temi?.length ? `Argomenti: ${chat.temi.join(', ')}.` : '',
          chat.insight ? `Sintesi: ${chat.insight}` : '',
          chat.preview ? `Primo messaggio: "${chat.preview}"` : '',
        ].filter(Boolean).join(' ')
        try {
          const raw = await callAI([{ role: 'user', content: text }], SYS_AUTO_CHECKIN, 'claude-haiku-4-5')
          const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
          if (parsed.emotion && parsed.intensity && parsed.area) {
            onAutoCI({ emotion: parsed.emotion, emotionInt: parsed.intensity, area: parsed.area, chatId: chat.id })
          }
        } catch { /* silenzioso */ }
        await new Promise(r => setTimeout(r, 800))
      }
    })()
  }, [])

  const allEvents = [
    ...checkins.map(c => ({ ...c, type: 'checkin', sortTs: c.id || new Date(c.date + 'T00:00:00').getTime() })),
    ...chats.map(c => ({ ...c, type: 'chat',    sortTs: c.id || new Date(c.date + 'T00:00:00').getTime() })),
  ].sort((a, b) => b.sortTs - a.sortTs)

  function fmtDatetime(ts, dateStr) {
    try {
      const d = ts ? new Date(ts) : new Date(dateStr + 'T00:00:00')
      const date = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
      const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      return `${date} · ${time}`
    } catch { return dateStr }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${C.border}`, flexShrink: 0, background: C.bg }}>
        <button className="tap" onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', padding: 4 }}><Ico n="back" sz={22} c={C.muted}/></button>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 400, fontSize: 16, fontFamily: "'DM Serif Display',serif" }}>Il mio Diario</div>
          <div style={{ color: C.muted, fontSize: 11 }}>{checkins.length} check-in · {chats.length} chat</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,3vw,28px) clamp(14px,4vw,36px)' }}>
        {allEvents.length === 0 && <p style={{ color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 40 }}>Nessuna attività ancora. Inizia con il tuo primo check-in!</p>}
        {allEvents.map((ev, i) => (
          <div key={i}
            onClick={ev.type === 'chat' ? () => setExpandedChat(expandedChat === (ev.id ?? i) ? null : (ev.id ?? i)) : undefined}
            className={ev.type === 'chat' ? 'tap' : ''}
            style={{ background: C.card, borderRadius: 18, border: `0.5px solid ${C.border}`, padding: '14px 16px', marginBottom: 8, cursor: ev.type === 'chat' ? 'pointer' : 'default' }}>
            {ev.type === 'checkin' ? (() => {
              const isAuto = !!ev.auto
              return <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      background: isAuto ? 'rgba(139,144,112,.15)' : C.tealDim,
                      color: isAuto ? '#8B9070' : C.teal,
                      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: .3
                    }}>{isAuto ? 'AUTO' : 'CHECK-IN'}</span>
                    <span style={{ color: C.muted, fontSize: 11 }}>{fmtDatetime(ev.sortTs, ev.date)}</span>
                  </div>
                  {ev.mood != null && <span style={{ color: C.muted, fontSize: 12 }}>Mood {ev.mood}/10</span>}
                </div>
                <div style={{ color: C.text, fontSize: 15, fontWeight: 600, textTransform: 'capitalize', marginBottom: 6 }}>{ev.emotionLabel || ev.emotion}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(ev.areaLabel || ev.area) && <span style={{ background: C.tealDim, color: C.teal, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{ev.areaLabel || ev.area}</span>}
                  {(ev.secEmotionLabel || ev.secEmotion) && <span style={{ background: C.purpleDim, color: C.purple, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{ev.secEmotionLabel || ev.secEmotion}</span>}
                </div>
              </>
            })() : (() => {
              const evKey = ev.id ?? i
              const isOpen = expandedChat === evKey
              // Leggi campi sensibili da localStorage come fallback (local-first)
              const localMeta = ev.id ? (() => { try { return JSON.parse(localStorage.getItem(`liv_chat_meta_${ev.id}`)) } catch { return null } })() : null
              const localMsgs = ev.id ? (() => { try { return JSON.parse(localStorage.getItem(`liv_msgs_${ev.id}`)) } catch { return null } })() : null
              const preview = ev.preview || localMeta?.preview || null
              const temi = ev.temi?.length ? ev.temi : (localMeta?.temi || [])
              const insight = ev.insight || localMeta?.insight || null
              const messages = ev.messages?.length ? ev.messages : (localMsgs || [])
              return <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: preview ? 6 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ background: C.accentDim, color: C.accent, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>CHAT</span>
                    <span style={{ color: C.muted, fontSize: 11 }}>{fmtDatetime(ev.sortTs, ev.date)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.muted, fontSize: 12 }}>{ev.msgCount || 0} msg</span>
                    <span style={{ color: C.muted, fontSize: 16, lineHeight: 1, display: 'inline-block', transform: isOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .2s' }}>›</span>
                  </div>
                </div>
                {preview && <p style={{ color: C.text, fontSize: 13, lineHeight: 1.55, marginBottom: temi.length ? 4 : 0 }}>{preview}</p>}
                {temi.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {temi.map((t, ti) => <span key={ti} style={{ background: C.accentDim, color: C.accent, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{t}</span>)}
                  </div>
                )}
                {!isOpen && insight && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: `${C.accent}08`, borderRadius: 10, border: `0.5px solid ${C.accent}18` }}>
                    <p style={{ color: 'rgba(0,0,0,.55)', fontSize: 12, lineHeight: 1.6, fontStyle: 'italic' }}>{insight}</p>
                  </div>
                )}
                {isOpen && (
                  <div style={{ marginTop: 12, borderTop: `0.5px solid ${C.border}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {messages.length > 0 ? messages.map((m, mi) => (
                      <div key={mi} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6 }}>
                        {m.role === 'assistant' && (
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: '#fff', fontFamily: "'DM Serif Display',serif" }}>L</div>
                        )}
                        <div style={{
                          maxWidth: '80%', padding: '8px 12px', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap',
                          borderRadius: m.role === 'assistant' ? '14px 14px 14px 3px' : '14px 14px 3px 14px',
                          background: m.role === 'assistant' ? '#fff' : C.accent,
                          border: m.role === 'assistant' ? `0.5px solid ${C.border}` : 'none',
                          color: m.role === 'assistant' ? C.text : '#fff',
                        }}>{m.content}</div>
                      </div>
                    )) : (
                      <p style={{ color: C.muted, fontSize: 12, fontStyle: 'italic' }}>Conversazione non disponibile su questo dispositivo.</p>
                    )}
                  </div>
                )}
              </>
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── AUTH SCREEN ───────────────────────────────────────────────────────── */
function AuthScreen({ onBack = null, onDone }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setMsg(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onDone()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Registrazione completata! Controlla la tua email per confermare l\'account.')
      }
    } catch (e) {
      const m = e.message || ''
      setErr(
        m.includes('Invalid login') ? 'Email o password non corretti.' :
        m.includes('already registered') ? 'Email già registrata. Prova ad accedere.' :
        m.includes('Password should') ? 'La password deve avere almeno 6 caratteri.' : m
      )
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    setGoogleLoading(false)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {onBack && (
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button className="tap" onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', padding: 4 }}>
            <Ico n="back" sz={22} c={C.muted}/>
          </button>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>Accedi a Liv</div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,5vw,48px) clamp(20px,6vw,56px)' }} className="fu">
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* logo + titolo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 8px 24px rgba(${C.accentRgb},.3)` }}>
              <span style={{ color: '#fff', fontSize: 30, fontWeight: 700, fontFamily: "'DM Serif Display',serif" }}>L</span>
            </div>
            <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, fontFamily: "'DM Serif Display',serif", marginBottom: 6 }}>Bentornato</h1>
            <p style={{ color: C.muted, fontSize: 14 }}>Accedi per sincronizzare i tuoi dati</p>
          </div>

          {/* Google OAuth */}
          <button className="tap" onClick={handleGoogle} disabled={googleLoading}
            style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
            {googleLoading ? (
              <span style={{ color: C.muted, fontSize: 14 }}>Reindirizzamento…</span>
            ) : <>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"/></svg>
              <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Continua con Google</span>
            </>}
          </button>

          {/* divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: C.border }}/>
            <span style={{ color: C.muted, fontSize: 12 }}>oppure</span>
            <div style={{ flex: 1, height: 1, background: C.border }}/>
          </div>

          {/* tab login/register */}
          <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', background: C.faint, marginBottom: 20 }}>
            {['login','register'].map(m => (
              <button key={m} className="tap" onClick={() => { setMode(m); setErr(''); setMsg('') }}
                style={{ flex: 1, padding: '10px', border: 'none', background: mode === m ? C.accent : 'transparent', color: mode === m ? '#fff' : C.muted, fontWeight: 600, fontSize: 13, transition: 'all .2s' }}>
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          {err && <p style={{ color: C.rose, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{err}</p>}
          {msg && <p style={{ color: C.teal, fontSize: 13, marginBottom: 12, textAlign: 'center', lineHeight: 1.5 }}>{msg}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 15, outline: 'none' }}/>
            <input type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 15, outline: 'none' }}/>
            <button type="submit" className="tap" disabled={loading}
              style={{ padding: '15px', borderRadius: 14, border: 'none', background: loading ? C.faint : C.accent, color: loading ? C.muted : '#fff', fontWeight: 700, fontSize: 15, marginTop: 4, cursor: loading ? 'default' : 'pointer', boxShadow: loading ? 'none' : `0 4px 14px rgba(${C.accentRgb},.35)` }}>
              {loading ? 'Un momento…' : mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ─── ACCENT PALETTES ───────────────────────────────────────────────────── */
const PALETTES = [
  { name: 'Sage',   hex: '#6B9080' },
  { name: 'Amber',  hex: '#b8a07a' },
  { name: 'Blue',   hex: '#6b8cce' },
  { name: 'Rose',   hex: '#c07a8a' },
  { name: 'Coral',  hex: '#E8725C' },
]

// Restituisce il valore mood da usare per grafici/calcoli, seguendo la priorità:
// 1. moodSeed (slider MoodGate) 2. mood (slider check-in manuale) 3. null (escludi)
function getMoodVal(c) {
  if (c.moodSeed != null) return c.moodSeed
  if (c.mood != null) return c.mood
  return null
}

/* ─── MOOD CHART ─────────────────────────────────────────────────────────── */
function MoodChart({ checkins }) {
  const pts = [...checkins].sort((a, b) => a.id - b.id).map(c => ({ ...c, _mv: getMoodVal(c) })).filter(c => c._mv != null).slice(-30)
  console.log('[MoodChart] punti grafico:', pts.map(c => ({ id: c.id, _mv: c._mv, moodSeed: c.moodSeed, mood: c.mood, emotionInt: c.emotionInt, auto: c.auto })))
  if (pts.length < 2) return null
  const W = 300, H = 80, pad = 8
  const xs = pts.map((_, i) => pad + (i / (pts.length - 1)) * (W - pad * 2))
  const ys = pts.map(c => H - pad - ((Math.min(10, Math.max(0, c._mv)) / 10) * (H - pad * 2)))
  const poly = xs.map((x, i) => `${x},${ys[i]}`).join(' ')
  const area = `M${xs[0]},${ys[0]} ` + xs.slice(1).map((x, i) => `L${x},${ys[i + 1]}`).join(' ') + ` L${xs[xs.length - 1]},${H - pad} L${xs[0]},${H - pad} Z`
  const last = pts[pts.length - 1]
  const clampV = v => Math.min(10, Math.max(0, v))
  const avg = Math.round(pts.reduce((a, c) => a + clampV(c._mv), 0) / pts.length * 10) / 10
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4 }}>Media umore · ultimi {pts.length} check-in</div>
          <div style={{ color: C.accent, fontSize: 28, fontWeight: 700 }}>{avg}<span style={{ fontSize: 14, color: C.muted }}>/10</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>Ultimo</div>
          <div style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>{clampV(last._mv)}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={C.accent} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#mg)"/>
        <polyline points={poly} fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="4" fill={C.accent}/>
      </svg>
    </div>
  )
}

/* ─── PROFILE ───────────────────────────────────────────────────────────── */
function Profile({ checkins, chats, userName, onBack, user, onLogout, accent, onAccentChange, onGoAuth }) {
  const [analysis, setAnalysis] = useState(null)  // { schemi, sintesi, domanda }
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisErr, setAnalysisErr] = useState(false)

  // Calcoli locali
  const clampV = v => Math.min(10, Math.max(0, typeof v === 'number' ? v : 0))
  const sorted = [...checkins].sort((a, b) => a.date > b.date ? 1 : -1)
  const last30 = sorted.filter(c => (Date.now() - new Date(c.date + 'T00:00:00')) / 86400000 <= 30)
  const areaCount = {}
  last30.forEach(c => { if (c.area) areaCount[c.area] = (areaCount[c.area] || 0) + 1 })
  const topAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const emoCount = {}
  last30.forEach(c => {
    if (c.emotion) emoCount[c.emotion] = (emoCount[c.emotion] || 0) + 1
    if (c.secEmotion) emoCount[c.secEmotion] = (emoCount[c.secEmotion] || 0) + 0.5
  })
  const topEmos = Object.entries(emoCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  useEffect(() => {
    if (checkins.length < 3) return
    setAnalysisLoading(true)
    setAnalysisErr(false)

    const ciSummary = sorted.slice(-40).map(c =>
      `[${c.date}] umore:${clampV(c.mood)}/10 emozione:"${c.emotion || '—'}"${c.secEmotion ? ` secondaria:"${c.secEmotion}"` : ''} area:"${c.area || '—'}"`
    ).join('\n')

    const chatSummary = chats.slice(-20).map(c =>
      c.temi?.length ? `Chat ${c.date}: temi [${c.temi.join(', ')}]${c.insight ? ` — "${c.insight.slice(0, 120)}"` : ''}` : null
    ).filter(Boolean).join('\n')

    const ctx = `CHECK-IN DELL'UMORE (più recenti prima):\n${ciSummary}${chatSummary ? `\n\nTEMI DELLE CONVERSAZIONI:\n${chatSummary}` : ''}`

    callAI([{ role: 'user', content: ctx }], SYS_PROFILE, 'claude-haiku-4-5')
      .then(raw => {
        try {
          const clean = raw.replace(/```json|```/g, '').trim()
          const parsed = JSON.parse(clean)
          setAnalysis(parsed)
        } catch { setAnalysisErr(true) }
        setAnalysisLoading(false)
      })
      .catch(() => { setAnalysisErr(true); setAnalysisLoading(false) })
  }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* header */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.bg }}>
        <button className="tap" onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', padding: 4 }}><Ico n="back" sz={22} c={C.muted}/></button>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>Il mio profilo</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,4vw,40px) clamp(16px,5vw,48px)' }} className="fu">

        {/* Account */}
        {!user ? (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Ico n="profile" sz={26} c={C.accent}/>
              </div>
              <p style={{ color: C.text, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Salva i tuoi dati</p>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Accedi per sincronizzare check-in, conversazioni e report su Supabase.</p>
              <button className="tap" onClick={onGoAuth}
                style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 14px rgba(${C.accentRgb},.3)` }}>
                Accedi o registrati
              </button>
            </div>
          </Card>
        ) : (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg,${C.accent},${C.accent}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico n="profile" sz={22} c="#fff"/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>{userName || 'Utente'}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{user.email}</div>
              </div>
              <button className="tap" onClick={onLogout}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                <Ico n="logout" sz={14} c={C.muted}/> Esci
              </button>
            </div>
          </Card>
        )}

        {/* Colore tema */}
        <Card style={{ marginBottom: 20 }}>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 14 }}>Colore tema</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {PALETTES.map(p => (
              <button key={p.hex} className="tap" onClick={() => onAccentChange(p.hex)} title={p.name}
                style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: p.hex, flexShrink: 0,
                  boxShadow: accent === p.hex ? `0 0 0 3px #fff, 0 0 0 5px ${p.hex}` : 'none', transition: 'box-shadow .15s' }}/>
            ))}
            <label className="tap" title="Colore personalizzato"
              style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', background: `conic-gradient(red,yellow,lime,cyan,blue,magenta,red)`,
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: !PALETTES.find(p => p.hex === accent) ? `0 0 0 3px #fff, 0 0 0 5px ${accent}` : 'none', transition: 'box-shadow .15s' }}>
              <input type="color" value={accent} onChange={e => onAccentChange(e.target.value)}
                style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}/>
            </label>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: accent }}/>
              <span style={{ color: C.muted, fontSize: 12, fontFamily: 'monospace' }}>{accent.toUpperCase()}</span>
            </div>
          </div>
        </Card>

        {/* Intestazione */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: C.text, fontSize: 26, fontWeight: 400, fontFamily: "'DM Serif Display',serif", marginBottom: 4, lineHeight: 1.15 }}>
            {userName ? `Ciao, ${userName}` : 'Il tuo profilo'}
          </h2>
          <p style={{ color: C.muted, fontSize: 13 }}>{checkins.length} check-in · {chats.length} conversazioni</p>
        </div>

        {checkins.length < 3 ? (
          <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Ico n="chart" sz={24} c={C.accent}/>
            </div>
            <p style={{ color: C.text, fontSize: 17, fontWeight: 400, fontFamily: "'DM Serif Display',serif", marginBottom: 8 }}>Costruiamo insieme il tuo profilo</p>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>
              Fai almeno 3 check-in dell'umore e qualche conversazione con Liv — poi qui troverai i tuoi schemi emotivi, il trend nel tempo e una domanda riflessiva personalizzata.
            </p>
          </Card>
        ) : <>

          {/* 1 — TREND EMOTIVO */}
          <div style={{ marginBottom: 8 }}>
            <h3 style={{ color: C.text, fontSize: 18, fontWeight: 400, fontFamily: "'DM Serif Display',serif", marginBottom: 2 }}>Trend emotivo</h3>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Andamento dell'umore nel tempo</p>
          </div>
          <Card style={{ marginBottom: 24 }}>
            <MoodChart checkins={sorted}/>
          </Card>

          {/* 2 — AREE PIÙ COINVOLTE */}
          {topAreas.length > 0 && <>
            <div style={{ marginBottom: 8 }}>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 400, fontFamily: "'DM Serif Display',serif", marginBottom: 2 }}>Aree più coinvolte</h3>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Ultimi 30 giorni</p>
            </div>
            <Card style={{ marginBottom: 24 }}>
              {topAreas.map(([area, count], i) => {
                const pct = Math.round((count / Math.max(last30.length, 1)) * 100) || 1
                return (
                  <div key={area} style={{ marginBottom: i < topAreas.length - 1 ? 14 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{area}</span>
                      <span style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: C.faint, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: C.accent, transition: 'width .8s ease' }}/>
                    </div>
                  </div>
                )
              })}
            </Card>
          </>}

          {/* 3 — EMOZIONI FREQUENTI */}
          {topEmos.length > 0 && <>
            <div style={{ marginBottom: 8 }}>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 400, fontFamily: "'DM Serif Display',serif", marginBottom: 2 }}>Emozioni frequenti</h3>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Ultimi 30 giorni</p>
            </div>
            <Card style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {topEmos.map(([emo], i) => (
                  <div key={emo} style={{ background: i === 0 ? C.accent : C.accentDim, color: i === 0 ? '#fff' : C.text, padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>{emo}</div>
                ))}
              </div>
            </Card>
          </>}

          {/* 4 — ANALISI AI */}
          <div style={{ marginBottom: 8 }}>
            <h3 style={{ color: C.text, fontSize: 18, fontWeight: 400, fontFamily: "'DM Serif Display',serif", marginBottom: 2 }}>Schemi di pensiero ricorrenti</h3>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Analisi generata da Liv</p>
          </div>

          {analysisLoading ? (
            <Card style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0,1,2].map(i => <div key={i} className={`b${i}`} style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent }}/>)}
                </div>
                <div>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Liv sta analizzando i tuoi dati…</p>
                  <p style={{ color: C.muted, fontSize: 12 }}>Pochi secondi</p>
                </div>
              </div>
            </Card>
          ) : analysisErr ? (
            <Card style={{ marginBottom: 24 }}>
              <p style={{ color: C.muted, fontSize: 13 }}>Non è stato possibile generare l'analisi. Riprova più tardi.</p>
            </Card>
          ) : analysis && <>
            {analysis.schemi?.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                {analysis.schemi.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < analysis.schemi.length - 1 ? 18 : 0, alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ color: C.accent, fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{s}</p>
                  </div>
                ))}
              </Card>
            )}

            {/* Sintesi */}
            {analysis.sintesi && (
              <Card style={{ marginBottom: 16, background: `linear-gradient(135deg,${C.accentDim},${C.faint})`, border: `0.5px solid ${C.accent}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontFamily: "'DM Serif Display',serif" }}>L</div>
                  <span style={{ color: C.accent, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8 }}>Lettura del periodo</span>
                </div>
                <p style={{ color: C.text, fontSize: 14, lineHeight: 1.75 }}>{analysis.sintesi}</p>
              </Card>
            )}

            {/* Domanda riflessiva */}
            {analysis.domanda && (
              <div style={{ marginBottom: 24, padding: '22px 20px', borderRadius: 20, background: C.accentDim, border: `0.5px solid ${C.accent}25` }}>
                <p style={{ color: C.accent, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 12 }}>Domanda riflessiva</p>
                <p style={{ color: C.text, fontSize: 18, lineHeight: 1.6, fontFamily: "'DM Serif Display',serif", fontWeight: 400 }}>"{analysis.domanda}"</p>
              </div>
            )}
          </>}
        </>}

        {user?.email === ADMIN_EMAIL && (
          <div style={{ textAlign: 'center', paddingBottom: 8 }}>
            <a href="/admin" style={{ color: C.muted, fontSize: 11, textDecoration: 'none' }}>Pannello Admin</a>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── ADMIN ─────────────────────────────────────────────────────────────── */
const ADMIN_EMAIL = 'massimilianopisani.mp@gmail.com'

function AdminScreen() {
  const [user, setUser] = useState(null)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (!u || u.email !== ADMIN_EMAIL) { setLoading(false); return }
      try {
        const r = await fetch('/api/admin', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const { chats: data, error: e } = await r.json()
        if (e) throw new Error(e)
        setChats(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <span style={{ color: C.muted, fontSize: 14 }}>Caricamento...</span>
    </div>
  )

  if (!user || user.email !== ADMIN_EMAIL) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <span style={{ color: C.muted, fontSize: 14 }}>Accesso negato.</span>
    </div>
  )

  if (error) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <span style={{ color: '#c0392b', fontSize: 14 }}>Errore: {error}</span>
    </div>
  )

  // Statistiche aggregate (i campi ora sono flat, non in .data)
  const uniqueUsers = new Set(chats.map(c => c.user_id)).size
  const totalMsgs = chats.reduce((s, c) => s + (c.msgCount || 0), 0)
  const avgMsgs = chats.length ? Math.round(totalMsgs / chats.length * 10) / 10 : 0
  const emoCount = {}
  chats.forEach(c => { if (c.emotion) emoCount[c.emotion] = (emoCount[c.emotion] || 0) + 1 })
  const topEmos = Object.entries(emoCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const anonId = uid => 'Utente_' + uid.slice(0, 8)
  const fmtTs = ts => ts ? new Date(ts).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, overflowY: 'auto' }}>
      {/* header */}
      <div style={{ background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: '20px 24px' }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: C.text, marginBottom: 4 }}>Admin</div>
        <div style={{ color: C.muted, fontSize: 12 }}>Solo per {ADMIN_EMAIL}</div>
      </div>

      <div style={{ padding: '20px 20px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
        {/* Statistiche */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Utenti unici', val: uniqueUsers },
            { label: 'Conversazioni', val: chats.length },
            { label: 'Media messaggi', val: avgMsgs },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: '14px 16px' }}>
              <div style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{s.label}</div>
              <div style={{ color: C.accent, fontSize: 24, fontWeight: 700 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Top emozioni */}
        {topEmos.length > 0 && (
          <div style={{ background: C.card, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Emozioni più frequenti</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {topEmos.map(([e, n]) => (
                <span key={e} style={{ background: C.accentDim, color: C.accent, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{e} · {n}</span>
              ))}
            </div>
          </div>
        )}

        {/* Lista conversazioni */}
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: C.text, marginBottom: 12 }}>Conversazioni</div>
        {chats.map((c, i) => {
          const key = c.created_at + i
          return (
            <div key={key} style={{ background: C.card, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: '14px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: C.accentDim, color: C.accent, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{anonId(c.user_id)}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>{fmtTs(c.created_at)}</span>
                </div>
                <span style={{ color: C.muted, fontSize: 11 }}>{c.msgCount} msg</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.emotion && <span style={{ background: C.accentDim, color: C.accent, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{c.emotion}</span>}
                {c.area && <span style={{ background: C.faint, color: C.muted, padding: '2px 10px', borderRadius: 20, fontSize: 11 }}>{c.area}</span>}
                {c.moodSeed != null && <span style={{ background: C.faint, color: C.muted, padding: '2px 10px', borderRadius: 20, fontSize: 11 }}>Mood {c.moodSeed}/10</span>}
                {c.gender && c.gender !== 'Preferisco non specificare' && <span style={{ background: C.faint, color: C.muted, padding: '2px 10px', borderRadius: 20, fontSize: 11 }}>{c.gender}</span>}
                {c.age != null && <span style={{ background: C.faint, color: C.muted, padding: '2px 10px', borderRadius: 20, fontSize: 11 }}>{c.age} anni</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── APP ───────────────────────────────────────────────────────────────── */
export default function App() {
  if (window.location.pathname === '/admin') return <div className="app-shell"><AdminScreen /></div>

  const [onb, setOnb] = useStore('onb_v1', false)
  const [userName, setUserName] = useStore('uname_v1', '')
  const [checkins, setCIs] = useStore('ci_v1', [])
  const [chats, setChats] = useStore('chats_v1', [])
  const [reports, setReports] = useStore('reports_v1', [])
  const [accent, setAccent] = useStore('accent_v1', '#6B9080')
  const [userProfile, setUserProfile] = useStore('profile_v1', null)
  const [screen, setScreen] = useState('home')
  const [seed, setSeed] = useState(null)
  const [moodGateVal, setMoodGateVal] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  applyAccent(accent)

  // Auth Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      // Se c'è sessione attiva, carica da Supabase (sovrascrive localStorage)
      if (u) loadFromSupabase(u.id).finally(() => setAuthLoading(false))
      else   setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setAuthLoading(true)
        loadFromSupabase(u.id).finally(() => setAuthLoading(false))
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Carica tutti i dati da Supabase — fonte autoritativa quando loggato
  async function loadFromSupabase(userId) {
    console.log('[Supabase] loadFromSupabase userId:', userId)
    const [ciRes, chRes, rRes, profRes] = await Promise.all([
      supabase.from('liv_checkins').select('data').eq('user_id', userId).order('created_at'),
      supabase.from('liv_chats').select('data').eq('user_id', userId).order('created_at'),
      supabase.from('liv_reports').select('data').eq('user_id', userId).order('created_at'),
      supabase.from('liv_profiles').select('data').eq('user_id', userId).maybeSingle(),
    ])
    console.log('[Supabase] checkins:', ciRes.data, ciRes.error)
    console.log('[Supabase] chats:', chRes.data, chRes.error)
    console.log('[Supabase] reports:', rRes.data, rRes.error)
    if (ciRes.error) console.error('[Supabase] errore checkins:', ciRes.error.message)
    if (chRes.error) console.error('[Supabase] errore chats:', chRes.error.message)
    if (rRes.error)  console.error('[Supabase] errore reports:', rRes.error.message)
    if (profRes.error) {
      // Query failed — keep whatever is already in localStorage (onb unchanged)
      console.error('[Supabase] errore profilo:', profRes.error.message)
    } else if (profRes.data?.data) {
      setUserProfile(profRes.data.data)
      setOnb(true)   // profilo in Supabase = onboarding già fatto
    } else {
      // No profile row yet — only reset onboarding if localStorage also says false
      const stored = localStorage.getItem('liv_onb_v1')
      if (!stored || stored === 'false') setOnb(false)
    }

    // Migrazione localStorage → Supabase
    // Se Supabase non ha check-in, cerca nei vecchi storage locali e migra
    const remoteCheckins = ciRes.data?.map(r => r.data) ?? []
    if (remoteCheckins.length === 0) {
      const legacyKeys = ['ci_v24', 'liv_ci_v1']
      let migrated = []
      for (const key of legacyKeys) {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed) && parsed.length > 0) {
              migrated = parsed
              console.log(`[Supabase] migrazione da localStorage key "${key}": ${parsed.length} check-in trovati`)
              break
            }
          }
        } catch {}
      }
      if (migrated.length > 0) {
        // Carica subito nello stato
        console.log('[Supabase] migrazione check-in mood:', migrated.map(c => ({ id: c.id, auto: c.auto, mood: c.mood })))
        setCIs(migrated)
        // Salva su Supabase in background
        Promise.all(migrated.map(ci => supabase.from('liv_checkins').insert({ user_id: userId, data: ci })))
          .then(results => {
            const errors = results.filter(r => r.error)
            if (errors.length === 0) {
              // Migrazione riuscita: rimuovi le chiavi legacy
              localStorage.removeItem('ci_v24')
              localStorage.removeItem('liv_ci_v1')
              console.log('[Supabase] migrazione completata, localStorage pulito')
            } else {
              console.error('[Supabase] errori durante migrazione:', errors.map(r => r.error?.message))
            }
          })
      }
    } else {
      console.log('[Supabase] check-in caricati mood:', remoteCheckins.map(c => ({ id: c.id, auto: c.auto, mood: c.mood })))
      setCIs(remoteCheckins)
    }

    // Dedup chat solo per id — mantieni l'ultima occorrenza per ogni id
    const rawChats = chRes.data?.map(r => r.data) ?? []
    const byId = new Map()
    rawChats.forEach(c => { if (c.id != null) byId.set(c.id, c) })
    // Chat senza id le teniamo tutte
    const noId = rawChats.filter(c => c.id == null)
    setChats([...byId.values(), ...noId])
    setReports(rRes.data?.map(r => r.data) ?? [])
  }

  // Salva su Supabase solo se loggato
  async function saveToSupabase(table, data) {
    if (!user) { console.log('[Supabase] saveToSupabase skip: utente non loggato'); return }
    console.log('[Supabase] insert in', table, data)
    const { error } = await supabase.from(table).insert({ user_id: user.id, data })
    if (error) console.error('[Supabase] errore insert in', table, ':', error.message)
    else console.log('[Supabase] insert OK in', table)
  }

  function handleCIDone(data, s) {
    const ci = { ...data, date: new Date().toISOString().split('T')[0], id: Date.now() }
    setCIs(p => [...p, ci])
    const { preview: _p, ...ciMin } = ci
    saveToSupabase('liv_checkins', ciMin)   // no-op se non loggato
    setSeed(s)
    setScreen('chat')
  }

  function handleReportSave(reportData) {
    const r = { ...reportData, date: new Date().toISOString().split('T')[0], id: Date.now() }
    setReports(p => [...p, r])
    saveToSupabase('liv_reports', r)
  }

  function handleAutoCI(ciData) {
    const ci = { ...ciData, date: new Date().toISOString().split('T')[0], id: Date.now(), auto: true, mood: ciData.moodSeed != null ? ciData.moodSeed : null, chatId: ciData.chatId || null }
    setCIs(p => [...p, ci])
    const { preview: _p, ...ciMin } = ci
    saveToSupabase('liv_checkins', ciMin)
  }

  function handleSaveChat(chatData) {
    setChats(p => [...p, chatData])
    // Salva campi sensibili solo in localStorage
    if (chatData.id) {
      const { preview, temi, insight, domanda_riflessiva } = chatData
      localStorage.setItem(`liv_chat_meta_${chatData.id}`, JSON.stringify({ preview, temi, insight, domanda_riflessiva }))
      if (chatData.messages?.length) {
        localStorage.setItem(`liv_msgs_${chatData.id}`, JSON.stringify(chatData.messages))
      }
    }
    // Supabase: solo campi non sensibili
    const { preview: _p, temi: _t, insight: _i, domanda_riflessiva: _d, messages: _m, ...minChat } = chatData
    saveToSupabase('liv_chats', minChat)
  }

  // Costruisce il system prompt del finder con il contesto dati dell'utente
  function buildChatSys() {
    let base = SYS_CHAT
    // Profilo utente
    if (userProfile) {
      const parts = []
      if (userProfile.gender && userProfile.gender !== 'Preferisco non specificare') parts.push(userProfile.gender === 'Maschio' ? 'un uomo' : 'una donna')
      if (userProfile.birthYear) {
        const age = new Date().getFullYear() - parseInt(userProfile.birthYear)
        const decade = Math.floor(age / 10) * 10
        parts.push(`di circa ${decade} anni`)
      }
      if (parts.length > 0) {
        base = base + `\n\nPROFILO UTENTE: Stai parlando con ${parts.join(' ')}.`
      }
    }
    const recent = [...chats]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-5)
    if (recent.length === 0) return base
    const lines = recent.map(c => {
      const localMeta = c.id ? (() => { try { return JSON.parse(localStorage.getItem(`liv_chat_meta_${c.id}`)) } catch { return null } })() : null
      const temi = c.temi?.length ? c.temi : (localMeta?.temi || [])
      const insight = c.insight || localMeta?.insight || c.preview || localMeta?.preview || null
      const temiStr = temi.length ? `Temi: ${temi.join(', ')}. ` : ''
      const insightStr = insight ? `"${insight.slice(0, 150)}"` : ''
      return `[${c.date}] - ${temiStr}${insightStr}`
    })
    const ctx = `\n\nCONVERSAZIONI PRECEDENTI (usa questo contesto per personalizzare le risposte):\n${lines.join('\n')}`
    return base + ctx
  }

  function buildFinderSys() {
    const lines = []
    if (checkins.length > 0) {
      const sorted = [...checkins].sort((a, b) => a.date > b.date ? 1 : -1)
      const recent = sorted.slice(-20)
      const moodCIs = recent.map(c => ({ ...c, _mv: getMoodVal(c) })).filter(c => c._mv != null)
      const avgMood = moodCIs.length ? Math.round(moodCIs.reduce((s, c) => s + Math.min(10, Math.max(0, c._mv)), 0) / moodCIs.length * 10) / 10 : null
      const emoCount = {}
      recent.forEach(c => { if (c.emotion) emoCount[c.emotion] = (emoCount[c.emotion] || 0) + 1 })
      const topEmos = Object.entries(emoCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([e]) => e)
      const areaCount = {}
      recent.forEach(c => { if (c.area) areaCount[c.area] = (areaCount[c.area] || 0) + 1 })
      const topAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a)
      lines.push(`DATI CHECK-IN UMORE (ultimi ${recent.length}):`)
      if (avgMood != null) lines.push(`- Umore medio: ${avgMood}/10`)
      if (topEmos.length) lines.push(`- Emozioni più frequenti: ${topEmos.join(', ')}`)
      if (topAreas.length) lines.push(`- Aree più impattate: ${topAreas.join(', ')}`)
    }
    const chatsWithInsight = chats.filter(c => c.temi?.length || c.insight)
    if (chatsWithInsight.length > 0) {
      lines.push(`\nTEMI EMERSI NELLE CONVERSAZIONI:`)
      chatsWithInsight.slice(-10).forEach(c => {
        if (c.temi?.length) lines.push(`- Temi: ${c.temi.join(', ')}`)
        if (c.insight) lines.push(`  "${c.insight.slice(0, 150)}"`)
      })
    }
    const ctx = lines.length > 0
      ? `\n\nCONTESTO UTENTE (usa questi dati per personalizzare le domande):\n${lines.join('\n')}`
      : ''
    return SYS_FINDER_BASE + ctx
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    // Svuota i dati dal client — al prossimo login si ricaricano da Supabase
    setCIs([])
    setChats([])
    setReports([])
    setScreen('home')
  }

  // 1 — Caricamento sessione
  if (authLoading) return (
    <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <LogoAnimated size={56} thinking={true}/>
    </div>
  )

  // 2 — Onboarding (una sola volta, indipendente dall'auth)
  if (!onb) return (
    <div className="app-shell">
      <Onboarding done={({ name, profile }) => {
        setUserName(name)
        setOnb(true)
        const profileData = {
          birthMonth: profile?.birthMonth || null,
          birthYear: profile?.birthYear || null,
          gender: profile?.gender || null,
          completedAt: new Date().toISOString(),
        }
        setUserProfile(profileData)
        if (user) {
          supabase.from('liv_profiles').upsert({ user_id: user.id, data: profileData }, { onConflict: 'user_id' })
        }
      }}/>
    </div>
  )

  // 3 — App principale (login opzionale)
  const TABS = [
    { id: 'home',    icon: 'home',    label: 'Home' },
    { id: 'assess',  icon: 'clip',    label: 'Test' },
    { id: 'chat',    icon: 'chat',    label: 'Liv' },
    { id: 'checkin', icon: 'pulse',   label: 'Umore' },
    { id: 'finder',  icon: 'search',  label: 'Psicologo' },
  ]

  const isFS = ['chat', 'checkin', 'assess', 'finder', 'diario', 'profile', 'auth', 'mood-gate'].includes(screen)

  return (
    <div className="app-shell">
      {/* content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {screen === 'home'    && <Home checkins={checkins} chats={chats} userName={userName} user={user} onNav={s => { setSeed(null); setScreen(s === 'chat' ? 'mood-gate' : s) }}/>}
        {screen === 'checkin' && <CheckIn onBack={() => setScreen('home')} onDone={handleCIDone}/>}
        {screen === 'diario'  && <Diario checkins={checkins} chats={chats} onBack={() => setScreen('home')} onAutoCI={handleAutoCI}/>}
        {screen === 'assess'  && <Assessment onBack={() => setScreen('home')} onSaveReport={handleReportSave}/>}
        {screen === 'auth'    && <AuthScreen onBack={() => setScreen('profile')} onDone={() => setScreen('home')}/>}
        {screen === 'profile' && <Profile checkins={checkins} chats={chats} userName={userName} onBack={() => setScreen('home')} user={user} onLogout={handleLogout} accent={accent} onAccentChange={setAccent} onGoAuth={() => setScreen('auth')}/>}
        {screen === 'mood-gate' && <MoodGate
          onBack={() => setScreen('home')}
          onContinue={v => { setMoodGateVal(v); setSeed(`Mood iniziale: ${v}/10`); setScreen('chat') }}/>}
        {screen === 'chat'    && <ChatView
          onBack={() => { setScreen('home'); setSeed(null); setMoodGateVal(null) }}
          onSaveChat={handleSaveChat}
          onAutoCI={handleAutoCI}
          seed={seed} moodSeed={moodGateVal} sys={buildChatSys()}
          accent={C.teal}
          title="Liv" subtitle="in ascolto"
          isFinder={false}/>}
        {screen === 'finder'  && <ChatView
          onBack={() => setScreen('home')}
          sys={buildFinderSys()} accent={C.accent}
          title="Trova il percorso"
          subtitle="matching professionista"
          isFinder={true}/>}
      </div>

      {/* tab bar */}
      {!isFS && (
        <div style={{ borderTop: `1px solid ${C.border}`, background: C.tabBarBg, padding: '10px 0 28px', display: 'flex', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} className="tap" onClick={() => { setSeed(null); setScreen(t.id === 'chat' ? 'mood-gate' : t.id) }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 'none', background: 'none', padding: '4px 0' }}>
              <Ico n={t.icon} sz={20} c={screen === t.id ? C.accent : 'rgba(45,45,45,.25)'}/>
              <span style={{ fontSize: 9, fontWeight: 600, color: screen === t.id ? C.accent : 'rgba(45,45,45,.25)', letterSpacing: .2 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
