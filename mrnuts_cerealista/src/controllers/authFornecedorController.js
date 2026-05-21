import { pool } from '../db.js'
import bcrypt from 'bcrypt'
import { createToken, denyToken } from '../services/tokenService.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sanitizeFornecedor = (u) => ({
    idf: u.id_fornecedor, name: u.name, cnpj: u.cnpj, email: u.email, img: u.img || null
})

// Criar conta
export async function registerFornecedor(req, res) {
    const { name, cnpj, email, password, passwordConfirm } = req.body
    if (!name || !cnpj || !email || !password)
        return res.status(400).json({ error: 'Name, cnpj, email e Password são Obrigatórios' })
    if (passwordConfirm !== undefined && password !== passwordConfirm)
    return res.status(400).json({ error: 'As senhas não correspondem' })
  
  if (!emailRegex.test(email))
        return res.status(400).json({ error: 'Email Inválido' })
    try {
        const hash = await bcrypt.hash(password, 10)
        const [result] = await pool.query(
            'INSERT INTO fornecedor (name, cnpj, email, password) VALUES(?, ?, ?, ?)',
            [name, cnpj, email, hash]
        )
        res.status(201).json({ idf: result.insertId, name, cnpj, email })
    } catch (err) {
    console.log('ERRO REGISTRO FORNECEDOR:', err) // ✅ adiciona isso
    if (err.code === 'ER_DUP_ENTRY')
        return res.status(409).json({ error: 'Email ou CNPJ já Cadastrado' })
    res.status(500).json({ error: 'Erro ao registrar o Fornecedor' })
    }
}

// Login — usa id_fornecedor (nome real da coluna no banco)
export async function loginFornecedor(req, res) {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).json({ error: 'Email e Password Obrigatórios' })
    try {
        const [rows] = await pool.query('SELECT * FROM fornecedor WHERE email = ?', [email])
        if (!rows.length)
            return res.status(401).json({ error: 'Credenciais Inválidas' })
        const fornecedor = rows[0]
        const match = await bcrypt.compare(password, fornecedor.password)
        if (!match)
            return res.status(401).json({ error: 'Credenciais Inválidas' })
        // coluna no banco é id_fornecedor, guardamos como 'idf' no token
        const { token } = createToken({ idf: fornecedor.id_fornecedor })
        res.json({ token, fornecedor: sanitizeFornecedor(fornecedor) })
    } catch {
        res.status(500).json({ error: 'Erro no Login' })
    }
}

// Logout
export async function logoutFornecedor(req, res) {
    try {
        denyToken(req.fornecedor?.jti || req.user?.jti)
        res.json({ message: 'Logout realizado com sucesso' })
    } catch (err) {
        console.log('Erro', err.message)
        res.status(500).json({ error: 'Erro no Logout' })
    }
}

// Redefinir Senha
export async function forgotPasswordFornecedor(req, res) {
    const { email, newPassword } = req.body
    if (!email || !newPassword)
        return res.status(400).json({ error: 'email e newPassword são obrigatórios' })
    try {
        const hash = await bcrypt.hash(newPassword, 10)
        await pool.query('UPDATE fornecedor SET password = ? WHERE email = ?', [hash, email])
        res.json({ message: 'Se o email existir, a senha foi redefinida' })
    } catch {
        res.status(500).json({ error: 'Erro ao redefinir senha' })
    }
}
