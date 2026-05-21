import { pool } from '../db.js'

export async function listarAvaliacoes(req, res) {
    try {
        const { id } = req.params
        const [rows] = await pool.query(
            `SELECT a.id, a.nota, a.comentario, a.created_at, 
                    c.idc as cliente_id, c.name AS nome_cliente, c.img as cliente_img
             FROM avaliacoes a
             JOIN cliente c ON c.idc = a.cliente_id
             WHERE a.produto_id = ?
             ORDER BY a.created_at DESC`,
            [id]
        )
        const media = rows.length ? rows.reduce((s, r) => s + Number(r.nota), 0) / rows.length : 0
        res.json({ avaliacoes: rows, media: Number(media.toFixed(1)), total: rows.length })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export async function criarAvaliacao(req, res) {
    try {
        const { produto_id, nota, comentario } = req.body
        const cliente_id = req.cliente?.idc

        if (!cliente_id) return res.status(403).json({ error: 'Apenas clientes podem avaliar' })
        if (!produto_id || nota === undefined) return res.status(400).json({ error: 'produto_id e nota são obrigatórios' })

        const notaNum = Number(nota)
        if (notaNum < 0.5 || notaNum > 5 || (notaNum * 2) % 1 !== 0)
            return res.status(400).json({ error: 'Nota deve ser entre 0.5 e 5 em intervalos de 0.5' })

        const [existe] = await pool.query(
            'SELECT id FROM avaliacoes WHERE produto_id = ? AND cliente_id = ?',
            [produto_id, cliente_id]
        )
        if (existe.length) return res.status(409).json({ error: 'Você já avaliou este produto' })

        await pool.query(
            'INSERT INTO avaliacoes (produto_id, cliente_id, nota, comentario) VALUES (?, ?, ?, ?)',
            [produto_id, cliente_id, notaNum, comentario || null]
        )

        await atualizarReputacaoFornecedor(produto_id)
        res.status(201).json({ message: 'Avaliação criada com sucesso' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export async function excluirAvaliacao(req, res) {
    try {
        const { id } = req.params
        const cliente_id = req.cliente?.idc
        const adm = req.adm

        const [rows] = await pool.query('SELECT * FROM avaliacoes WHERE id = ?', [id])
        if (!rows.length) return res.status(404).json({ error: 'Avaliação não encontrada' })

        const avaliacao = rows[0]

        if (!adm && avaliacao.cliente_id !== cliente_id)
            return res.status(403).json({ error: 'Sem permissão para excluir esta avaliação' })

        await pool.query('DELETE FROM avaliacoes WHERE id = ?', [id])
        await atualizarReputacaoFornecedor(avaliacao.produto_id)

        res.json({ message: 'Avaliação excluída' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

async function atualizarReputacaoFornecedor(produto_id) {
    const [[produto]] = await pool.query('SELECT id_fornecedor FROM produtos WHERE Cod_produto = ?', [produto_id])
    if (!produto) return

    const [[{ media }]] = await pool.query(
        `SELECT AVG(a.nota) AS media
         FROM avaliacoes a
         JOIN produtos p ON p.Cod_produto = a.produto_id
         WHERE p.id_fornecedor = ?`,
        [produto.id_fornecedor]
    )

    const reputacao = media ? Math.round((Number(media) / 5) * 100) : 0
    await pool.query('UPDATE fornecedor SET reputacao = ? WHERE id_fornecedor = ?', [reputacao, produto.id_fornecedor])
}
