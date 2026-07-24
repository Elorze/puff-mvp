import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const root = fileURLToPath(new URL('./dist/', import.meta.url))
const port = Number(process.env.PORT || 8787)
const clients = new Map()
const audio = new Map()

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
}

function json(res, status, value) {
  cors(res)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(value))
}

function addClient(room, user, res) {
  const roomClients = clients.get(room) ?? new Set()
  const client = { user, res }
  roomClients.add(client)
  clients.set(room, roomClients)
  return () => {
    roomClients.delete(client)
    if (roomClients.size === 0) clients.delete(room)
  }
}

function broadcast(room, senderId, event, value) {
  let delivered = 0
  for (const client of clients.get(room) ?? []) {
    if (client.user === senderId) continue
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(value)}\n\n`)
    delivered += 1
  }
  return delivered
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 16 * 1024 * 1024) throw new Error('payload too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
  const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, '')
  let file = join(root, safePath)
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(root, 'index.html')
  }
  if (!existsSync(file)) {
    json(res, 503, { error: 'Build not found. Run npm run build first.' })
    return
  }
  cors(res)
  res.writeHead(200, {
    'Content-Type': mimeTypes[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': file.endsWith('index.html') ? 'no-store' : 'public, max-age=3600',
  })
  createReadStream(file).pipe(res)
}

const server = createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, 'http://localhost')
  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, {
      ok: true,
      rooms: clients.size,
      connected: [...clients.values()].reduce((sum, room) => sum + room.size, 0),
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    const room = url.searchParams.get('room') || 'puff-demo'
    const user = (url.searchParams.get('user') || '').toUpperCase()
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write(`event: ready\ndata: ${JSON.stringify({ room, user })}\n\n`)
    const remove = addClient(room, user, res)
    const heartbeat = setInterval(() => res.write(': wind\n\n'), 15_000)
    req.on('close', () => {
      clearInterval(heartbeat)
      remove()
    })
    return
  }

  if (req.method === 'POST' && url.pathname === '/seed') {
    try {
      const body = await readJson(req)
      if (!body.room || !body.senderId || !body.audioBase64) {
        json(res, 400, { error: 'room, senderId and audioBase64 are required' })
        return
      }
      const bytes = Buffer.from(body.audioBase64, 'base64')
      if (bytes.length === 0 || bytes.length > 12 * 1024 * 1024) {
        json(res, 413, { error: 'audio must be between 1 byte and 12 MB' })
        return
      }
      const id = randomUUID()
      const mimeType = String(body.mimeType || 'audio/webm').split(';')[0]
      audio.set(id, { bytes, mimeType, createdAt: Date.now() })
      const seed = {
        id,
        senderId: String(body.senderId).toUpperCase(),
        senderName: String(body.senderName || `Puff ${body.senderId}`).slice(0, 48),
        audioUrl: `/audio/${id}`,
        audioSeconds: Math.max(1, Math.min(60, Number(body.audioSeconds) || 1)),
        createdAt: Date.now(),
      }
      const delivered = broadcast(String(body.room), seed.senderId, 'seed', seed)
      json(res, 201, { id, delivered })
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : 'invalid payload' })
    }
    return
  }

  if (req.method === 'GET' && url.pathname.startsWith('/audio/')) {
    const item = audio.get(url.pathname.slice('/audio/'.length))
    if (!item) {
      json(res, 404, { error: 'voice not found' })
      return
    }
    res.writeHead(200, {
      'Content-Type': item.mimeType,
      'Content-Length': item.bytes.length,
      'Cache-Control': 'private, max-age=3600',
      'Accept-Ranges': 'bytes',
    })
    res.end(item.bytes)
    return
  }

  serveStatic(req, res)
})

const expiry = setInterval(() => {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000
  for (const [id, item] of audio) {
    if (item.createdAt < cutoff) audio.delete(id)
  }
}, 30 * 60 * 1000)
expiry.unref()

server.listen(port, '0.0.0.0', () => {
  console.log(`PUFF two-user demo: http://localhost:${port}`)
  console.log(`User A: http://localhost:${port}/?room=puff-demo&user=A`)
  console.log(`User B: http://localhost:${port}/?room=puff-demo&user=B`)
})
