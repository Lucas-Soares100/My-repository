import { pool } from '../db.js'
import fs from 'fs'
import bcrypt from 'bcrypt'

// ══════════════════════════════════════════════════════════════════
// ── CLIENTES - CRUD Completo (Admin)
// ══════════════════════════════════════════════════════════════════
export async function getAllClientes(req, res) {
  try {
    const [clientes] = await pool.query(
      'SELECT idc, name, email, img, telefone, created_at FROM cliente ORDER BY created_at DESC'
    )
    res.json(clientes)
  } catch (err) {
    console.error('Erro ao listar clientes:', err)
    res.status(500).json({ error: 'Erro ao listar clientes' })
  }
}

export async function createCliente(req, res) {
  const { name, email, telefone, password } = req.body

  if (!name || !email || !telefone || !password)
    return res.status(400).json({ error: 'Nome, email, telefone e senha são obrigatórios' })

  try {
    const [exists] = await pool.query('SELECT idc FROM cliente WHERE email = ?', [email])
    if (exists.length) return res.status(409).json({ error: 'Email já cadastrado' })

    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO cliente (name, email, telefone, password) VALUES (?, ?, ?, ?)',
      [name, email, telefone, hash]
    )

    const [rows] = await pool.query(
      'SELECT idc, name, email, img, telefone, created_at FROM cliente WHERE idc = ?',
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email já cadastrado' })

    console.error('Erro ao criar cliente:', err)
    res.status(500).json({ error: 'Erro ao criar cliente' })
  }
}

export async function getClienteById(req, res) {
  const { idc } = req.params
  try {
    const [cliente] = await pool.query(
      'SELECT idc, name, email, img, telefone, created_at FROM cliente WHERE idc = ?',
      [idc]
    )
    if (!cliente.length)
      return res.status(404).json({ error: 'Cliente não encontrado' })
    res.json(cliente[0])
  } catch (err) {
    console.error('Erro ao buscar cliente:', err)
    res.status(500).json({ error: 'Erro ao buscar cliente' })
  }
}

export async function updateCliente(req, res) {
  const { idc } = req.params
  const { name, email, telefone } = req.body
  if (!name || !email || !telefone)
    return res.status(400).json({ error: 'Nome, email e telefone são obrigatórios' })
  try {
    const [cliente] = await pool.query('SELECT * FROM cliente WHERE idc = ?', [idc])
    if (!cliente.length)
      return res.status(404).json({ error: 'Cliente não encontrado' })

    const [updated] = await pool.query(
      'UPDATE cliente SET name = ?, email = ?, telefone = ? WHERE idc = ?',
      [name, email, telefone, idc]
    )
    if (updated.affectedRows === 0)
      return res.status(404).json({ error: 'Cliente não encontrado' })

    const [result] = await pool.query(
      'SELECT idc, name, email, img, telefone, created_at FROM cliente WHERE idc = ?',
      [idc]
    )
    res.json(result[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email já cadastrado' })
    console.error('Erro ao atualizar cliente:', err)
    res.status(500).json({ error: 'Erro ao atualizar cliente' })
  }
}

export async function deleteCliente(req, res) {
  const { idc } = req.params
  try {
    const [cliente] = await pool.query('SELECT * FROM cliente WHERE idc = ?', [idc])
    if (!cliente.length)
      return res.status(404).json({ error: 'Cliente não encontrado' })

    const imgPath = cliente[0].img
    await pool.query('DELETE FROM favoritos WHERE cliente_id = ?', [idc])
    await pool.query('DELETE FROM seguidores WHERE cliente_id = ?', [idc])
    await pool.query('DELETE FROM avaliacoes WHERE cliente_id = ?', [idc])
    await pool.query('DELETE FROM cliente WHERE idc = ?', [idc])

    if (imgPath && fs.existsSync(imgPath))
      fs.unlink(imgPath, err => { if (err) console.warn('Erro ao remover imagem:', err) })

    res.json({ message: 'Cliente deletado com sucesso' })
  } catch (err) {
    console.error('Erro ao deletar cliente:', err)
    res.status(500).json({ error: 'Erro ao deletar cliente' })
  }
}

// ══════════════════════════════════════════════════════════════════
// ── FORNECEDORES - CRUD Completo (Admin)
// ══════════════════════════════════════════════════════════════════
export async function getAllFornecedores(req, res) {
  try {
    const [fornecedores] = await pool.query(
      'SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor ORDER BY created_at DESC'
    )
    res.json(fornecedores)
  } catch (err) {
    console.error('Erro ao listar fornecedores:', err)
    res.status(500).json({ error: 'Erro ao listar fornecedores' })
  }
}

export async function createFornecedor(req, res) {
  const { name, cnpj, email, password } = req.body

  if (!name || !cnpj || !email || !password)
    return res.status(400).json({ error: 'Nome, CNPJ, email e senha são obrigatórios' })

  try {
    const [exists] = await pool.query(
      'SELECT id_fornecedor FROM fornecedor WHERE email = ? OR cnpj = ?',
      [email, cnpj]
    )
    if (exists.length) return res.status(409).json({ error: 'Email ou CNPJ já cadastrado' })

    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO fornecedor (name, cnpj, email, password) VALUES (?, ?, ?, ?)',
      [name, cnpj, email, hash]
    )

    const [rows] = await pool.query(
      'SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor WHERE id_fornecedor = ?',
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email ou CNPJ já cadastrado' })

    console.error('Erro ao criar fornecedor:', err)
    res.status(500).json({ error: 'Erro ao criar fornecedor' })
  }
}

export async function getFornecedorById(req, res) {
  const { idf } = req.params
  try {
    const [fornecedor] = await pool.query(
      'SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor WHERE id_fornecedor = ?',
      [idf]
    )
    if (!fornecedor.length)
      return res.status(404).json({ error: 'Fornecedor não encontrado' })
    res.json(fornecedor[0])
  } catch (err) {
    console.error('Erro ao buscar fornecedor:', err)
    res.status(500).json({ error: 'Erro ao buscar fornecedor' })
  }
}

export async function updateFornecedor(req, res) {
  const { idf } = req.params
  const { name, cnpj, email } = req.body
  if (!name || !cnpj || !email)
    return res.status(400).json({ error: 'Nome, CNPJ e email são obrigatórios' })
  try {
    const [fornecedor] = await pool.query('SELECT * FROM fornecedor WHERE id_fornecedor = ?', [idf])
    if (!fornecedor.length)
      return res.status(404).json({ error: 'Fornecedor não encontrado' })

    const [updated] = await pool.query(
      'UPDATE fornecedor SET name = ?, cnpj = ?, email = ? WHERE id_fornecedor = ?',
      [name, cnpj, email, idf]
    )
    if (updated.affectedRows === 0)
      return res.status(404).json({ error: 'Fornecedor não encontrado' })

    const [result] = await pool.query(
      'SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor WHERE id_fornecedor = ?',
      [idf]
    )
    res.json(result[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'CNPJ ou Email já cadastrado' })
    console.error('Erro ao atualizar fornecedor:', err)
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' })
  }
}

export async function deleteFornecedor(req, res) {
  const { idf } = req.params
  try {
    const [fornecedor] = await pool.query('SELECT * FROM fornecedor WHERE id_fornecedor = ?', [idf])
    if (!fornecedor.length)
      return res.status(404).json({ error: 'Fornecedor não encontrado' })

    const imgPath = fornecedor[0].img
    const [produtos] = await pool.query('SELECT * FROM produtos WHERE id_fornecedor = ?', [idf])

    for (const produto of produtos) {
      if (produto.img_capa && fs.existsSync(produto.img_capa))
        fs.unlink(produto.img_capa, err => { if (err) console.warn('Erro ao remover imagem:', err) })

      if (produto.img_galeria) {
        try {
          const galeria = JSON.parse(produto.img_galeria)
          if (Array.isArray(galeria)) {
            galeria.forEach(img => {
              if (fs.existsSync(img))
                fs.unlink(img, err => { if (err) console.warn('Erro ao remover imagem:', err) })
            })
          }
        } catch (e) { console.warn('Erro ao processar galeria:', e) }
      }
    }

    await pool.query('DELETE FROM seguidores WHERE fornecedor_id = ?', [idf])
    await pool.query('DELETE FROM favoritos WHERE produto_id IN (SELECT Cod_produto FROM produtos WHERE id_fornecedor = ?)', [idf])
    await pool.query('DELETE FROM avaliacoes WHERE produto_id IN (SELECT Cod_produto FROM produtos WHERE id_fornecedor = ?)', [idf])
    await pool.query('DELETE FROM produtos WHERE id_fornecedor = ?', [idf])
    await pool.query('DELETE FROM fornecedor WHERE id_fornecedor = ?', [idf])

    if (imgPath && fs.existsSync(imgPath))
      fs.unlink(imgPath, err => { if (err) console.warn('Erro ao remover imagem:', err) })

    res.json({ message: 'Fornecedor e seus produtos deletados com sucesso' })
  } catch (err) {
    console.error('Erro ao deletar fornecedor:', err)
    res.status(500).json({ error: 'Erro ao deletar fornecedor' })
  }
}

// ══════════════════════════════════════════════════════════════════
// ── PRODUTOS - CRUD Completo (Admin)
// ══════════════════════════════════════════════════════════════════
export async function getAllProdutos(req, res) {
  try {
    const [produtos] = await pool.query(
      `SELECT p.Cod_produto, p.Titulo, p.Link, p.Descricao, p.Categoria, p.Preco,
              p.img_capa, p.id_fornecedor, f.name AS fornecedor_nome, p.created_at
       FROM produtos p
       JOIN fornecedor f ON f.id_fornecedor = p.id_fornecedor
       ORDER BY p.created_at DESC`
    )
    res.json(produtos)
  } catch (err) {
    console.error('Erro ao listar produtos:', err)
    res.status(500).json({ error: 'Erro ao listar produtos' })
  }
}

export async function createProduto(req, res) {
  const { Titulo, Link, Descricao, Categoria, Preco, id_fornecedor } = req.body

  if (!Titulo || !Categoria || !id_fornecedor)
    return res.status(400).json({ error: 'Título, categoria e fornecedor são obrigatórios' })

  try {
    const [fornecedor] = await pool.query(
      'SELECT id_fornecedor FROM fornecedor WHERE id_fornecedor = ?',
      [id_fornecedor]
    )
    if (!fornecedor.length) return res.status(404).json({ error: 'Fornecedor não encontrado' })

    const [result] = await pool.query(
      'INSERT INTO produtos (Titulo, Link, Descricao, Categoria, Preco, id_fornecedor) VALUES (?, ?, ?, ?, ?, ?)',
      [Titulo, Link || null, Descricao || null, Categoria, Preco || null, id_fornecedor]
    )

    const [rows] = await pool.query('SELECT * FROM produtos WHERE Cod_produto = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Erro ao criar produto:', err)
    res.status(500).json({ error: 'Erro ao criar produto' })
  }
}

export async function getProdutoById(req, res) {
  const { id } = req.params
  try {
    const [produto] = await pool.query('SELECT * FROM produtos WHERE Cod_produto = ?', [id])
    if (!produto.length)
      return res.status(404).json({ error: 'Produto não encontrado' })
    res.json(produto[0])
  } catch (err) {
    console.error('Erro ao buscar produto:', err)
    res.status(500).json({ error: 'Erro ao buscar produto' })
  }
}

export async function updateProduto(req, res) {
  const { id } = req.params
  const { Titulo, Link, Descricao, Categoria, Preco, id_fornecedor } = req.body
  if (!Titulo || !Categoria)
    return res.status(400).json({ error: 'Título e categoria são obrigatórios' })
  try {
    const [produto] = await pool.query('SELECT * FROM produtos WHERE Cod_produto = ?', [id])
    if (!produto.length)
      return res.status(404).json({ error: 'Produto não encontrado' })

    if (id_fornecedor) {
      const [fornecedor] = await pool.query(
        'SELECT id_fornecedor FROM fornecedor WHERE id_fornecedor = ?',
        [id_fornecedor]
      )
      if (!fornecedor.length) return res.status(404).json({ error: 'Fornecedor não encontrado' })
    }

    const [updated] = await pool.query(
      'UPDATE produtos SET Titulo = ?, Link = ?, Descricao = ?, Categoria = ?, Preco = ?, id_fornecedor = ? WHERE Cod_produto = ?',
      [Titulo, Link || null, Descricao || null, Categoria, Preco || null, id_fornecedor || produto[0].id_fornecedor, id]
    )
    if (updated.affectedRows === 0)
      return res.status(404).json({ error: 'Produto não encontrado' })

    const [result] = await pool.query('SELECT * FROM produtos WHERE Cod_produto = ?', [id])
    res.json(result[0])
  } catch (err) {
    console.error('Erro ao atualizar produto:', err)
    res.status(500).json({ error: 'Erro ao atualizar produto' })
  }
}

export async function deleteProduto(req, res) {
  const { id } = req.params
  try {
    const [produto] = await pool.query('SELECT * FROM produtos WHERE Cod_produto = ?', [id])
    if (!produto.length)
      return res.status(404).json({ error: 'Produto não encontrado' })

    const { img_capa, img_galeria } = produto[0]
    if (img_capa && fs.existsSync(img_capa))
      fs.unlink(img_capa, err => { if (err) console.warn('Erro ao remover imagem:', err) })

    if (img_galeria) {
      try {
        const galeria = JSON.parse(img_galeria)
        if (Array.isArray(galeria)) {
          galeria.forEach(img => {
            if (fs.existsSync(img))
              fs.unlink(img, err => { if (err) console.warn('Erro ao remover imagem:', err) })
          })
        }
      } catch (e) { console.warn('Erro ao processar galeria:', e) }
    }

    await pool.query('DELETE FROM favoritos WHERE produto_id = ?', [id])
    await pool.query('DELETE FROM avaliacoes WHERE produto_id = ?', [id])
    await pool.query('DELETE FROM produtos WHERE Cod_produto = ?', [id])

    res.json({ message: 'Produto deletado com sucesso' })
  } catch (err) {
    console.error('Erro ao deletar produto:', err)
    res.status(500).json({ error: 'Erro ao deletar produto' })
  }
}

// ══════════════════════════════════════════════════════════════════
// ── AVALIAÇÕES - Admin edita/deleta, não cria
// ══════════════════════════════════════════════════════════════════
export async function getAllAvaliacoes(req, res) {
  try {
    const [avaliacoes] = await pool.query(
      `SELECT a.id, a.produto_id, a.cliente_id, a.nota, a.comentario, a.created_at,
              p.Titulo AS produto_titulo, c.name AS cliente_nome
       FROM avaliacoes a
       JOIN produtos p ON p.Cod_produto = a.produto_id
       JOIN cliente c ON c.idc = a.cliente_id
       ORDER BY a.created_at DESC`
    )
    res.json(avaliacoes)
  } catch (err) {
    console.error('Erro ao listar avaliações:', err)
    res.status(500).json({ error: 'Erro ao listar avaliações' })
  }
}

export async function updateAvaliacao(req, res) {
  const { id } = req.params
  const { nota, comentario } = req.body
  const notaNum = Number(nota)

  if (!nota || notaNum < 0.5 || notaNum > 5 || (notaNum * 2) % 1 !== 0)
    return res.status(400).json({ error: 'Nota deve ser entre 0.5 e 5 em intervalos de 0.5' })

  try {
    const [rows] = await pool.query('SELECT * FROM avaliacoes WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Avaliação não encontrada' })

    await pool.query(
      'UPDATE avaliacoes SET nota = ?, comentario = ? WHERE id = ?',
      [notaNum, comentario || null, id]
    )

    await sincronizarReputacaoPorProduto(rows[0].produto_id)

    const [updated] = await pool.query('SELECT * FROM avaliacoes WHERE id = ?', [id])
    res.json(updated[0])
  } catch (err) {
    console.error('Erro ao atualizar avaliação:', err)
    res.status(500).json({ error: 'Erro ao atualizar avaliação' })
  }
}

export async function deleteAvaliacaoAdmin(req, res) {
  const { id } = req.params
  try {
    const [rows] = await pool.query('SELECT * FROM avaliacoes WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Avaliação não encontrada' })

    const produtoId = rows[0].produto_id
    await pool.query('DELETE FROM avaliacoes WHERE id = ?', [id])
    await sincronizarReputacaoPorProduto(produtoId)

    res.json({ message: 'Avaliação deletada com sucesso' })
  } catch (err) {
    console.error('Erro ao deletar avaliação:', err)
    res.status(500).json({ error: 'Erro ao deletar avaliação' })
  }
}

async function sincronizarReputacaoPorProduto(produtoId) {
  const [[produto]] = await pool.query(
    'SELECT id_fornecedor FROM produtos WHERE Cod_produto = ?',
    [produtoId]
  )
  if (!produto) return

  const [[avg]] = await pool.query(
    `SELECT AVG(a.nota) AS media
     FROM avaliacoes a
     JOIN produtos p ON p.Cod_produto = a.produto_id
     WHERE p.id_fornecedor = ?`,
    [produto.id_fornecedor]
  )

  const reputacao = avg.media ? Math.round((Number(avg.media) / 5) * 100) : 0
  await pool.query(
    'UPDATE fornecedor SET reputacao = ? WHERE id_fornecedor = ?',
    [reputacao, produto.id_fornecedor]
  )
}
