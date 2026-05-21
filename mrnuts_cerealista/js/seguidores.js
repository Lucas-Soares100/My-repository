// ═══════════════════════════════════════════════════════
// SEGUIDORES.JS
// ═══════════════════════════════════════════════════════

const SEG_BASE = config.API_BASE_URL

// ── Seguir / Deixar de Seguir ─────────────────────────

async function toggleSeguirFornecedor(fornecedorId) {
    if (!UserManager.isLoggedIn() || UserManager.getUserType() !== config.USER_TYPES.CLIENT) {
        return notify.warning('Faça login como cliente para seguir fornecedores')
    }

    const btn = document.getElementById('seguir-fornecedor-btn')
    const seguindo = btn?.classList.contains('seguindo')

    try {
        const res = await fetch(`${SEG_BASE}/fornecedor/${fornecedorId}/seguir`, {
            method: seguindo ? 'DELETE' : 'POST',
            headers: { 'Authorization': `Bearer ${api.getToken()}` }
        })
        const data = await res.json()
        if (!res.ok) return notify.error(data.error || 'Erro ao processar')

        _atualizarBtnSeguir(!seguindo)
        atualizarContadorSeguidores(fornecedorId, data.seguidores)

        notify.success(seguindo ? 'Deixou de seguir' : 'Seguindo!')
    } catch {
        notify.error('Erro ao processar solicitação')
    }
}

// ── Estado do botão ───────────────────────────────────

function _atualizarBtnSeguir(seguindo) {
    const btn = document.getElementById('seguir-fornecedor-btn')
    if (!btn) return
    if (seguindo) {
        btn.classList.add('seguindo')
        btn.innerHTML = '<i class="fas fa-user-check"></i> Seguindo'
    } else {
        btn.classList.remove('seguindo')
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir'
    }
}

// ── Contador de seguidores ────────────────────────────

function atualizarContadorSeguidores(fornecedorId, total) {
    const el = document.getElementById(`seguidores-count-${fornecedorId}`)
    if (el) el.textContent = total

    const elDash = document.getElementById('fornecedor-seguidores')
    if (elDash) elDash.textContent = total
}

// ── Carregar estado inicial ao ver produto ────────────

async function carregarEstadoSeguir(fornecedorId) {
    try {
        const headers = {}
        if (api.getToken()) headers['Authorization'] = `Bearer ${api.getToken()}`

        const res  = await fetch(`${SEG_BASE}/fornecedor/${fornecedorId}/seguidores`, { headers })
        const data = await res.json()

        atualizarContadorSeguidores(fornecedorId, data.total)
        _atualizarBtnSeguir(data.seguindo)

        // Oculta botão para não-clientes
        const btn = document.getElementById('seguir-fornecedor-btn')
        if (btn && UserManager.getUserType() !== config.USER_TYPES.CLIENT) {
            btn.style.display = 'none'
        }
    } catch (err) {
        console.error('Erro ao carregar seguidores:', err)
    }
}

// ── Aba "Seguindo" no dashboard do cliente ────────────

async function carregarSeguindo() {
    const lista = document.getElementById('seguindo-list')
    if (!lista) return
    lista.innerHTML = '<p style="color:#aaa;font-size:14px;">Carregando...</p>'

    try {
        const res  = await fetch(`${SEG_BASE}/cliente/seguindo`, {
            headers: { 'Authorization': `Bearer ${api.getToken()}` }
        })
        const data = await res.json()
        if (!res.ok) { lista.innerHTML = '<p>Erro ao carregar.</p>'; return }

        if (!data.length) {
            lista.innerHTML = '<p class="seg-vazio">Você ainda não segue nenhum fornecedor.</p>'
            return
        }

        lista.innerHTML = data.map(f => {
            const img = f.img
                ? `${SEG_BASE}/../${f.img}`
                : 'https://via.placeholder.com/52?text=🏪'
            return `
                <div class="seg-card">
                    <img src="${img}" alt="${f.name}" class="seg-avatar"
                         onerror="this.src='https://via.placeholder.com/52?text=🏪'">
                    <div class="seg-info">
                        <strong class="seg-nome">${f.name}</strong>
                        <span class="seg-rep">${f.reputacao || 0}% reputação · ${f.seguidores || 0} seguidores</span>
                        <span class="seg-desde">Seguindo desde ${new Date(f.seguindo_desde).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <button class="seg-btn-deixar" onclick="deixarDeSeguirLista(${f.id_fornecedor}, this)">
                        <i class="fas fa-user-minus"></i> Deixar de seguir
                    </button>
                </div>`
        }).join('')
    } catch {
        lista.innerHTML = '<p>Erro ao carregar fornecedores.</p>'
    }
}

async function deixarDeSeguirLista(fornecedorId, btn) {
    if (!confirm('Deixar de seguir este fornecedor?')) return
    try {
        const res = await fetch(`${SEG_BASE}/fornecedor/${fornecedorId}/seguir`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${api.getToken()}` }
        })
        if (!res.ok) return notify.error('Erro ao deixar de seguir')
        notify.success('Deixou de seguir')
        btn.closest('.seg-card').remove()
        const lista = document.getElementById('seguindo-list')
        if (lista && !lista.querySelector('.seg-card'))
            lista.innerHTML = '<p class="seg-vazio">Você ainda não segue nenhum fornecedor.</p>'
    } catch {
        notify.error('Erro ao processar')
    }
}

// ── Analytics de Seguidores (fornecedor) ─────────────

let _followersChartInstance = null

async function renderFollowersChart() {
    try {
        const res  = await fetch(`${SEG_BASE}/fornecedor/${UserManager.getUser()?.idf}/analytics-seguidores`, {
            headers: { 'Authorization': `Bearer ${api.getToken()}` }
        })
        const data = await res.json()
        if (!res.ok) return

        // Total no stat
        const elTotal = document.getElementById('fornecedor-seguidores')
        if (elTotal) elTotal.textContent = data.total

        const ctx = document.getElementById('followers-chart')
        if (!ctx) return

        if (_followersChartInstance) _followersChartInstance.destroy()

        _followersChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.crescimento.map(d => d.label),
                datasets: [{
                    label: 'Novos seguidores',
                    data: data.crescimento.map(d => d.novos),
                    borderColor: '#2f6b45',
                    backgroundColor: 'rgba(47,107,69,0.1)',
                    borderWidth: 2,
                    pointRadius: 5,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        })
    } catch (err) {
        console.error('Erro ao carregar analytics:', err)
    }
}
