import { pool } from '../db.js'
import bcrypt from 'bcrypt'
import { createToken, denyToken } from '../services/tokenService.js'

// regex corrigido: \s dentro da classe de caracteres
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ADMIN_EMAIL_DOMAIN = '@admin.mrnuts.cerealista.com'
const ALLOWED_ADMIN_EMAIL = 'contato@mrnuts.com.br'

function isAllowedAdminEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    return normalizedEmail === ALLOWED_ADMIN_EMAIL || normalizedEmail.endsWith(ADMIN_EMAIL_DOMAIN)
}

function logInvalidAdminSignupAttempt(req, { name, email, telefone }) {
    console.warn('[ALERTA ADM] Alguém tentou se cadastrar como ADM com email não autorizado', {
        name,
        email,
        telefone,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        attemptedAt: new Date().toISOString()
    })
}

const sanitizeADM = (u) => ({
    ra: u.ra, name: u.name, email: u.email, telefone: u.telefone
})

// Criar conta com Senha
export async function registerADM(req, res) {
    const { name, email, telefone, password, passwordConfirm } = req.body
    if (!name || !email || !telefone || !password)
        return res.status(400).json({ error: 'Name, email, telefone e Password são Obrigatórios' })
    if (!emailRegex.test(email))
        return res.status(400).json({ error: 'Email Inválido' }) // era res.status(400)(...) sem .json
    if (!isAllowedAdminEmail(email)) {
        logInvalidAdminSignupAttempt(req, { name, email, telefone })
        return res.status(403).json({ error: 'Não foi possível concluir o cadastro' })
    }
    if (passwordConfirm !== undefined && password !== passwordConfirm)
        return res.status(400).json({ error: 'As senhas não correspondem' })
    try {
        const hash = await bcrypt.hash(password, 10)
        const [result] = await pool.query(
            'INSERT INTO adm (name, email, telefone, password) VALUES(?, ?, ?, ?)',
            [name, email, telefone, hash]
        )
        res.status(201).json({ ra: result.insertId, name, email, telefone })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Email já Cadastrado' })
        res.status(500).json({ error: 'Erro ao registrar o Administrador' })
    }
}

// Autenticar e retornar Token
export async function loginADM(req, res) {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).json({ error: 'Email e Password Obrigatórios' })
    try {
        const [rows] = await pool.query('SELECT * FROM adm WHERE email = ?', [email])
        if (!rows.length)
            return res.status(401).json({ error: 'Credenciais Inválidas' })
        const adm = rows[0]
        const match = await bcrypt.compare(password, adm.password)
        if (!match)
            return res.status(401).json({ error: 'Credenciais Inválidas' })
        const { token } = createToken({ ra: adm.ra })   // payload com 'ra' para o middleware reconhecer
        res.json({ token, adm: sanitizeADM(adm) })
    } catch {
        res.status(500).json({ error: 'Erro no Login' })
    }
}

// Revogar token
export async function logoutADM(req, res) {
    try {
        denyToken(req.adm?.jti || req.user?.jti)  // usa req.adm populado pelo middleware corrigido
        res.json({ message: 'Logout realizado com sucesso' })
    } catch (err) {
        console.log('Erro', err.message)
        res.status(500).json({ error: 'Erro no Logout' })
    }
}

// Redefinir Senha
export async function forgotPasswordADM(req, res) {
    const { email, newPassword } = req.body
    if (!email || !newPassword)
        return res.status(400).json({ error: 'email e newPassword são obrigatórios' }) // era res.json(400)
    try {
        const hash = await bcrypt.hash(newPassword, 10)
        await pool.query('UPDATE adm SET password = ? WHERE email = ?', [hash, email])
        res.json({ message: 'Se o email existir, a senha foi redefinida' })
    } catch {
        res.status(500).json({ error: 'Erro ao redefinir senha' })
    }
}
