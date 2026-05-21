import { pool } from '../db.js'
import bcrypt from 'bcrypt'
import { createToken, denyToken } from '../services/tokenService.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sanitizeClient = (u) => ({
    idc: u.idc, name: u.name, email: u.email, telefone: u.telefone, img: u.img || null
})

// Criar conta
export async function registerClient(req, res) {
    const { name, email, telefone, password, passwordConfirm } = req.body
    if (!name || !email || !telefone || !password)
        return res.status(400).json({ error: 'Name, email, telefone e Password são Obrigatórios' })
    if (passwordConfirm !== undefined && password !== passwordConfirm)
    return res.status(400).json({ error: 'As senhas não correspondem' })
  
  if (!emailRegex.test(email))
        return res.status(400).json({ error: 'Email Inválido' })
    try {
        const hash = await bcrypt.hash(password, 10)
        const [result] = await pool.query(
            'INSERT INTO cliente (name, email, telefone, password) VALUES(?, ?, ?, ?)',
            [name, email, telefone, hash]
        )
        res.status(201).json({ idc: result.insertId, name, email, telefone })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Email já Cadastrado' })
        res.status(500).json({ error: 'Erro ao registrar o Cliente' })
    }
}

// Login
export async function loginClient(req, res) {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).json({ error: 'Email e Password Obrigatórios' })
    try {
        const [rows] = await pool.query('SELECT * FROM cliente WHERE email = ?', [email])
        if (!rows.length)
            return res.status(401).json({ error: 'Credenciais Inválidas' })
        const cliente = rows[0]
        const match = await bcrypt.compare(password, cliente.password)
        if (!match)
            return res.status(401).json({ error: 'Credenciais Inválidas' })
        const { token } = createToken({ idc: cliente.idc })  // payload com 'idc'
        res.json({ token, cliente: sanitizeClient(cliente) })
    } catch {
        res.status(500).json({ error: 'Erro no Login' })
    }
}

// Logout
export async function logoutClient(req, res) {
    try {
        denyToken(req.cliente?.jti || req.user?.jti)
        res.json({ message: 'Logout realizado com sucesso' })
    } catch (err) {
        console.log('Erro', err.message)
        res.status(500).json({ error: 'Erro no Logout' })
    }
}

// Redefinir Senha
export async function forgotPasswordClient(req, res) {
    const { email, newPassword } = req.body
    if (!email || !newPassword)
        return res.status(400).json({ error: 'email e newPassword são obrigatórios' })
    try {
        const hash = await bcrypt.hash(newPassword, 10)
        await pool.query('UPDATE cliente SET password = ? WHERE email = ?', [hash, email])
        res.json({ message: 'Se o email existir, a senha foi redefinida' })
    } catch {
        res.status(500).json({ error: 'Erro ao redefinir senha' })
    }
}
