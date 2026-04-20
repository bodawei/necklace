import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const [[bead]] = await pool.query(
      'SELECT * FROM issues WHERE id = ?',
      [id]
    ) as [Record<string, unknown>[], unknown]

    if (!bead) {
      return Response.json({ error: 'Bead not found' }, { status: 404 })
    }

    // Fetch labels
    let labels: string[] = []
    try {
      const [labelRows] = await pool.query(
        'SELECT label FROM issue_labels WHERE issue_id = ?',
        [id]
      ) as [Record<string, unknown>[], unknown]
      labels = labelRows.map((r) => r.label as string)
    } catch {
      // table may not exist or have no rows — skip
    }

    // Fetch dependencies
    let dependencies: string[] = []
    try {
      const [depRows] = await pool.query(
        'SELECT depends_on FROM issue_dependencies WHERE issue_id = ?',
        [id]
      ) as [Record<string, unknown>[], unknown]
      dependencies = depRows.map((r) => r.depends_on as string)
    } catch {
      // table may not exist or have no rows — skip
    }

    return Response.json({ ...bead, labels, dependencies })
  } catch (err) {
    console.error(`GET /api/beads/${id} error:`, err)
    return Response.json({ error: 'Failed to fetch bead' }, { status: 500 })
  }
}
