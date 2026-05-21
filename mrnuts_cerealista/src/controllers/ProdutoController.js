import { pool } from '../db.js'
import fs from 'fs'
import path from 'path'

// Listar todos os produtos (rota aberta)
export async function getProdutos(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM produtos ORDER BY created_at DESC'
        )
        res.json(rows)
    } catch {
        res.status(500).json({ error: 'Erro ao listar produtos' })
    }
}

// Buscar produto por ID
export async function getProdutoById(req, res) {
    const { id } = req.params
    try {
        const [rows] = await pool.query(
            'SELECT * FROM produtos WHERE Cod_produto = ?', [id]
        )
        if (!rows.length)
            return res.status(404).json({ error: 'Produto não encontrado' })
        res.json(rows[0])
    } catch {
        res.status(500).json({ error: 'Erro ao buscar produto' })
    }
}

// Criar produto (fornecedor autenticado)
export async function createProduto(req, res) {
    // id_fornecedor vem do token (req.fornecedor.idf)
    const id_fornecedor = req.fornecedor?.idf ?? req.user?.idf
    if (!id_fornecedor)
        return res.status(403).json({ error: 'Apenas fornecedores podem publicar produtos' })

    const { Titulo, Link, Descricao, Categoria, Preco } = req.body
    if (!Titulo || !Categoria || !Link)
        return res.status(400).json({ error: 'Título, link e categoria são obrigatórios' })

    // Processar múltiplas imagens
    const files = req.files || []
    const img_capa = files.length > 0 ? 'uploads/' + path.basename(files[0].path) : null
    const img_galeria = files.length > 1 
        ? JSON.stringify(files.slice(1).map(f => 'uploads/' + path.basename(f.path)))
        : null

    try {
        const [result] = await pool.query(
            'INSERT INTO produtos (Titulo, Link, Descricao, Categoria, Preco, img_capa, img_galeria, id_fornecedor) VALUES (?,?,?,?,?,?,?,?)',
            [Titulo, Link, Descricao || null, Categoria, Preco || null, img_capa, img_galeria, id_fornecedor]
        )
        res.status(201).json({ 
            Cod_produto: result.insertId, 
            Titulo, 
            Link, 
            Categoria,
            Preco: Preco || null,
            img_capa: img_capa,
            img_galeria: img_galeria ? JSON.parse(img_galeria) : []
        })
    } catch (err) {
        files.forEach(f => fs.unlink(f.path, () => {}))
        res.status(500).json({ error: 'Erro ao criar produto' })
    }
}

// Atualizar produto (apenas o próprio fornecedor)
export async function updateProduto(req, res) {
    const { id } = req.params
    const id_fornecedor = req.fornecedor?.idf ?? req.user?.idf
    try {
        const [rows] = await pool.query('SELECT * FROM produtos WHERE Cod_produto = ?', [id])
        if (!rows.length)
            return res.status(404).json({ error: 'Produto não encontrado' })
        if (rows[0].id_fornecedor !== id_fornecedor)
            return res.status(403).json({ error: 'Você só pode editar seus próprios produtos' })

        const { Titulo, Link, Descricao, Categoria, Preco } = req.body
        const oldImgCapa = rows[0].img_capa
        const oldImgGaleria = rows[0].img_galeria ? JSON.parse(rows[0].img_galeria) : []
        
        // Processar múltiplas imagens
        const files = req.files || []
        const newImgCapa = files.length > 0 ? 'uploads/' + path.basename(files[0].path) : oldImgCapa
        const newImgGaleria = files.length > 1 
            ? JSON.stringify(files.slice(1).map(f => 'uploads/' + path.basename(f.path)))
            : rows[0].img_galeria

        await pool.query(
            'UPDATE produtos SET Titulo=?, Link=?, Descricao=?, Categoria=?, Preco=?, img_capa=?, img_galeria=? WHERE Cod_produto=?',
            [Titulo || rows[0].Titulo, Link || rows[0].Link, Descricao ?? rows[0].Descricao, Categoria || rows[0].Categoria, Preco !== undefined ? Preco : rows[0].Preco, newImgCapa, newImgGaleria, id]
        )

        // Deletar imagens antigas se foram substituídas
        if (files.length > 0 && oldImgCapa && oldImgCapa !== newImgCapa) 
            fs.unlink(oldImgCapa, () => {})
        if (files.length > 1 && oldImgGaleria.length > 0) 
            oldImgGaleria.forEach(img => fs.unlink(img, () => {}))

        const [updated] = await pool.query('SELECT * FROM produtos WHERE Cod_produto=?', [id])
        const produto = updated[0]
        produto.img_galeria = produto.img_galeria ? JSON.parse(produto.img_galeria) : []
        res.json(produto)
    } catch {
        const files = req.files || []
        files.forEach(f => fs.unlink(f.path, () => {}))
        res.status(500).json({ error: 'Erro ao atualizar produto' })
    }
}

// Deletar produto (apenas o próprio fornecedor ou ADM)
export async function deleteProduto(req, res) {
    const { id } = req.params
    const id_fornecedor = req.fornecedor?.idf ?? req.user?.idf
    const isAdm = req.adm?.ra !== undefined
    try {
        const [rows] = await pool.query('SELECT * FROM produtos WHERE Cod_produto = ?', [id])
        if (!rows.length)
            return res.status(404).json({ error: 'Produto não encontrado' })
        if (!isAdm && rows[0].id_fornecedor !== id_fornecedor)
            return res.status(403).json({ error: 'Você só pode remover seus próprios produtos' })

        const imgCapaPath = rows[0].img_capa
        const imgGaleriaList = rows[0].img_galeria ? JSON.parse(rows[0].img_galeria) : []
        
        await pool.query('DELETE FROM produtos WHERE Cod_produto = ?', [id])
        
        // Deletar todas as imagens
        if (imgCapaPath) fs.unlink(imgCapaPath, () => {})
        imgGaleriaList.forEach(img => fs.unlink(img, () => {}))
        
        res.json({ message: 'Produto removido com sucesso' })
    } catch {
        res.status(500).json({ error: 'Erro ao deletar produto' })
    }
}
