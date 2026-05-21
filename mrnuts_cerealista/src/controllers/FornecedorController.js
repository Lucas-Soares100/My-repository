import { pool } from '../db.js'
import fs from 'fs'
import bcrypt from 'bcrypt'
import path from 'path'

export async function createUserFornecedor(req, res) {
    const { name, cnpj, email } = req.body
    if (!name || !cnpj || !email) {
        if (req.file) fs.unlink(req.file.path, () => {})
        return res.status(400).json({ error: 'Nome, CNPJ e Email são obrigatórios' })
    }
    const imgPath = req.file ? 'uploads/' + path.basename(req.file.path) : null
    try {
        const [result] = await pool.query(
            'INSERT INTO fornecedor (name, cnpj, email, img) VALUES (?,?,?,?)',
            [name, cnpj, email, imgPath]
        )
        res.status(201).json({ id_fornecedor: result.insertId, img: imgPath })
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {})
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Fornecedor já cadastrado' })
        res.status(500).json({ error: 'Erro ao criar Fornecedor' })
    }
}

export async function getUsersFornecedor(_, res) {
    try {
        const [rows] = await pool.query(
            'SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor ORDER BY id_fornecedor DESC'
        )
        res.json(rows)
    } catch {
        res.status(500).json({ error: 'Erro ao listar Fornecedores' })
    }
}

export async function getFornecedorByID(req, res) {
    const { idf } = req.params
    try {
        const [rows] = await pool.query(
            'SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor WHERE id_fornecedor = ?', [idf]
        )
        if (!rows.length) return res.status(404).json({ error: 'Fornecedor não encontrado' })
        res.json(rows[0])
    } catch {
        res.status(500).json({ error: 'Erro ao buscar Fornecedor' })
    }
}

export async function updateUserFornecedor(req, res) {
    const { idf } = req.params
    const { name, email, cnpj } = req.body
    if (!name || !email)
        return res.status(400).json({ error: 'Nome e email são obrigatórios!' })
    try {
        const [rows] = await pool.query('SELECT * FROM fornecedor WHERE id_fornecedor = ?', [idf])
        if (!rows.length) return res.status(404).json({ error: 'Fornecedor não encontrado' })
        const oldImg = rows[0].img
        const newImg = req.file ? 'uploads/' + path.basename(req.file.path) : oldImg
        const [result] = await pool.query(
            'UPDATE fornecedor SET name=?, cnpj=?, email=?, img=? WHERE id_fornecedor=?',
            [name, cnpj || rows[0].cnpj, email, newImg, idf]
        )
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Fornecedor não encontrado' })
        if (req.file && oldImg) fs.unlink(oldImg, () => {})
        const [updated] = await pool.query('SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor WHERE id_fornecedor=?', [idf])
        res.json(updated[0])
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Email ou CNPJ já cadastrado' })
        res.status(500).json({ error: 'Erro ao atualizar Fornecedor' })
    }
}

export async function deleteUserFornecedor(req, res) {
    const { idf } = req.params
    const isAdm   = req.adm?.ra !== undefined
    const selfIdf = req.fornecedor?.idf
    if (!isAdm && parseInt(idf, 10) !== selfIdf)
        return res.status(403).json({ error: 'Você só pode deletar a própria conta' })
    try {
        const [rows] = await pool.query('SELECT * FROM fornecedor WHERE id_fornecedor = ?', [idf])
        if (!rows.length) return res.status(404).json({ error: 'Fornecedor não encontrado' })
        const imgPath = rows[0].img
        await pool.query('DELETE FROM fornecedor WHERE id_fornecedor = ?', [idf])
        if (imgPath) fs.unlink(imgPath, () => {})
        res.json({ message: 'Conta excluída com sucesso' })
    } catch {
        res.status(500).json({ error: 'Erro ao excluir Fornecedor' })
    }
}

export async function profileFornecedor(req, res) {
    const idf = req.fornecedor?.idf ?? req.user?.idf
    try {
        const [rows] = await pool.query(
            'SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor WHERE id_fornecedor = ?', [idf]
        )
        if (!rows.length) return res.status(404).json({ error: 'Fornecedor não encontrado' })
        res.json(rows[0])
    } catch {
        res.status(500).json({ error: 'Erro ao buscar perfil' })
    }
}

export async function updateMeFornecedor(req, res) {
    const idf = req.fornecedor?.idf ?? req.user?.idf
    const { name, currentPassword, newPassword } = req.body
    if (!name && !newPassword && !req.file)
        return res.status(400).json({ error: 'Envie ao menos name, newPassword ou uma imagem' })
    try {
        const [rows] = await pool.query('SELECT * FROM fornecedor WHERE id_fornecedor = ?', [idf])
        if (!rows.length) {
            if (req.file) fs.unlink(req.file.path, () => {})
            return res.status(404).json({ error: 'Fornecedor não encontrado' })
        }
        const fornecedor = rows[0]
        const updates = [], params = []
        if (name) { updates.push('name=?'); params.push(name) }
        if (req.file) {
            const newImg = 'uploads/' + path.basename(req.file.path)
            updates.push('img=?'); params.push(newImg)
            if (fornecedor.img) fs.unlink(fornecedor.img, () => {})
        }
        if (newPassword) {
            if (!currentPassword) {
                if (req.file) fs.unlink(req.file.path, () => {})
                return res.status(400).json({ error: 'Envie currentPassword para trocar a senha' })
            }
            const match = await bcrypt.compare(currentPassword, fornecedor.password)
            if (!match) {
                if (req.file) fs.unlink(req.file.path, () => {})
                return res.status(401).json({ error: 'Senha atual incorreta' })
            }
            const hash = await bcrypt.hash(newPassword, 10)
            updates.push('password=?'); params.push(hash)
        }
        params.push(idf)
        await pool.query(`UPDATE fornecedor SET ${updates.join(', ')} WHERE id_fornecedor=?`, params)
        const [fresh] = await pool.query(
            'SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor WHERE id_fornecedor=?', [idf]
        )
        res.json(fresh[0])
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {})
        res.status(500).json({ error: 'Erro ao atualizar' })
    }
}
