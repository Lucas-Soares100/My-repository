import { pool } from '../db.js'
import fs from 'fs'
import bcrypt from 'bcrypt'
import path from 'path'

// Criar Usuário ADM
export async function createUserADM(req, res) {
    const { name, email, telefone } = req.body
    if (!name || !email || !telefone) {
        if (req.file) fs.unlink(req.file.path, () => {})
        return res.status(400).json({ error: 'Nome, Email e Telefone são obrigatórios' })
    }
    const imgPath = req.file ? 'uploads/' + path.basename(req.file.path) : null
    try {
        const [result] = await pool.query(
            'INSERT INTO adm (name, email, img, telefone) VALUES (?,?,?,?)',
            [name, email, imgPath, telefone]
        )
        res.status(201).json({ ra: result.insertId, img: imgPath })
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {})
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Administrador já cadastrado' })
        res.status(500).json({ error: 'Erro ao criar Administrador' })
    }
}

// Listar Todos
export async function getUsersADM(_, res) {
    try {
        const [rows] = await pool.query(
            'SELECT ra, name, email, img, telefone, created_at FROM adm ORDER BY ra DESC'
        )
        res.json(rows)
    } catch {
        res.status(500).json({ error: 'Erro ao listar Administrador' })
    }
}

// Buscar por RA
export async function getADMByRA(req, res) {
    const { ra } = req.params
    try {
        const [rows] = await pool.query(
            'SELECT ra, name, email, img, telefone, created_at FROM adm WHERE ra = ?',
            [ra]
        )
        if (rows.length === 0)
            return res.status(404).json({ error: 'Administrador não encontrado' })
        res.json(rows[0])
    } catch {
        res.status(500).json({ error: 'Erro ao Buscar Administrador' })
    }
}

// PUT (Alterar) — telefone estava faltando na desestruturação
export async function updateUserADM(req, res) {
    const { ra } = req.params
    const { name, email, telefone } = req.body   // adicionado telefone
    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios!' })
    }
    try {
        const [rows] = await pool.query('SELECT * FROM adm WHERE ra = ?', [ra])
        if (rows.length === 0)
            return res.status(404).json({ error: 'Administrador não encontrado' })
        const oldImg = rows[0].img
        const newImg = req.file ? 'uploads/' + path.basename(req.file.path) : oldImg
        const [result] = await pool.query(
            'UPDATE adm SET name = ?, email = ?, img = ?, telefone = ? WHERE ra = ?',
            [name, email, newImg, telefone || rows[0].telefone, ra]
        )
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Administrador não encontrado' })
        if (req.file && oldImg)
            fs.unlink(oldImg, err => { if (err) console.warn('Remover:', err) })
        const [updated] = await pool.query(
            'SELECT ra, name, email, img, telefone, created_at FROM adm WHERE ra = ?',
            [ra]
        )
        res.json(updated[0])
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Email já cadastrado' })
        res.status(500).json({ error: 'Erro ao atualizar Administrador' })
    }
}

// DELETE
export async function deleteUserADM(req, res) {
    const { ra } = req.params
    // req.adm é populado pelo middleware corrigido
    if (parseInt(ra, 10) !== req.adm?.ra)
        return res.status(403).json({ error: 'Você só pode deletar a própria conta' })
    try {
        const [rows] = await pool.query('SELECT * FROM adm WHERE ra = ?', [ra])
        if (rows.length === 0)
            return res.status(404).json({ error: 'Usuário não encontrado!' })
        const imgPath = rows[0].img
        await pool.query('DELETE FROM adm WHERE ra = ?', [ra])
        if (imgPath) fs.unlink(imgPath, err => { if (err) console.warn('Remover:', err) })
        res.json({ message: 'Usuário excluído com sucesso' })
    } catch {
        res.status(500).json({ error: 'Erro ao excluir usuário' })
    }
}

// Perfil do Usuário Logado
export async function profileADM(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT ra, name, email, img, telefone, created_at FROM adm WHERE ra = ?',
            [req.adm?.ra]   // era req.adm.ra mas req.adm não existia
        )
        if (!rows.length)
            return res.status(404).json({ error: 'Administrador não encontrado' })
        res.json(rows[0])
    } catch {
        res.status(500).json({ error: 'Erro ao buscar o perfil' })
    }
}

// UpdateMe
export async function updateMeADM(req, res) {
    const { name, currentPassword, newPassword } = req.body
    if (!name && !newPassword)
        return res.status(400).json({ error: 'Envie ao menos o name ou newPassword' })
    try {
        const [rows] = await pool.query('SELECT * FROM adm WHERE ra = ?', [req.adm?.ra])
        if (!rows.length)
            return res.status(404).json({ error: 'Administrador não encontrado' })
        const adm = rows[0]
        const updates = [], params = []
        if (name) { updates.push('name=?'); params.push(name) }
        if (newPassword) {
            if (!currentPassword)
                return res.status(400).json({ error: 'Envie currentPassword para trocar a senha' })
            const match = await bcrypt.compare(currentPassword, adm.password)
            if (!match)
                return res.status(401).json({ error: 'Senha Atual Incorreta' })
            const hash = await bcrypt.hash(newPassword, 10)
            updates.push('password=?')
            params.push(hash)
        }
        params.push(req.adm?.ra)
        await pool.query(`UPDATE adm SET ${updates.join(', ')} WHERE ra = ?`, params)
        const [fresh] = await pool.query(
            'SELECT ra, name, email, img, telefone, created_at FROM adm WHERE ra = ?',  // era 'users'
            [req.adm?.ra]
        )
        res.json(fresh[0])
    } catch (err) {
        console.log('ERRO', err.message)
        res.status(500).json({ error: 'Erro ao atualizar' })
    }
}
