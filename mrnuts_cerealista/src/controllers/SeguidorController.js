import { pool } from '../db.js'

export async function seguirFornecedor(req, res) {
    try {
        const fornecedor_id = Number(req.params.id)
        const cliente_id    = req.cliente?.idc
        if (!cliente_id) return res.status(403).json({ error: 'Apenas clientes podem seguir fornecedores' })

        await pool.query(
            'INSERT IGNORE INTO seguidores (cliente_id, fornecedor_id) VALUES (?, ?)',
            [cliente_id, fornecedor_id]
        )
        await _sincronizarContador(fornecedor_id)
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM seguidores WHERE fornecedor_id = ?', [fornecedor_id]
        )
        res.status(201).json({ message: 'Seguindo', seguidores: total })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export async function deixarDeSeguirFornecedor(req, res) {
    try {
        const fornecedor_id = Number(req.params.id)
        const cliente_id    = req.cliente?.idc
        if (!cliente_id) return res.status(403).json({ error: 'Apenas clientes podem deixar de seguir' })

        await pool.query(
            'DELETE FROM seguidores WHERE cliente_id = ? AND fornecedor_id = ?',
            [cliente_id, fornecedor_id]
        )
        await _sincronizarContador(fornecedor_id)
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM seguidores WHERE fornecedor_id = ?', [fornecedor_id]
        )
        res.json({ message: 'Deixou de seguir', seguidores: total })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export async function listarSeguindoCliente(req, res) {
    try {
        const cliente_id = req.cliente?.idc
        if (!cliente_id) return res.status(403).json({ error: 'Token inválido' })

        const [rows] = await pool.query(
            `SELECT f.id_fornecedor, f.name, f.email, f.img, f.reputacao, f.seguidores, s.created_at AS seguindo_desde
             FROM seguidores s
             JOIN fornecedor f ON f.id_fornecedor = s.fornecedor_id
             WHERE s.cliente_id = ?
             ORDER BY s.created_at DESC`,
            [cliente_id]
        )
        res.json(rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export async function buscarSeguidoresFornecedor(req, res) {
    try {
        const fornecedor_id = Number(req.params.id)
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM seguidores WHERE fornecedor_id = ?', [fornecedor_id]
        )

        // Verifica se o cliente logado (se houver) está seguindo
        const cliente_id = req.cliente?.idc || null
        let seguindo = false
        if (cliente_id) {
            const [[{ existe }]] = await pool.query(
                'SELECT COUNT(*) AS existe FROM seguidores WHERE cliente_id = ? AND fornecedor_id = ?',
                [cliente_id, fornecedor_id]
            )
            seguindo = existe > 0
        }

        res.json({ total, seguindo })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export async function buscarAnalyticsSeguidores(req, res) {
    try {
        const fornecedor_id = req.fornecedor?.idf
        if (!fornecedor_id) return res.status(403).json({ error: 'Apenas fornecedores podem ver analytics' })

        // Crescimento mensal dos últimos 6 meses
        const [rows] = await pool.query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS mes,
                DATE_FORMAT(created_at, '%b/%Y')  AS label,
                COUNT(*) AS novos
             FROM seguidores
             WHERE fornecedor_id = ?
               AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY mes, label
             ORDER BY mes ASC`,
            [fornecedor_id]
        )

        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM seguidores WHERE fornecedor_id = ?', [fornecedor_id]
        )

        res.json({ crescimento: rows, total })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

async function _sincronizarContador(fornecedor_id) {
    await pool.query(
        `UPDATE fornecedor
         SET seguidores = (SELECT COUNT(*) FROM seguidores WHERE fornecedor_id = ?)
         WHERE id_fornecedor = ?`,
        [fornecedor_id, fornecedor_id]
    )
}
