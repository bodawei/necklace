import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, status, issue_type, priority FROM issues ORDER BY created_at DESC'
    )
    return Response.json(rows)
  } catch (err) {
    console.error('GET /api/beads error:', err)
    return Response.json({ error: 'Failed to fetch beads' }, { status: 500 })
  }
}
