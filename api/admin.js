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

  const { data: chats, error: chatsErr } = await supabase
    .from('liv_chats')
    .select('user_id, created_at, data')
    .order('created_at', { ascending: false })

  if (chatsErr) return res.status(500).json({ error: chatsErr.message })

  res.status(200).json({ chats: chats || [] })
}
