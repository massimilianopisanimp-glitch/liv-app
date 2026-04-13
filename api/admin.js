import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'massimilianopisani.mp@gmail.com'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const [chatsRes, profilesRes] = await Promise.all([
    supabase.from('liv_chats').select('user_id, created_at, data').order('created_at', { ascending: false }),
    supabase.from('liv_profiles').select('user_id, data'),
  ])

  if (chatsRes.error) return res.status(500).json({ error: chatsRes.error.message })

  // Indicizza profili per user_id
  const profilesByUser = {}
  ;(profilesRes.data || []).forEach(p => { profilesByUser[p.user_id] = p.data })

  // Restituisce solo campi non sensibili + dati profilo anonimi
  const chats = (chatsRes.data || []).map(c => {
    const prof = profilesByUser[c.user_id] || {}
    const age = prof.birthYear ? new Date().getFullYear() - parseInt(prof.birthYear) : null
    return {
      user_id: c.user_id,
      created_at: c.created_at,
      msgCount: c.data?.msgCount || 0,
      emotion: c.data?.emotion || null,
      area: c.data?.area || null,
      moodSeed: c.data?.moodSeed || null,
      gender: prof.gender || null,
      age,
    }
  })

  res.status(200).json({ chats })
}
