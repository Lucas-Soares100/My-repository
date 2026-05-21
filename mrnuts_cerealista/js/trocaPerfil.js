// ═══════════════════════════════════════════════════════
// TROCA DE PERFIL - Cliente ↔ Fornecedor
// ═══════════════════════════════════════════════════════

const TP_BASE = config.API_BASE_URL

// ── Ponto de entrada: clique no botão ────────────────
async function verificarTrocaPerfil() {
    if (!UserManager.isLoggedIn()) return notify.warning('Faça login para trocar de perfil')

    const userType = UserManager.getUserType()
    const user     = UserManager.getUser()
    const email    = user?.email
    const para     = userType === config.USER_TYPES.CLIENT ? 'fornecedor' : 'cliente'

    if (!email) return notify.error('Email do usuário não encontrado')

    try {
        const res  = await fetch(`${TP_BASE}/perfil/verificar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api.getToken()}`
            },
            body: JSON.stringify({ email })
        })
        const data = await res.json()
        if (!res.ok) return notify.error(data.error || 'Erro ao verificar perfil')

        const perfilExiste = para === 'cliente' ? data.temCliente : data.temFornecedor

        if (perfilExiste) {
            await trocarPerfil(email, para)
        } else {
            abrirModalComplemento(para, user)
        }
    } catch {
        notify.error('Erro ao verificar perfil')
    }
}

// ── Troca instantânea (perfil já existe) ─────────────
async function trocarPerfil(email, para) {
    try {
        const res  = await fetch(`${TP_BASE}/perfil/trocar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api.getToken()}`
            },
            body: JSON.stringify({ email, para })
        })
        const data = await res.json()
        if (!res.ok) return notify.error(data.error || 'Erro ao trocar perfil')

        _aplicarTroca(data)
    } catch {
        notify.error('Erro ao trocar perfil')
    }
}

// ── Aplicar troca localmente ──────────────────────────
function _aplicarTroca(data) {
    api.setToken(data.token)
    if (data.tipo === 'cliente') {
        UserManager.setUser(data.cliente, config.USER_TYPES.CLIENT, data.token)
        notify.success('Perfil trocado para Cliente!')
    } else {
        UserManager.setUser(data.fornecedor, config.USER_TYPES.SUPPLIER, data.token)
        notify.success('Perfil trocado para Fornecedor!')
    }
    app.updateUI()
    app.navigateTo('home')
    _atualizarBotaoTroca()
}

// ── Modal de complementação ───────────────────────────
function abrirModalComplemento(para, userAtual) {
    const modal = document.getElementById('troca-perfil-modal')
    if (!modal) return

    const titulo   = document.getElementById('tp-modal-titulo')
    const campos   = document.getElementById('tp-campos-extras')

    if (para === 'fornecedor') {
        titulo.textContent = 'Criar Perfil de Fornecedor'
        campos.innerHTML = `
            <div class="form-group">
                <label>CNPJ <span style="color:#e74c3c">*</span></label>
                <input type="text" id="tp-cnpj" placeholder="00.000.000/0000-00" maxlength="18" required>
            </div>
            <div class="form-group">
                <label>Senha para o novo perfil <span style="color:#e74c3c">*</span></label>
                <input type="password" id="tp-password" placeholder="Crie uma senha" required>
            </div>`
    } else {
        titulo.textContent = 'Criar Perfil de Cliente'
        campos.innerHTML = `
            <div class="form-group">
                <label>Telefone <span style="color:#e74c3c">*</span></label>
                <input type="tel" id="tp-telefone" placeholder="(00) 00000-0000" maxlength="15" required>
            </div>
            <div class="form-group">
                <label>Senha para o novo perfil <span style="color:#e74c3c">*</span></label>
                <input type="password" id="tp-password" placeholder="Crie uma senha" required>
            </div>`
    }

    // Pré-preencher campos comuns
    const elNome  = document.getElementById('tp-nome')
    const elEmail = document.getElementById('tp-email')
    if (elNome)  elNome.value  = userAtual?.name  || ''
    if (elEmail) elEmail.value = userAtual?.email || ''

    // Guardar alvo no modal
    modal.dataset.para  = para
    modal.dataset.email = userAtual?.email || ''
    modal.dataset.nome  = userAtual?.name  || ''

    modal.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
}

function fecharModalTroca() {
    const modal = document.getElementById('troca-perfil-modal')
    if (modal) modal.classList.add('hidden')
    document.body.style.overflow = ''
}

// ── Submissão do modal ────────────────────────────────
async function criarPerfilVinculado() {
    const modal    = document.getElementById('troca-perfil-modal')
    const para     = modal?.dataset.para
    const email    = document.getElementById('tp-email')?.value?.trim()
    const nome     = document.getElementById('tp-nome')?.value?.trim()
    const password = document.getElementById('tp-password')?.value

    if (!email || !nome || !password) return notify.warning('Preencha todos os campos obrigatórios')

    try {
        let body, endpoint

        if (para === 'fornecedor') {
            const cnpj = document.getElementById('tp-cnpj')?.value?.trim().replace(/\D/g, '')
            if (!cnpj || cnpj.length !== 14) return notify.warning('CNPJ inválido (14 dígitos)')
            body     = { name: nome, cnpj, email, password }
            endpoint = `${TP_BASE}/perfil/criar-fornecedor`
        } else {
            const telefone = document.getElementById('tp-telefone')?.value?.trim()
            if (!telefone) return notify.warning('Telefone obrigatório')
            body     = { name: nome, email, telefone, password }
            endpoint = `${TP_BASE}/perfil/criar-cliente`
        }

        const res  = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api.getToken()}`
            },
            body: JSON.stringify(body)
        })
        const data = await res.json()
        if (!res.ok) return notify.error(data.error || 'Erro ao criar perfil')

        fecharModalTroca()
        _aplicarTroca(data)
    } catch {
        notify.error('Erro ao criar perfil vinculado')
    }
}

// ── Atualizar texto/ícone do botão ────────────────────
function _atualizarBotaoTroca() {
    const btn = document.getElementById('switch-profile-btn')
    if (!btn) return

    const isLoggedIn = UserManager.isLoggedIn()
    const userType   = UserManager.getUserType()

    if (!isLoggedIn || userType === config.USER_TYPES.ADMIN) {
        btn.style.display = 'none'
        return
    }

    btn.style.display = ''
    if (userType === config.USER_TYPES.CLIENT) {
        btn.innerHTML = '<i class="fas fa-store"></i> Virar Fornecedor'
    } else {
        btn.innerHTML = '<i class="fas fa-user"></i> Virar Cliente'
    }
}

// Expor para o app.js chamar após updateUI
window.atualizarBotaoTroca = _atualizarBotaoTroca
