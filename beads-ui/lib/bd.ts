import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// bd auto-discovers .beads/config.yaml by walking up from cwd
const BD_CWD = process.env.BD_WORKSPACE ?? '/Users/djb/gt2'

const MAX_BUFFER = 10 * 1024 * 1024 // 10MB

export async function runBd(...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('bd', args, { cwd: BD_CWD, maxBuffer: MAX_BUFFER })
  return stdout.trim()
}
