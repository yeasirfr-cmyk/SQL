import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { createAdmin } from '../server/admin-store.js'

const terminal = createInterface({ input: stdin, output: stdout })

function hiddenQuestion(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || !stdin.setRawMode) {
      reject(new Error('Run this command in a normal Windows PowerShell terminal.'))
      return
    }
    terminal.pause()
    stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    let answer = ''
    const onData = (chunk: Buffer) => {
      const text = chunk.toString('utf8')
      if (text === '\u0003') {
        cleanup()
        reject(new Error('Cancelled.'))
        return
      }
      if (text === '\r' || text === '\n') {
        stdout.write('\n')
        cleanup()
        resolve(answer)
        return
      }
      if (text === '\u007f' || text === '\b') {
        answer = answer.slice(0, -1)
        return
      }
      answer += text
    }
    const cleanup = () => {
      stdin.off('data', onData)
      stdin.setRawMode(false)
      stdin.pause()
      terminal.resume()
    }
    stdin.on('data', onData)
  })
}

try {
  const username = await terminal.question('Choose administrator username: ')
  const password = await hiddenQuestion('Choose administrator password (minimum 12 characters): ')
  const confirmation = await hiddenQuestion('Type the password again: ')
  if (username.trim().length < 3) throw new Error('Username must be at least 3 characters.')
  if (password.length < 12) throw new Error('Password must be at least 12 characters.')
  if (password !== confirmation) throw new Error('Passwords do not match.')
  await createAdmin(username, password)
  console.log('Administrator created successfully. The password was stored only as a bcrypt hash.')
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Could not create administrator.')
  process.exitCode = 1
} finally {
  terminal.close()
}
