import { pool } from '../db.js'
import fs from 'fs'
import bcrypt from 'bcrypt'
import path from 'path'

export async function createUserClient(req, res) {
    const { name, email, telefone } = req.body
    if (!name || !email || !telefone) {
        if (req.file) fs.unlink(req.file.path, () => {})
        return res.status(400).json({ error: 'Nome, Email e Telefone são obrigatórios' })
    }
    const imgPath = req.file ? 'uploads/' + path.basename(req.file.path) : null
    try {
        const [result] = await pool.query(
            'INSERT INTO cliente (name, email, img, telefone) VALUES (?,?,?,?)',
            [name, email, imgPath, telefone]
        )
        res.status(201).json({ idc: result.insertId, img: imgPath })
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {})
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Cliente já cadastrado' })
        res.status(500).json({ error: 'Erro ao criar Cliente' })
    }
}

export async function getUsersClient(_, res) {
    try {
        const [rows] = await pool.query(
            'SELECT idc, name, email, img, telefone, created_at FROM cliente ORDER BY idc DESC'
        )
        res.json(rows)
    } catch {
        res.status(500).json({ error: 'Erro ao listar Clientes' })
    }
}

export async function getClientByID(req, res) {
    const { idc } = req.params
    try {
        const [rows] = await pool.query(
            'SELECT idc, name, email, img, telefone, created_at FROM cliente WHERE idc = ?', [idc]
        )
        if (!rows.length)
            return res.status(404).json({ error: 'Cliente não encontrado' })
        res.json(rows[0])
    } catch {
        res.status(500).json({ error: 'Erro ao buscar Cliente' })
    }
}

export async function updateUserClient(req, res) {
    const { idc } = req.params
    const { name, email, telefone } = req.body
    if (!name || !email)
        return res.status(400).json({ error: 'Nome e email são obrigatórios!' })
    try {
        const [rows] = await pool.query('SELECT * FROM cliente WHERE idc = ?', [idc])
        if (!rows.length) return res.status(404).json({ error: 'Cliente não encontrado' })
        const oldImg = rows[0].img
        const newImg = req.file ? 'uploads/' + path.basename(req.file.path) : oldImg
        const [result] = await pool.query(
            'UPDATE cliente SET name=?, email=?, img=?, telefone=? WHERE idc=?',
            [name, email, newImg, telefone || rows[0].telefone, idc]
        )
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente não encontrado' })
        if (req.file && oldImg) fs.unlink(oldImg, () => {})
        const [updated] = await pool.query('SELECT idc, name, email, img, telefone, created_at FROM cliente WHERE idc=?', [idc])
        res.json(updated[0])
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Email já cadastrado' })
        res.status(500).json({ error: 'Erro ao atualizar Cliente' })
    }
}

export async function deleteUserClient(req, res) {
    const { idc } = req.params
    // Permite deletar a própria conta (cliente logado) ou ADM deletando qualquer conta
    const isAdm  = req.adm?.ra !== undefined
    const selfIdc = req.cliente?.idc
    if (!isAdm && parseInt(idc, 10) !== selfIdc)
        return res.status(403).json({ error: 'Você só pode deletar a própria conta' })
    try {
        const [rows] = await pool.query('SELECT * FROM cliente WHERE idc = ?', [idc])
        if (!rows.length) return res.status(404).json({ error: 'Cliente não encontrado' })
        const imgPath = rows[0].img
        await pool.query('DELETE FROM cliente WHERE idc = ?', [idc])
        if (imgPath) fs.unlink(imgPath, () => {})
        res.json({ message: 'Conta excluída com sucesso' })
    } catch {
        res.status(500).json({ error: 'Erro ao excluir cliente' })
    }
}

export async function profileClient(req, res) {
    const idc = req.cliente?.idc ?? req.user?.idc
    try {
        const [rows] = await pool.query(
            'SELECT idc, name, email, img, telefone, created_at FROM cliente WHERE idc = ?', [idc]
        )
        if (!rows.length) return res.status(404).json({ error: 'Cliente não encontrado' })
        res.json(rows[0])
    } catch {
        res.status(500).json({ error: 'Erro ao buscar perfil' })
    }
}

export async function updateMeClient(req, res) {
    const idc = req.cliente?.idc ?? req.user?.idc
    const { name, currentPassword, newPassword } = req.body
    if (!name && !newPassword && !req.file)
        return res.status(400).json({ error: 'Envie ao menos name, newPassword ou uma imagem' })
    try {
        const [rows] = await pool.query('SELECT * FROM cliente WHERE idc = ?', [idc])
        if (!rows.length) {
            if (req.file) fs.unlink(req.file.path, () => {})
            return res.status(404).json({ error: 'Cliente não encontrado' })
        }
        const cliente = rows[0]
        const updates = [], params = []
        if (name) { updates.push('name=?'); params.push(name) }
        if (req.file) {
            const newImg = 'uploads/' + path.basename(req.file.path)
            updates.push('img=?'); params.push(newImg)
            if (cliente.img) fs.unlink(cliente.img, () => {})
        }
        if (newPassword) {
            if (!currentPassword) {
                if (req.file) fs.unlink(req.file.path, () => {})
                return res.status(400).json({ error: 'Envie currentPassword para trocar a senha' })
            }
            const match = await bcrypt.compare(currentPassword, cliente.password)
            if (!match) {
                if (req.file) fs.unlink(req.file.path, () => {})
                return res.status(401).json({ error: 'Senha atual incorreta' })
            }
            const hash = await bcrypt.hash(newPassword, 10)
            updates.push('password=?'); params.push(hash)
        }
        params.push(idc)
        await pool.query(`UPDATE cliente SET ${updates.join(', ')} WHERE idc=?`, params)
        const [fresh] = await pool.query(
            'SELECT idc, name, email, img, telefone, created_at FROM cliente WHERE idc=?', [idc]
        )
        res.json(fresh[0])
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {})
        res.status(500).json({ error: 'Erro ao atualizar' })
    }
}
