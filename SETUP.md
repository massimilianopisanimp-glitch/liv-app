# Relazioni & Benessere — Setup

## 1. Configura le variabili d'ambiente

Apri il file `.env` e inserisci:

```env
# API Anthropic (ottienila da https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (dal pannello del tuo progetto su https://supabase.com)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 2. Configura Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** e incolla il contenuto di `supabase-schema.sql`
3. Esegui lo script per creare le tabelle e le policy
4. Vai su **Project Settings → API** per copiare URL e anon key

## 3. Avvia l'app

```bash
npm run dev
```

Questo avvia:
- Frontend React: http://localhost:5173
- Backend Express (proxy Anthropic): http://localhost:3001

## Struttura del progetto

```
src/
├── components/
│   ├── Auth/          # Login e registrazione
│   ├── Chat/          # Chatbot con Aria
│   ├── Exercises/     # Respirazione, Scrittura, Mindfulness
│   ├── Layout/        # Header, Disclaimer
│   └── MoodTracker/   # Tracker umore
├── contexts/          # AuthContext (Supabase)
├── lib/               # Client Supabase
└── pages/             # Home, Chat, Umore, Esercizi, Accesso
server/
└── index.js           # Proxy sicuro per Anthropic API
```

## Note di sicurezza

- La chiave Anthropic (`ANTHROPIC_API_KEY`) è usata **solo lato server** (server/index.js)
  e non viene mai esposta al browser.
- Le chiavi Supabase nel `.env` con prefisso `VITE_` sono sicure per il frontend
  (sono chiavi pubbliche "anon" protette da Row Level Security).
