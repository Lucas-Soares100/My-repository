// ═══════════════════════════════════════════════════════
// AVALIACOES PRODUTO - Front-end
// ═══════════════════════════════════════════════════════

async function carregarAvaliacoes(produtoId) {
    const section = document.getElementById('avaliacoes-section')
    if (!section) return

    const userType = UserManager.getUserType()
    const isCliente = userType === config.USER_TYPES.CLIENT
    const formDiv = document.getElementById('form-avaliacao')
    if (formDiv) formDiv.style.display = isCliente ? 'flex' : 'none'

    try {
        const res = await fetch(`${config.API_BASE_URL}/produto/${produtoId}/avaliacoes`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        const mediaDiv = document.getElementById('media-avaliacoes')
        if (mediaDiv) {
            if (data.total > 0) {
                const estrelas = renderEstrelas(data.media)
                mediaDiv.innerHTML = `
                    <div class="avaliacao-media-container">
                        <div class="avaliacao-media-box">
                            <span class="avaliacao-media-numero">${data.media.toFixed(1)}</span>
                            <span class="avaliacao-estrelas">${estrelas}</span>
                        </div>
                        <span class="avaliacao-total">(${data.total} avaliação${data.total !== 1 ? 'ões' : ''})</span>
                    </div>`
            } else {
                mediaDiv.innerHTML = '<p class="avaliacao-empty">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>'
            }
        }

        const lista = document.getElementById('lista-avaliacoes')
        if (lista) {
            if (!data.avaliacoes.length) {
                lista.innerHTML = ''
                return
            }
            const clienteId = UserManager.getUser()?.idc
            const adm = UserManager.isAdmin()
            
            lista.innerHTML = data.avaliacoes.map(av => {
                const isOwner = isCliente && av.cliente_id === clienteId
                const podeExcluir = isOwner || adm
                const fotoUrl = getImageUrl(av.cliente_img) || 'https://via.placeholder.com/40x40?text=Cliente'
                const btnExcluir = podeExcluir
                    ? `<button class="avaliacao-btn-excluir" onclick="excluirAvaliacao(${av.id}, ${produtoId})" title="Excluir avaliação"><i class="fas fa-trash"></i></button>`
                    : ''
                
                return `
                    <div class="avaliacao-item">
                        <div class="avaliacao-header">
                            <img src="${fotoUrl}" alt="${av.nome_cliente}" class="avaliacao-avatar" onerror="this.src='https://via.placeholder.com/40x40?text=Sem+foto'">
                            <div class="avaliacao-user-info">
                                <strong class="avaliacao-nome">${av.nome_cliente}</strong>
                                <small class="avaliacao-data">${new Date(av.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</small>
                            </div>
                            ${btnExcluir}
                        </div>
                        <div class="avaliacao-rating">
                            <span class="avaliacao-estrelas">${renderEstrelas(av.nota)}</span>
                        </div>
                        <p class="avaliacao-comentario">${av.comentario || '<em class="avaliacao-sem-comentario">Sem comentário</em>'}</p>
                    </div>`
            }).join('')
        }
    } catch (err) {
        console.error('Erro ao carregar avaliações:', err)
        const mediaDiv = document.getElementById('media-avaliacoes')
        if (mediaDiv) {
            mediaDiv.innerHTML = '<p class="avaliacao-empty">Erro ao carregar avaliações</p>'
        }
    }
}

async function enviarAvaliacao() {
    const produtoId = app.currentProduct?.Cod_produto
    if (!produtoId) return notify.warning('Produto não identificado')

    const nota = document.getElementById('nota-avaliacao')?.value
    const comentario = document.getElementById('comentario-avaliacao')?.value || ''

    if (!nota) return notify.warning('Selecione uma nota')
    if (!UserManager.isLoggedIn()) return notify.warning('Faça login para avaliar')
    if (UserManager.getUserType() !== config.USER_TYPES.CLIENT) return notify.warning('Apenas clientes podem avaliar')

    try {
        const res = await fetch(`${config.API_BASE_URL}/avaliacoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api.getToken()}`
            },
            body: JSON.stringify({ produto_id: produtoId, nota: Number(nota), comentario })
        })
        const data = await res.json()
        if (!res.ok) return notify.error(data.error || 'Erro ao enviar avaliação')

        notify.success('Avaliação enviada!')
        document.getElementById('comentario-avaliacao').value = ''
        document.getElementById('nota-avaliacao').value = '5'
        carregarAvaliacoes(produtoId)
    } catch (err) {
        console.error('Erro ao enviar avaliação:', err)
        notify.error('Erro ao enviar avaliação')
    }
}

async function excluirAvaliacao(avaliacaoId, produtoId) {
    if (!confirm('Excluir esta avaliação?')) return
    try {
        const res = await fetch(`${config.API_BASE_URL}/avaliacoes/${avaliacaoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${api.getToken()}` }
        })
        const data = await res.json()
        if (!res.ok) return notify.error(data.error || 'Erro ao excluir')
        notify.success('Avaliação excluída')
        carregarAvaliacoes(produtoId)
    } catch (err) {
        console.error('Erro ao excluir avaliação:', err)
        notify.error('Erro ao excluir avaliação')
    }
}

function renderEstrelas(nota) {
    const num = Number(nota)
    const cheia = Math.floor(num)
    const meia = (num - cheia) >= 0.5
    const vazia = 5 - cheia - (meia ? 1 : 0)
    
    let html = ''
    for (let i = 0; i < cheia; i++) html += '<span class="estrela-cheia">★</span>'
    if (meia) html += '<span class="estrela-meia">★</span>'
    for (let i = 0; i < vazia; i++) html += '<span class="estrela-vazia">☆</span>'
    
    return html
}
