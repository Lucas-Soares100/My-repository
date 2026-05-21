import { pool } from '../db.js'

// ═══════════════════════════════════════════════════════════════════════════
// ADICIONAR PRODUTO AOS FAVORITOS
// ═══════════════════════════════════════════════════════════════════════════
export async function adicionarFavorito(req, res) {
    try {
        const cliente_id = req.cliente?.idc
        const { produto_id } = req.body

        console.log('🔍 adicionarFavorito:', { cliente_id, produto_id, body: req.body })

        if (!cliente_id) {
            return res.status(403).json({ error: 'Apenas clientes podem favoritar produtos' })
        }

        if (!produto_id) {
            return res.status(400).json({ error: 'ID do produto é obrigatório' })
        }

        // Verifica se o produto existe
        const [produto] = await pool.query('SELECT Cod_produto FROM produtos WHERE Cod_produto = ?', [produto_id])
        if (!produto.length) {
            return res.status(404).json({ error: 'Produto não encontrado' })
        }

        // Insere o favorito (INSERT IGNORE ignora duplicatas)
        await pool.query(
            'INSERT IGNORE INTO favoritos (cliente_id, produto_id) VALUES (?, ?)',
            [cliente_id, produto_id]
        )

        res.status(201).json({ message: 'Produto adicionado aos favoritos', produto_id })
    } catch (err) {
        console.error('❌ Erro em adicionarFavorito:', err)
        res.status(500).json({ error: err.message })
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// REMOVER PRODUTO DOS FAVORITOS
// ═══════════════════════════════════════════════════════════════════════════
export async function removerFavorito(req, res) {
    try {
        const cliente_id = req.cliente?.idc
        const { produto_id } = req.body

        if (!cliente_id) {
            return res.status(403).json({ error: 'Apenas clientes podem desfavoritar produtos' })
        }

        if (!produto_id) {
            return res.status(400).json({ error: 'ID do produto é obrigatório' })
        }

        // Remove o favorito
        await pool.query(
            'DELETE FROM favoritos WHERE cliente_id = ? AND produto_id = ?',
            [cliente_id, produto_id]
        )

        res.json({ message: 'Produto removido dos favoritos', produto_id })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTAR FAVORITOS DO CLIENTE
// ═══════════════════════════════════════════════════════════════════════════
export async function listarFavoritos(req, res) {
    try {
        const cliente_id = req.cliente?.idc

        if (!cliente_id) {
            return res.status(403).json({ error: 'Apenas clientes podem listar favoritos' })
        }

        const [favoritos] = await pool.query(
            `SELECT p.Cod_produto, p.Titulo, p.Descricao, p.Categoria, p.Preco, 
                    p.img_capa, p.id_fornecedor, f.name as fornecedor_nome, f.img as fornecedor_img
             FROM favoritos fav
             JOIN produtos p ON fav.produto_id = p.Cod_produto
             JOIN fornecedor f ON p.id_fornecedor = f.id_fornecedor
             WHERE fav.cliente_id = ?
             ORDER BY fav.created_at DESC`,
            [cliente_id]
        )

        res.json(favoritos)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICAR SE PRODUTO É FAVORITO
// ═══════════════════════════════════════════════════════════════════════════
export async function verificarFavorito(req, res) {
    try {
        const cliente_id = req.cliente?.idc
        const { produto_id } = req.params

        if (!cliente_id) {
            return res.status(403).json({ error: 'Apenas clientes podem verificar favoritos' })
        }

        const [[{ existe }]] = await pool.query(
            'SELECT COUNT(*) AS existe FROM favoritos WHERE cliente_id = ? AND produto_id = ?',
            [cliente_id, produto_id]
        )

        res.json({ isFavorite: existe > 0, produto_id })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}
