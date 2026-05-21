import { pool } from '../db.js'
import { createToken } from '../services/tokenService.js'
import bcrypt from 'bcrypt'

// ── Verificar se perfil alternativo existe para o email do usuário ───────────
export async function verificarPerfilExistente(req, res) {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ error: 'Email obrigatório' })

        const [[cliente]]    = await pool.query('SELECT idc, name, email, telefone, img FROM cliente WHERE email = ?', [email])
        const [[fornecedor]] = await pool.query('SELECT id_fornecedor, name, cnpj, email, img FROM fornecedor WHERE email = ?', [email])

        res.json({
            temCliente:    !!cliente,
            temFornecedor: !!fornecedor,
            cliente:    cliente    || null,
            fornecedor: fornecedor || null
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// ── Trocar para perfil existente (mesmo email) ───────────────────────────────
export async function trocarPerfil(req, res) {
    try {
        const { email, para } = req.body  // para: 'cliente' | 'fornecedor'

        if (para === 'cliente') {
            const [[u]] = await pool.query(
                'SELECT idc, name, email, telefone, img FROM cliente WHERE email = ?', [email]
            )
            if (!u) return res.status(404).json({ error: 'Perfil cliente não encontrado' })
            const { token } = createToken({ idc: u.idc })
            return res.json({ tipo: 'cliente', token, cliente: u })
        }

        if (para === 'fornecedor') {
            const [[u]] = await pool.query(
                'SELECT id_fornecedor, name, cnpj, email, img FROM fornecedor WHERE email = ?', [email]
            )
            if (!u) return res.status(404).json({ error: 'Perfil fornecedor não encontrado' })
            const { token } = createToken({ idf: u.id_fornecedor })
            return res.json({ tipo: 'fornecedor', token, fornecedor: u })
        }

        res.status(400).json({ error: "para deve ser 'cliente' ou 'fornecedor'" })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// ── Criar perfil cliente vinculado (mesmo email do fornecedor) ───────────────
export async function criarPerfilClienteVinculado(req, res) {
    try {
        const { name, email, telefone, password } = req.body
        if (!name || !email || !telefone || !password)
            return res.status(400).json({ error: 'name, email, telefone e password são obrigatórios' })

        const [[existe]] = await pool.query('SELECT idc FROM cliente WHERE email = ?', [email])
        if (existe) return res.status(409).json({ error: 'Já existe um cliente com este email' })

        const hash = await bcrypt.hash(password, 10)
        const [result] = await pool.query(
            'INSERT INTO cliente (name, email, telefone, password) VALUES (?, ?, ?, ?)',
            [name, email, telefone, hash]
        )
        const idc = result.insertId
        const { token } = createToken({ idc })
        const [[novo]] = await pool.query('SELECT idc, name, email, telefone, img FROM cliente WHERE idc = ?', [idc])
        res.status(201).json({ tipo: 'cliente', token, cliente: novo })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// ── Criar perfil fornecedor vinculado (mesmo email do cliente) ───────────────
export async function criarPerfilFornecedorVinculado(req, res) {
    try {
        const { name, cnpj, email, password } = req.body
        if (!name || !cnpj || !email || !password)
            return res.status(400).json({ error: 'name, cnpj, email e password são obrigatórios' })

        const [[existe]] = await pool.query('SELECT id_fornecedor FROM fornecedor WHERE email = ?', [email])
        if (existe) return res.status(409).json({ error: 'Já existe um fornecedor com este email' })

        const [[existeCnpj]] = await pool.query('SELECT id_fornecedor FROM fornecedor WHERE cnpj = ?', [cnpj])
        if (existeCnpj) return res.status(409).json({ error: 'CNPJ já cadastrado' })

        const hash = await bcrypt.hash(password, 10)
        const [result] = await pool.query(
            'INSERT INTO fornecedor (name, cnpj, email, password) VALUES (?, ?, ?, ?)',
            [name, cnpj, email, hash]
        )
        const idf = result.insertId
        const { token } = createToken({ idf })
        const [[novo]] = await pool.query('SELECT id_fornecedor, name, cnpj, email, img FROM fornecedor WHERE id_fornecedor = ?', [idf])
        res.status(201).json({ tipo: 'fornecedor', token, fornecedor: novo })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}
