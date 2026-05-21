import express from 'express'
import routes from './routes.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ── CORS ─────────────────────────────────────────────
// Permite requisições do arquivo aberto localmente (file://) e do próprio servidor
app.use((req, res, next) => {
    const origin = req.headers.origin || '*'
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
})

app.use(express.json())
app.use('/api', routes)
app.use(express.static(path.join(__dirname, '..')))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

export default app
