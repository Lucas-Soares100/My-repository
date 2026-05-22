const API_URL = '/api'
const token = localStorage.getItem('token')
const adminUser = JSON.parse(localStorage.getItem('adminUser'))

let appState = {
  currentTab: 'clientes',
  currentEditItem: null,
  currentDeleteItem: null,
  modalMode: 'edit',
  clientes: [],
  fornecedores: [],
  produtos: [],
  avaliacoes: [],
  filteredData: {
    clientes: [],
    fornecedores: [],
    produtos: [],
    avaliacoes: []
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!token || !adminUser) {
    window.location.href = 'admin-login.html'
    return
  }

  initializeUI()
  setupEventListeners()
  await loadClientes()
  await loadFornecedores()
  await loadProdutos()
  await loadAvaliacoes()
})

function initializeUI() {
  document.getElementById('adminName').textContent = adminUser.name || 'Admin'
  document.getElementById('adminAvatar').textContent = (adminUser.name || 'A').charAt(0).toUpperCase()
}

function setupEventListeners() {
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault()
      switchTab(tab.dataset.tab)
    })
  })

  document.getElementById('logoutBtn').addEventListener('click', logout)
  document.getElementById('searchClientes').addEventListener('input', filterClientes)
  document.getElementById('searchFornecedores').addEventListener('input', filterFornecedores)
  document.getElementById('searchProdutos').addEventListener('input', filterProdutos)
  document.getElementById('searchAvaliacoes')?.addEventListener('input', filterAvaliacoes)

  document.getElementById('newClienteBtn')?.addEventListener('click', openCreateClienteModal)
  document.getElementById('newFornecedorBtn')?.addEventListener('click', openCreateFornecedorModal)
  document.getElementById('newProdutoBtn')?.addEventListener('click', openCreateProdutoModal)

  document.getElementById('closeModalBtn').addEventListener('click', closeEditModal)
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal)
  document.getElementById('saveEditBtn').addEventListener('click', saveEdit)

  document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteModal)
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal)
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete)
}

async function adminRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Erro na requisição')
  return data
}

function switchTab(tab) {
  document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'))
  document.querySelectorAll('.admin-sidebar-link').forEach(link => link.classList.remove('active'))
  document.getElementById(tab).classList.add('active')
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active')
  appState.currentTab = tab
}

// CLIENTES
async function loadClientes() {
  try {
    appState.clientes = await adminRequest('/admin/clientes')
    appState.filteredData.clientes = appState.clientes
    renderClientesTable()
  } catch (error) {
    showError(error.message)
  }
}

function renderClientesTable() {
  const tbody = document.getElementById('clientesTableBody')
  if (!appState.filteredData.clientes.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">Nenhum cliente encontrado</td></tr>'
    return
  }
  tbody.innerHTML = appState.filteredData.clientes.map(cliente => `
    <tr>
      <td>${cliente.idc}</td>
      <td>${escapeHtml(cliente.name)}</td>
      <td>${escapeHtml(cliente.email)}</td>
      <td>${escapeHtml(cliente.telefone || '')}</td>
      <td>${formatDate(cliente.created_at)}</td>
      <td><div class="admin-action-buttons">
        <button class="btn-edit" onclick="openEditClienteModal(${cliente.idc})">Editar</button>
        <button class="btn-delete" onclick="openDeleteModal('cliente', ${cliente.idc})">Deletar</button>
      </div></td>
    </tr>`).join('')
}

function filterClientes() {
  const search = document.getElementById('searchClientes').value.toLowerCase()
  appState.filteredData.clientes = appState.clientes.filter(cliente =>
    cliente.name.toLowerCase().includes(search) || cliente.email.toLowerCase().includes(search)
  )
  renderClientesTable()
}

function openCreateClienteModal() {
  appState.modalMode = 'create'
  appState.currentEditItem = { type: 'cliente' }
  document.getElementById('modalTitle').textContent = 'Novo Cliente'
  document.getElementById('editForm').innerHTML = `
    <div class="form-group"><label>Nome</label><input type="text" id="editName" required></div>
    <div class="form-group"><label>Email</label><input type="email" id="editEmail" required></div>
    <div class="form-group"><label>Telefone</label><input type="tel" id="editTelefone" required></div>
    <div class="form-group"><label>Senha</label><input type="password" id="editPassword" required minlength="6"></div>`
  openEditModal()
}

function openEditClienteModal(idc) {
  const cliente = appState.clientes.find(c => c.idc === idc)
  if (!cliente) return
  appState.modalMode = 'edit'
  appState.currentEditItem = { type: 'cliente', data: cliente }
  document.getElementById('modalTitle').textContent = 'Editar Cliente'
  document.getElementById('editForm').innerHTML = `
    <div class="form-group"><label>Nome</label><input type="text" id="editName" value="${escapeAttr(cliente.name)}" required></div>
    <div class="form-group"><label>Email</label><input type="email" id="editEmail" value="${escapeAttr(cliente.email)}" required></div>
    <div class="form-group"><label>Telefone</label><input type="tel" id="editTelefone" value="${escapeAttr(cliente.telefone || '')}" required></div>`
  openEditModal()
}

async function createCliente() {
  await adminRequest('/admin/clientes', {
    method: 'POST',
    body: JSON.stringify({
      name: document.getElementById('editName').value,
      email: document.getElementById('editEmail').value,
      telefone: document.getElementById('editTelefone').value,
      password: document.getElementById('editPassword').value
    })
  })
  await loadClientes()
}

async function updateCliente(idc) {
  await adminRequest(`/admin/clientes/${idc}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: document.getElementById('editName').value,
      email: document.getElementById('editEmail').value,
      telefone: document.getElementById('editTelefone').value
    })
  })
  await loadClientes()
}

async function deleteCliente(idc) {
  await adminRequest(`/admin/clientes/${idc}`, { method: 'DELETE' })
  await loadClientes()
}

// FORNECEDORES
async function loadFornecedores() {
  try {
    appState.fornecedores = await adminRequest('/admin/fornecedores')
    appState.filteredData.fornecedores = appState.fornecedores
    renderFornecedoresTable()
  } catch (error) {
    showError(error.message)
  }
}

function renderFornecedoresTable() {
  const tbody = document.getElementById('fornecedoresTableBody')
  if (!appState.filteredData.fornecedores.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">Nenhum fornecedor encontrado</td></tr>'
    return
  }
  tbody.innerHTML = appState.filteredData.fornecedores.map(fornecedor => `
    <tr>
      <td>${fornecedor.id_fornecedor}</td>
      <td>${escapeHtml(fornecedor.name)}</td>
      <td>${escapeHtml(fornecedor.cnpj)}</td>
      <td>${escapeHtml(fornecedor.email)}</td>
      <td>${formatDate(fornecedor.created_at)}</td>
      <td><div class="admin-action-buttons">
        <button class="btn-edit" onclick="openEditFornecedorModal(${fornecedor.id_fornecedor})">Editar</button>
        <button class="btn-delete" onclick="openDeleteModal('fornecedor', ${fornecedor.id_fornecedor})">Deletar</button>
      </div></td>
    </tr>`).join('')
}

function filterFornecedores() {
  const search = document.getElementById('searchFornecedores').value.toLowerCase()
  appState.filteredData.fornecedores = appState.fornecedores.filter(fornecedor =>
    fornecedor.name.toLowerCase().includes(search) ||
    fornecedor.cnpj.toLowerCase().includes(search) ||
    fornecedor.email.toLowerCase().includes(search)
  )
  renderFornecedoresTable()
}

function openCreateFornecedorModal() {
  appState.modalMode = 'create'
  appState.currentEditItem = { type: 'fornecedor' }
  document.getElementById('modalTitle').textContent = 'Novo Fornecedor'
  document.getElementById('editForm').innerHTML = `
    <div class="form-group"><label>Nome</label><input type="text" id="editName" required></div>
    <div class="form-group"><label>CNPJ</label><input type="text" id="editCnpj" required></div>
    <div class="form-group"><label>Email</label><input type="email" id="editEmail" required></div>
    <div class="form-group"><label>Senha</label><input type="password" id="editPassword" required minlength="6"></div>`
  openEditModal()
}

function openEditFornecedorModal(idf) {
  const fornecedor = appState.fornecedores.find(f => f.id_fornecedor === idf)
  if (!fornecedor) return
  appState.modalMode = 'edit'
  appState.currentEditItem = { type: 'fornecedor', data: fornecedor }
  document.getElementById('modalTitle').textContent = 'Editar Fornecedor'
  document.getElementById('editForm').innerHTML = `
    <div class="form-group"><label>Nome</label><input type="text" id="editName" value="${escapeAttr(fornecedor.name)}" required></div>
    <div class="form-group"><label>CNPJ</label><input type="text" id="editCnpj" value="${escapeAttr(fornecedor.cnpj)}" required></div>
    <div class="form-group"><label>Email</label><input type="email" id="editEmail" value="${escapeAttr(fornecedor.email)}" required></div>`
  openEditModal()
}

async function createFornecedor() {
  await adminRequest('/admin/fornecedores', {
    method: 'POST',
    body: JSON.stringify({
      name: document.getElementById('editName').value,
      cnpj: document.getElementById('editCnpj').value,
      email: document.getElementById('editEmail').value,
      password: document.getElementById('editPassword').value
    })
  })
  await loadFornecedores()
}

async function updateFornecedor(idf) {
  await adminRequest(`/admin/fornecedores/${idf}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: document.getElementById('editName').value,
      cnpj: document.getElementById('editCnpj').value,
      email: document.getElementById('editEmail').value
    })
  })
  await loadFornecedores()
}

async function deleteFornecedor(idf) {
  await adminRequest(`/admin/fornecedores/${idf}`, { method: 'DELETE' })
  await loadFornecedores()
  await loadProdutos()
  await loadAvaliacoes()
}

// PRODUTOS
async function loadProdutos() {
  try {
    appState.produtos = await adminRequest('/admin/produtos')
    appState.filteredData.produtos = appState.produtos
    renderProdutosTable()
  } catch (error) {
    showError(error.message)
  }
}

function renderProdutosTable() {
  const tbody = document.getElementById('produtosTableBody')
  if (!appState.filteredData.produtos.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">Nenhum produto encontrado</td></tr>'
    return
  }
  tbody.innerHTML = appState.filteredData.produtos.map(produto => `
    <tr>
      <td>${produto.Cod_produto}</td>
      <td>${escapeHtml(produto.Titulo)}</td>
      <td>${escapeHtml(produto.Categoria)}</td>
      <td>${produto.Preco !== null && produto.Preco !== undefined ? `R$ ${parseFloat(produto.Preco).toFixed(2)}` : '-'}</td>
      <td>${escapeHtml(produto.fornecedor_nome || produto.id_fornecedor)}</td>
      <td>${formatDate(produto.created_at)}</td>
      <td><div class="admin-action-buttons">
        <button class="btn-edit" onclick="openEditProdutoModal(${produto.Cod_produto})">Editar</button>
        <button class="btn-delete" onclick="openDeleteModal('produto', ${produto.Cod_produto})">Deletar</button>
      </div></td>
    </tr>`).join('')
}

function filterProdutos() {
  const search = document.getElementById('searchProdutos').value.toLowerCase()
  appState.filteredData.produtos = appState.produtos.filter(produto =>
    produto.Titulo.toLowerCase().includes(search) || produto.Categoria.toLowerCase().includes(search)
  )
  renderProdutosTable()
}

function supplierOptions(selectedId = '') {
  return appState.fornecedores.map(f =>
    `<option value="${f.id_fornecedor}" ${Number(selectedId) === Number(f.id_fornecedor) ? 'selected' : ''}>${escapeHtml(f.name)} - ${escapeHtml(f.cnpj)}</option>`
  ).join('')
}

function categoryOptions(selected = '') {
  const cats = ['nozes', 'castanhas', 'grãos', 'sementes', 'farináceos', 'chips', 'temperos']
  return cats.map(c => `<option value="${c}" ${selected === c ? 'selected' : ''}>${c}</option>`).join('')
}

function openCreateProdutoModal() {
  appState.modalMode = 'create'
  appState.currentEditItem = { type: 'produto' }
  document.getElementById('modalTitle').textContent = 'Novo Produto'
  document.getElementById('editForm').innerHTML = `
    <div class="form-group"><label>Título</label><input type="text" id="editTitulo" required></div>
    <div class="form-group"><label>Link</label><input type="url" id="editLink" placeholder="https://exemplo.com/produto"></div>
    <div class="form-group"><label>Descrição</label><textarea id="editDescricao" rows="3"></textarea></div>
    <div class="form-group"><label>Categoria</label><select id="editCategoria" required>${categoryOptions()}</select></div>
    <div class="form-group"><label>Preço</label><input type="number" id="editPreco" step="0.01" min="0"></div>
    <div class="form-group"><label>Fornecedor</label><select id="editFornecedor" required><option value="">Selecione</option>${supplierOptions()}</select></div>`
  openEditModal()
}

function openEditProdutoModal(codProduto) {
  const produto = appState.produtos.find(p => p.Cod_produto === codProduto)
  if (!produto) return
  appState.modalMode = 'edit'
  appState.currentEditItem = { type: 'produto', data: produto }
  document.getElementById('modalTitle').textContent = 'Editar Produto'
  document.getElementById('editForm').innerHTML = `
    <div class="form-group"><label>Título</label><input type="text" id="editTitulo" value="${escapeAttr(produto.Titulo)}" required></div>
    <div class="form-group"><label>Link</label><input type="url" id="editLink" value="${escapeAttr(produto.Link || '')}"></div>
    <div class="form-group"><label>Descrição</label><textarea id="editDescricao" rows="3">${escapeHtml(produto.Descricao || '')}</textarea></div>
    <div class="form-group"><label>Categoria</label><select id="editCategoria" required>${categoryOptions(produto.Categoria)}</select></div>
    <div class="form-group"><label>Preço</label><input type="number" id="editPreco" value="${produto.Preco || ''}" step="0.01" min="0"></div>
    <div class="form-group"><label>Fornecedor</label><select id="editFornecedor" required>${supplierOptions(produto.id_fornecedor)}</select></div>`
  openEditModal()
}

async function createProduto() {
  await adminRequest('/admin/produtos', {
    method: 'POST',
    body: JSON.stringify(getProdutoFormData())
  })
  await loadProdutos()
}

async function updateProduto(codProduto) {
  await adminRequest(`/admin/produtos/${codProduto}`, {
    method: 'PUT',
    body: JSON.stringify(getProdutoFormData())
  })
  await loadProdutos()
}

function getProdutoFormData() {
  const preco = document.getElementById('editPreco').value
  return {
    Titulo: document.getElementById('editTitulo').value,
    Link: document.getElementById('editLink').value || null,
    Descricao: document.getElementById('editDescricao').value || null,
    Categoria: document.getElementById('editCategoria').value,
    Preco: preco ? parseFloat(preco) : null,
    id_fornecedor: Number(document.getElementById('editFornecedor').value)
  }
}

async function deleteProduto(codProduto) {
  await adminRequest(`/admin/produtos/${codProduto}`, { method: 'DELETE' })
  await loadProdutos()
  await loadAvaliacoes()
}

// AVALIAÇÕES
async function loadAvaliacoes() {
  try {
    appState.avaliacoes = await adminRequest('/admin/avaliacoes')
    appState.filteredData.avaliacoes = appState.avaliacoes
    renderAvaliacoesTable()
  } catch (error) {
    showError(error.message)
  }
}

function renderAvaliacoesTable() {
  const tbody = document.getElementById('avaliacoesTableBody')
  if (!tbody) return
  if (!appState.filteredData.avaliacoes.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">Nenhuma avaliação encontrada</td></tr>'
    return
  }
  tbody.innerHTML = appState.filteredData.avaliacoes.map(avaliacao => `
    <tr>
      <td>${avaliacao.id}</td>
      <td>${escapeHtml(avaliacao.produto_titulo)}</td>
      <td>${escapeHtml(avaliacao.cliente_nome)}</td>
      <td>${Number(avaliacao.nota).toFixed(1)}</td>
      <td>${escapeHtml(avaliacao.comentario || 'Sem comentário')}</td>
      <td>${formatDate(avaliacao.created_at)}</td>
      <td><div class="admin-action-buttons">
        <button class="btn-edit" onclick="openEditAvaliacaoModal(${avaliacao.id})">Editar</button>
        <button class="btn-delete" onclick="openDeleteModal('avaliacao', ${avaliacao.id})">Deletar</button>
      </div></td>
    </tr>`).join('')
}

function filterAvaliacoes() {
  const search = document.getElementById('searchAvaliacoes').value.toLowerCase()
  appState.filteredData.avaliacoes = appState.avaliacoes.filter(avaliacao =>
    avaliacao.produto_titulo.toLowerCase().includes(search) ||
    avaliacao.cliente_nome.toLowerCase().includes(search) ||
    String(avaliacao.nota).includes(search)
  )
  renderAvaliacoesTable()
}

function openEditAvaliacaoModal(id) {
  const avaliacao = appState.avaliacoes.find(a => a.id === id)
  if (!avaliacao) return
  appState.modalMode = 'edit'
  appState.currentEditItem = { type: 'avaliacao', data: avaliacao }
  document.getElementById('modalTitle').textContent = 'Editar Avaliação'
  document.getElementById('editForm').innerHTML = `
    <div class="form-group"><label>Produto</label><input type="text" value="${escapeAttr(avaliacao.produto_titulo)}" disabled></div>
    <div class="form-group"><label>Cliente</label><input type="text" value="${escapeAttr(avaliacao.cliente_nome)}" disabled></div>
    <div class="form-group"><label>Nota</label><select id="editNota" required>${ratingOptions(avaliacao.nota)}</select></div>
    <div class="form-group"><label>Comentário</label><textarea id="editComentario" rows="4">${escapeHtml(avaliacao.comentario || '')}</textarea></div>`
  openEditModal()
}

function ratingOptions(selected) {
  let html = ''
  for (let n = 0.5; n <= 5; n += 0.5) {
    html += `<option value="${n}" ${Number(selected) === n ? 'selected' : ''}>${n.toFixed(1)}</option>`
  }
  return html
}

async function updateAvaliacao(id) {
  await adminRequest(`/admin/avaliacoes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nota: Number(document.getElementById('editNota').value),
      comentario: document.getElementById('editComentario').value || null
    })
  })
  await loadAvaliacoes()
  await loadFornecedores()
}

async function deleteAvaliacao(id) {
  await adminRequest(`/admin/avaliacoes/${id}`, { method: 'DELETE' })
  await loadAvaliacoes()
  await loadFornecedores()
}

// MODAIS
function openEditModal() {
  document.getElementById('editModal').classList.add('active')
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active')
  appState.currentEditItem = null
  appState.modalMode = 'edit'
}

async function saveEdit() {
  if (!appState.currentEditItem) return
  const { type, data } = appState.currentEditItem

  try {
    if (appState.modalMode === 'create') {
      if (type === 'cliente') await createCliente()
      else if (type === 'fornecedor') await createFornecedor()
      else if (type === 'produto') await createProduto()
      showSuccess('Item criado com sucesso!')
    } else {
      if (type === 'cliente') await updateCliente(data.idc)
      else if (type === 'fornecedor') await updateFornecedor(data.id_fornecedor)
      else if (type === 'produto') await updateProduto(data.Cod_produto)
      else if (type === 'avaliacao') await updateAvaliacao(data.id)
      showSuccess('Alterações salvas com sucesso!')
    }
    closeEditModal()
  } catch (error) {
    alert(error.message)
  }
}

function openDeleteModal(type, id) {
  appState.currentDeleteItem = { type, id }
  const messages = {
    cliente: 'Tem certeza que deseja deletar este cliente?',
    fornecedor: 'Tem certeza que deseja deletar este fornecedor? Todos os seus produtos também serão deletados.',
    produto: 'Tem certeza que deseja deletar este produto?',
    avaliacao: 'Tem certeza que deseja deletar esta avaliação?'
  }
  document.getElementById('deleteMessage').textContent = `${messages[type]} Esta ação não pode ser desfeita.`
  document.getElementById('deleteModal').classList.add('active')
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active')
  appState.currentDeleteItem = null
}

async function confirmDelete() {
  if (!appState.currentDeleteItem) return
  const { type, id } = appState.currentDeleteItem

  try {
    if (type === 'cliente') await deleteCliente(id)
    else if (type === 'fornecedor') await deleteFornecedor(id)
    else if (type === 'produto') await deleteProduto(id)
    else if (type === 'avaliacao') await deleteAvaliacao(id)
    closeDeleteModal()
    showSuccess('Item deletado com sucesso!')
  } catch (error) {
    alert(error.message)
  }
}

// UTILITÁRIOS
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttr(value) {
  return escapeHtml(value)
}

function showSuccess(message) {
  console.log('✓', message)
}

function showError(message) {
  console.error('✗', message)
}

async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout/adm`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
  localStorage.removeItem('token')
  localStorage.removeItem('adminUser')
  window.location.href = 'admin-login.html'
}
