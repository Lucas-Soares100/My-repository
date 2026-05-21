// ═══════════════════════════════════════════════════════════════════════════
// APP.JS - Lógica Principal da Aplicação
// ═════════════════════════════════════════════════════════════════════════ */

class MrNutsApp {
    constructor() {
        this.currentPage = 'home'
        this.previousPage = null
        this.currentProduct = null
        this.currentSupplier = null
        this.products = []
        this.suppliers = []
        this.deleteConfirmCallback = null
        this._rpTrack = null  // referência ao track do carrossel de relacionados
        
        this.init()
    }

    /**
     * Inicialização da aplicação
     */
    init() {
        this.setupEventListeners()
        this.updateUI()
        this.loadData()
        
        // ✅ Redireciona para registro se não estiver logado
        if (!UserManager.isLoggedIn()) {
            this.navigateTo('register')
        }
    }

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        // Menu de usuário
        const userBtn = document.querySelector('.user-btn')
        if (userBtn) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                this.toggleUserDropdown()
            })
        }

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', () => {
            const dropdown = document.getElementById('user-dropdown')
            if (dropdown) dropdown.classList.remove('show')
        })

        // Busca
        const searchBtn = document.querySelector('.search-btn')
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch())
        }

        const searchInput = document.getElementById('search-input')
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch()
            })
        }

        // Navegação
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                e.preventDefault()
                const page = e.target.dataset.page
                if (page) this.navigateTo(page)
            }
        })

        // Modais - fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals()
            }
        })

        // Formatação de CNPJ
        document.addEventListener('input', (e) => {
            if (e.target.id === 'supplier-cnpj') {
                e.target.value = formatCNPJ(e.target.value)
            }
        })

        // Formatação de telefone do cliente
        document.addEventListener('input', (e) => {
            if (e.target.id === 'client-phone') {
                e.target.value = formatPhone(e.target.value)
            }
        })

        // Pré-visualização de múltiplas imagens
        document.addEventListener('change', (e) => {
            if (e.target.id === 'product-images') {
                this.previewProductImages(e.target.files)
            }
        })
    }

    /**
     * Carregar dados iniciais
     */
    async loadData() {
        try {
            // Carregar produtos
            this.products = await api.getProducts()
            this.products.forEach(p => {
                p.image_url = getImageUrl(p.img_capa || p.img)
            })

            // Carregar fornecedores
            this.suppliers = await api.getSuppliers()
            this.suppliers.forEach(s => {
                s.image_url = getImageUrl(s.img)
            })

            // Renderizar home page
            if (this.currentPage === 'home') {
                this.renderHomePage()
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        }
    }

    /**
     * Atualizar UI baseado no estado de login
     */
    updateUI() {
        const isLoggedIn = UserManager.isLoggedIn()
        const userType = UserManager.getUserType()
        const navCenter = document.getElementById('nav-center')
        const userDropdown = document.getElementById('user-dropdown')
        const userBtn = document.querySelector('.user-btn')

        // Atualiza avatar da navbar
        if (userBtn) {
            if (isLoggedIn) {
                const user = UserManager.getUser()
                if (user?.img) {
                    userBtn.innerHTML = `<img src="${getImageUrl(user.img)}" alt="avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #fff;">`
                } else {
                    userBtn.innerHTML = `<i class="fas fa-user-circle"></i>`
                }
            } else {
                userBtn.innerHTML = `<i class="fas fa-user-circle"></i>`
            }
        }

        navCenter.innerHTML = ''

        if (isLoggedIn) {
            if (userType === config.USER_TYPES.SUPPLIER) {
                navCenter.innerHTML = `
                    <a class="nav-link" href="#" onclick="app.navigateTo('products'); return false;">Produtos</a>
                    <a class="nav-link" href="#" onclick="app.navigateTo('suppliers'); return false;">Fornecedores</a>
                `
                userDropdown.innerHTML = `
                    <a href="#" onclick="app.navigateTo('supplier-dashboard'); return false;">
                        <i class="fas fa-chart-line"></i> Dashboard
                    </a>
                    <a href="#" onclick="app.logout(); return false;">
                        <i class="fas fa-sign-out-alt"></i> Sair
                    </a>
                `
                // Fornecedor não tem favoritos
                const favBtn = document.getElementById('favorites-btn')
                if (favBtn) favBtn.style.display = 'none'
            } else {
                navCenter.innerHTML = `
                    <a class="nav-link" href="#" onclick="app.navigateTo('products'); return false;">Produtos</a>
                    <a class="nav-link" href="#" onclick="app.navigateTo('suppliers'); return false;">Fornecedores</a>
                `
                userDropdown.innerHTML = `
                    <a href="#" onclick="app.navigateTo('client-dashboard'); return false;">
                        <i class="fas fa-user"></i> Meu Perfil
                    </a>
                    <a href="#" onclick="app.logout(); return false;">
                        <i class="fas fa-sign-out-alt"></i> Sair
                    </a>
                `
                // Cliente tem favoritos
                const favBtn = document.getElementById('favorites-btn')
                if (favBtn) favBtn.style.display = ''
            }
        } else {
            navCenter.innerHTML = `
                <a class="nav-link" href="#" onclick="app.navigateTo('products'); return false;">Produtos</a>
                <a class="nav-link" href="#" onclick="app.navigateTo('suppliers'); return false;">Fornecedores</a>
                <a class="nav-link" href="#" onclick="app.navigateTo('login'); return false;">Entrar</a>
            `
            userDropdown.innerHTML = `
                <a href="#" onclick="app.navigateTo('login'); return false;">
                    <i class="fas fa-sign-in-alt"></i> Login
                </a>
            `
            // Visitante não logado não vê favoritos
            const favBtn = document.getElementById('favorites-btn')
            if (favBtn) favBtn.style.display = 'none'
        }

        // Atualizar botão de troca de perfil
        if (typeof window.atualizarBotaoTroca === 'function') window.atualizarBotaoTroca()
    }

    /**
     * Navegar para página
     */
    navigateTo(page) {
        this.closeAllModals()
        this.previousPage = this.currentPage
        this.currentPage = page

        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'))

        let pageElement = null
        switch (page) {
            case 'home':
                pageElement = document.getElementById('home-page')
                this.renderHomePage()
                break
            case 'products':
                pageElement = document.getElementById('products-page')
                this.renderProductsPage()
                break
            case 'product-detail':
                pageElement = document.getElementById('product-details-page')
                break
            case 'supplier-profile':
                pageElement = document.getElementById('supplier-profile-page')
                break
            case 'login':
                pageElement = document.getElementById('auth-page')
                this.renderLoginPage()
                break
            case 'register':
                pageElement = document.getElementById('auth-page')
                this.renderRegisterPage()
                break
            case 'forgot-password-client':
                pageElement = document.getElementById('auth-page')
                this.renderForgotPasswordPage('cliente')
                break
            case 'forgot-password-supplier':
                pageElement = document.getElementById('auth-page')
                this.renderForgotPasswordPage('fornecedor')
                break
            case 'supplier-dashboard':
                if (!UserManager.isSupplier()) {
                    notify.warning('Acesso restrito a fornecedores')
                    this.navigateTo('home')
                    return
                }
                pageElement = document.getElementById('supplier-dashboard-page')
                this.renderSupplierDashboard()
                break
            case 'client-dashboard':
                if (!UserManager.isClient()) {
                    notify.warning('Acesso restrito a clientes')
                    this.navigateTo('home')
                    return
                }
                pageElement = document.getElementById('client-dashboard-page')
                this.renderClientDashboard()
                break
            default:
                pageElement = document.getElementById('home-page')
                this.renderHomePage()
        }

        if (pageElement) {
            pageElement.classList.remove('hidden')
        }

        window.scrollTo(0, 0)
    }

    /**
     * Pré-visualizar múltiplas imagens de produto
     */
    previewProductImages(files) {
        const preview = document.getElementById('product-images-preview')
        preview.innerHTML = ''

        if (files.length > 5) {
            notify.warning('Máximo 5 imagens permitidas')
            return
        }

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const div = document.createElement('div')
                div.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 4px; overflow: hidden; border: 1px solid #ddd;'
                
                const img = document.createElement('img')
                img.src = e.target.result
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;'
                
                const label = document.createElement('span')
                label.textContent = index === 0 ? 'Capa' : `${index}`
                label.style.cssText = 'position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; padding: 2px 4px; border-radius: 2px;'
                
                div.appendChild(img)
                div.appendChild(label)
                preview.appendChild(div)
            }
            reader.readAsDataURL(file)
        })
    }

    /**
     * Renderizar Home Page
     */
    renderHomePage() {
        const categoriesContainer = document.getElementById('categories-container')
        categoriesContainer.innerHTML = config.CATEGORIES
            .map(cat => `
                <div class="category-card" onclick="app.filterByCategory('${cat.value}')">
                    <div class="category-icon">${cat.icon}</div>
                    <div class="category-name">${cat.label}</div>
                </div>
            `)
            .join('')

        const featured = this.products.slice(0, 8)
        const featuredContainer = document.getElementById('featured-products')
        featuredContainer.innerHTML = featured.map(p => this.renderProductCard(p)).join('')

        const featuredSuppliers = this.suppliers.slice(0, 6)
        const suppliersContainer = document.getElementById('featured-suppliers')
        suppliersContainer.innerHTML = featuredSuppliers.map(s => this.renderSupplierCard(s)).join('')
    }

    /**
     * Renderizar Página de Produtos
     */
    renderProductsPage() {
        const categoryFilter = document.getElementById('category-filter')
        const category = categoryFilter?.value || ''

        let filtered = this.products
        if (category) {
            filtered = this.products.filter(p => p.Categoria === category)
        }

        const container = document.getElementById('all-products')
        container.innerHTML = filtered.map(p => this.renderProductCard(p)).join('')

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.renderProductsPage())
        }
    }

    /**
     * Renderizar Card de Produto
     */
    renderProductCard(product, showFavorite = true) {
        const isFavorite = FavoritesManager.isFavorite(product.Cod_produto)
        const isClient = UserManager.getUserType() === config.USER_TYPES.CLIENT
        const canFavorite = showFavorite && isClient
        return `
            <div class="product-card">
                <img src="${product.image_url}" alt="${product.Titulo}" class="product-image" 
                     onclick="app.viewProductDetails(${product.Cod_produto})">
                <div class="product-info">
                    <div class="product-category">${product.Categoria}</div>
                    <div class="product-title" onclick="app.viewProductDetails(${product.Cod_produto}); return false;" style="cursor: pointer;">
                        ${product.Titulo}
                    </div>
                    ${canFavorite ? `
                    <div class="product-actions">
                        <button class="product-favorite-btn ${isFavorite ? 'favorited' : ''}" 
                                onclick="app.toggleFavoriteHandler(${product.Cod_produto}); return false;">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>` : ''}
                </div>
            </div>
        `
    }

    /**
     * Renderizar Card de Fornecedor
     */
    renderSupplierCard(supplier) {
        const reputacaoClass = supplier.reputacao >= 80 ? 'rating-excellent' : supplier.reputacao >= 60 ? 'rating-good' : 'rating-fair'
        const reputacaoLabel = supplier.reputacao >= 80 ? 'Excelente' : supplier.reputacao >= 60 ? 'Bom' : 'Regular'
        
        return `
            <div class="supplier-card" onclick="app.viewSupplierProfile(${supplier.id_fornecedor})">
                <img src="${supplier.image_url}" alt="${supplier.name}" class="supplier-avatar">
                <div class="supplier-name">${supplier.name}</div>
                <div class="supplier-location">
                    <i class="fas fa-map-marker-alt"></i> Brasil
                </div>
                <div class="supplier-rating ${reputacaoClass}">
                    <i class="fas fa-star"></i> ${supplier.reputacao || 0}% - ${reputacaoLabel}
                </div>
                <button class="supplier-btn" onclick="event.stopPropagation(); app.viewSupplierProfile(${supplier.id_fornecedor})">
                    Ver loja
                </button>
            </div>
        `
    }

    /**
     * Ver Detalhes do Produto
     */
    async viewProductDetails(productId) {
        try {
            const fromSupplierProfile = this.currentPage === 'supplier-profile'
            // ✅ Garante que os produtos estejam carregados antes de exibir relacionados
            if (this.products.length === 0) {
                this.products = await api.getProducts()
                this.products.forEach(p => {
                    p.image_url = getImageUrl(p.img_capa || p.img)
                })
            }
            if (this.suppliers.length === 0) {
                this.suppliers = await api.getSuppliers()
                this.suppliers.forEach(s => {
                    s.image_url = getImageUrl(s.img)
                })
            }

            const product = await api.getProduct(productId)
            
            const capImage = getImageUrl(product.img_capa || product.img)
            const galleryImages = product.img_galeria 
                ? (typeof product.img_galeria === 'string' ? JSON.parse(product.img_galeria) : product.img_galeria)
                : []
            const allImages = [capImage, ...galleryImages.map(img => getImageUrl(img))]
            
            const supplier = this.suppliers.find(s => s.id_fornecedor === product.id_fornecedor)
            
            const content = document.getElementById('product-details-content')
            const isFavorite = FavoritesManager.isFavorite(productId)
            
            const thumbnailsHTML = allImages.map((img, index) => `
                <img src="${img}" class="product-thumbnail ${index === 0 ? 'active' : ''}" 
                     onclick="app.changeMainImage(this)" alt="Imagem ${index + 1}">
            `).join('')
            
            content.innerHTML = `
                <div class="product-details-container">
                    <div class="product-gallery">
                        <img src="${allImages[0]}" alt="${product.Titulo}" class="product-main-image" id="product-main-image">
                        <div class="product-thumbnails">
                            ${thumbnailsHTML}
                        </div>
                    </div>
                    
                    <div class="product-details-info">
                        <span class="product-details-category">${product.Categoria}</span>
                        <h1 class="product-details-title">${product.Titulo}</h1>
                        
                        <div class="product-details-supplier">
                            <div class="product-supplier-left">
                                <img src="${supplier?.image_url || 'https://via.placeholder.com/50'}" 
                                     alt="${supplier?.name}" class="product-supplier-avatar">
                                <div class="product-supplier-info">
                                    <h3 onclick="app.viewSupplierProfile(${supplier?.id_fornecedor}); return false;" style="cursor: pointer;">
                                        ${supplier?.name || 'Fornecedor'}
                                    </h3>
                                    <small>
                                        ${supplier?.reputacao ? `⭐ ${supplier.reputacao}% Reputação` : 'Sem avaliações ainda'}
                                    </small>
                                </div>
                            </div>
                            <div class="product-supplier-follow">
                                <button id="seguir-fornecedor-btn"
                                        onclick="toggleSeguirFornecedor(${product.id_fornecedor})">
                                    <i class="fas fa-user-plus"></i> Seguir
                                </button>
                                <div class="seguidores-count">
                                    <span id="seguidores-count-${product.id_fornecedor}">0</span> seguidores
                                </div>
                            </div>
                        </div>
                        
                        <div class="product-details-rating" id="product-rating-display">
                            <span class="stars">★★★★★</span>
                            <span id="product-rating-count">(Carregando...)</span>
                        </div>
                        
                        ${product.Preco ? `
                        <div class="product-details-price">
                            <h3>Preço</h3>
                            <span class="price-value">${formatCurrency(product.Preco)}</span>
                        </div>` : ''}
                        
                        <div class="product-details-actions">
                            <a href="${product.Link || '#'}" target="_blank" class="btn-primary">
                                <i class="fas fa-external-link-alt"></i> Visitar Loja do Fornecedor
                            </a>
                            ${UserManager.getUserType() === config.USER_TYPES.CLIENT ? `
                            <button class="btn-secondary ${isFavorite ? 'favorited' : ''}" 
                                    onclick="app.toggleFavoriteHandler(${productId}); return false;">
                                <i class="fas fa-heart"></i> ${isFavorite ? 'Remover' : 'Favoritar'}
                            </button>` : ''}
                        </div>
                        
                        <div class="product-details-description">
                            <h3>Descrição</h3>
                            <p>${product.Descricao || 'Sem descrição disponível'}</p>
                        </div>
                    </div>
                </div>

                <section id="avaliacoes-section">
                    <h2>Avaliações</h2>
                    <div id="media-avaliacoes"></div>
                    <div id="form-avaliacao" style="display:none;">
                        <select id="nota-avaliacao">
                            <option value="0.5">0.5 ★</option>
                            <option value="1">1 ★</option>
                            <option value="1.5">1.5 ★</option>
                            <option value="2">2 ★</option>
                            <option value="2.5">2.5 ★</option>
                            <option value="3">3 ★</option>
                            <option value="3.5">3.5 ★</option>
                            <option value="4">4 ★</option>
                            <option value="4.5">4.5 ★</option>
                            <option value="5" selected>5 ★</option>
                        </select>
                        <textarea id="comentario-avaliacao" placeholder="Digite seu comentário"></textarea>
                        <button onclick="enviarAvaliacao()">Enviar Avaliação</button>
                    </div>
                    <div id="lista-avaliacoes"></div>
                </section>
            `
            
            this.currentProduct = product
            this.navigateTo('product-detail')

            // ✅ Renderizar produtos relacionados após navegar
            this._renderRelatedProducts(product)

            // Carregar avaliações do produto
            carregarAvaliacoes(product.Cod_produto)

            // Carregar estado de seguidores
            carregarEstadoSeguir(product.id_fornecedor)

        } catch (error) {
            notify.error('Erro ao carregar produto')
        }
    }

    /**
     * ✅ Renderizar Produtos Relacionados
     * Exibe produtos da mesma categoria, excluindo o produto atual.
     */
    _renderRelatedProducts(currentProduct) {
        const section = document.getElementById('related-products-section')
        const track   = document.getElementById('related-products-track')
        const pageInfo = document.getElementById('rp-page-info')

        if (!section || !track) return

        // Filtra por mesma categoria, exclui o produto atual
        const related = this.products.filter(p =>
            p.Cod_produto !== currentProduct.Cod_produto &&
            p.Categoria === currentProduct.Categoria
        )

        if (related.length === 0) {
            section.style.display = 'none'
            return
        }

        // Renderiza os cards do carrossel
        track.innerHTML = related.map(product => {
            const supplier = this.suppliers.find(s => s.id_fornecedor === product.id_fornecedor)
            const supplierName = supplier?.name || 'Fornecedor'
            const imgSrc = product.image_url || `https://via.placeholder.com/200x140?text=${encodeURIComponent(product.Titulo)}`

            return `
                <div class="related-product-card" onclick="app.viewProductDetails(${product.Cod_produto})">
                    <img src="${imgSrc}" alt="${product.Titulo}"
                         onerror="this.src='https://via.placeholder.com/200x140?text=Sem+imagem'">
                    <span class="rp-category">${product.Categoria}</span>
                    <p class="rp-title">${product.Titulo}</p>
                    <p class="rp-supplier">
                        <i class="fas fa-store"></i> ${supplierName}
                    </p>
                </div>
            `
        }).join('')

        // Atualiza paginação
        this._rpTrack = track
        const cardWidth = 216 // 200px card + 16px gap
        const visibleCount = Math.max(1, Math.floor(track.parentElement.offsetWidth / cardWidth))
        const totalPages   = Math.ceil(related.length / visibleCount)

        if (pageInfo) {
            pageInfo.textContent = totalPages > 1 ? `Página 1 de ${totalPages}` : ''
        }

        // Atualiza número de página ao rolar
        track.onscroll = () => {
            if (!pageInfo || totalPages <= 1) return
            const current = Math.round(track.scrollLeft / (cardWidth * visibleCount)) + 1
            pageInfo.textContent = `Página ${Math.min(current, totalPages)} de ${totalPages}`
        }

        section.style.display = 'block'
    }

    /**
     * ✅ Navegar no carrossel de relacionados
     * direction: 1 = próximo | -1 = anterior
     */
    scrollRelatedProducts(direction) {
        if (!this._rpTrack) return
        this._rpTrack.scrollBy({ left: direction * 216 * 3, behavior: 'smooth' })
    }

    /**
     * Trocar imagem principal da galeria
     */
    changeMainImage(thumbnail) {
        const mainImage = document.getElementById('product-main-image')
        if (mainImage) {
            mainImage.src = thumbnail.src
        }
        document.querySelectorAll('.product-thumbnail').forEach(thumb => {
            thumb.classList.remove('active')
        })
        thumbnail.classList.add('active')
    }

    /**
     * Ver Perfil do Fornecedor
     */
    async viewSupplierProfile(supplierId) {
        try {
            const supplier = await api.getSupplier(supplierId)
            supplier.image_url = getImageUrl(supplier.img)
            
            const supplierProducts = this.products.filter(p => p.id_fornecedor === supplierId)
            
            const reputacaoClass = supplier.reputacao >= 80 ? 'rating-excellent' : supplier.reputacao >= 60 ? 'rating-good' : 'rating-fair'
            const reputacaoLabel = supplier.reputacao >= 80 ? 'Excelente' : supplier.reputacao >= 60 ? 'Bom' : 'Regular'
            
            const content = document.getElementById('supplier-profile-content')
            content.innerHTML = `
                <div class="supplier-profile-header">
                    <img src="${supplier.image_url}" alt="${supplier.name}" class="supplier-profile-avatar">
                    <div class="supplier-profile-info">
                        <h1>${supplier.name}</h1>
                        <span class="badge">Fornecedor Verificado</span>
                        <div class="supplier-reputation ${reputacaoClass}">
                            <i class="fas fa-star"></i> ${supplier.reputacao || 0}% - ${reputacaoLabel}
                        </div>
                        <p>Email: ${supplier.email}</p>
                        <p>CNPJ: ${supplier.cnpj}</p>
                        <small class="text-muted">Membro desde ${formatDate(supplier.created_at)}</small>
                    </div>
                    <div class="supplier-profile-stats">
                        <div class="stat">
                            <div class="stat-value">${supplierProducts.length}</div>
                            <div class="stat-label">Produtos</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${supplier.reputacao || 0}%</div>
                            <div class="stat-label">Reputação</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="seguidores-count-${supplierId}">...</div>
                            <div class="stat-label">Seguidores</div>
                        </div>
                    </div>
                    <div class="supplier-profile-follow">
                        <button id="seguir-fornecedor-btn"
                                onclick="toggleSeguirFornecedor(${supplierId})">
                            <i class="fas fa-user-plus"></i> Seguir
                        </button>
                    </div>
                </div>
                
                <div class="related-products">
                    <h2>Produtos da Loja</h2>
                    <div class="products-grid">
                        ${supplierProducts.map(p => this.renderProductCard(p, false)).join('')}
                    </div>
                </div>
            `
            
            this.currentSupplier = supplier
            this.navigateTo('supplier-profile')

            // Carregar estado de seguidores no perfil
            carregarEstadoSeguir(supplierId)
        } catch (error) {
            notify.error('Erro ao carregar perfil do fornecedor')
        }
    }

    /**
     * Toggle Favorito
     */
    async toggleFavorite(productId) {
        try {
            const isFavorite = await FavoritesManager.toggleFavorite(productId)
            if (isFavorite) {
                notify.success('Adicionado aos favoritos!')
            } else {
                notify.info('Removido dos favoritos')
            }
            // Atualizar botão na página de detalhe do produto (sem re-renderizar tudo)
            const btnDetalhe = document.querySelector('#product-details-content .btn-secondary')
            if (btnDetalhe && btnDetalhe.getAttribute('onclick')?.includes('toggleFavorite')) {
                btnDetalhe.className = `btn-secondary ${isFavorite ? 'favorited' : ''}`
                btnDetalhe.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'Remover' : 'Favoritar'}`
            }
            // Atualizar todos os cards visíveis com esse produto
            document.querySelectorAll(`.product-favorite-btn`).forEach(btn => {
                const onclick = btn.getAttribute('onclick') || ''
                if (onclick.includes(String(productId))) {
                    btn.className = `product-favorite-btn ${isFavorite ? 'favorited' : ''}`
                }
            })
            if (this.currentPage === 'home') this.renderHomePage()
            if (this.currentPage === 'products') this.renderProductsPage()
        } catch (err) {
            console.error('Erro ao alternar favorito:', err)
        }
    }

    /**
     * Wrapper síncrono para toggleFavorite (usado no onclick do HTML)
     */
    toggleFavoriteHandler(productId) {
        this.toggleFavorite(productId)  // Inicia a Promise sem await
        return false  // Evita propagar evento
    }

    goToFavorites() {
        if (!UserManager.isLoggedIn() || UserManager.getUserType() !== config.USER_TYPES.CLIENT) {
            return notify.warning('Faça login como cliente para ver seus favoritos')
        }
        this.navigateTo('client-dashboard')
        this.showClientSection('favorites')
        // Ativar item correto na sidebar
        document.querySelectorAll('#sidebar-client .nav-item').forEach(n => n.classList.remove('active'))
        const favNav = document.querySelector('#sidebar-client .nav-item[onclick*="favorites"]')
        if (favNav) favNav.classList.add('active')
    }

    /**
     * Filtrar por Categoria
     */
    filterByCategory(category) {
        document.getElementById('category-filter').value = category
        this.navigateTo('products')
    }

    /**
     * Buscar
     */
    handleSearch() {
        const searchTerm = document.getElementById('search-input')?.value.trim().toLowerCase() || ''
        if (!searchTerm) {
            notify.warning('Digite algo para buscar')
            return
        }

        const filtered = this.products.filter(p =>
            p.Titulo.toLowerCase().includes(searchTerm) ||
            p.Categoria.toLowerCase().includes(searchTerm)
        )

        this.navigateTo('products')
        
        setTimeout(() => {
            const container = document.getElementById('all-products')
            if (!filtered.length) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666">Nenhum produto encontrado.</p>'
            } else {
                container.innerHTML = filtered.map(p => this.renderProductCard(p)).join('')
            }
        }, 100)
    }

    /**
     * Renderizar Página de Login
     */
    renderLoginPage() {
        const card = document.getElementById('auth-card')
        card.innerHTML = `
            <h1>Entrar</h1>
            
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="app.switchAuthTab('login-client')">Cliente</button>
                <button class="auth-tab" onclick="app.switchAuthTab('login-supplier')">Fornecedor</button>
            </div>
            
            <form id="login-client-form" class="auth-form" onsubmit="app.handleLoginClient(event)">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="login-client-email" required>
                </div>
                <div class="form-group">
                    <label>Senha</label>
                    <input type="password" id="login-client-password" required>
                </div>
                <div class="forgot-password-link">
                    <a href="#" onclick="app.navigateTo('forgot-password-client'); return false;">Esqueci minha senha</a>
                </div>
                <button type="submit" class="btn-primary">Entrar como Cliente</button>
            </form>
            
            <form id="login-supplier-form" class="auth-form" style="display: none;" onsubmit="app.handleLoginSupplier(event)">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="login-supplier-email" required>
                </div>
                <div class="form-group">
                    <label>Senha</label>
                    <input type="password" id="login-supplier-password" required>
                </div>
                <div class="forgot-password-link">
                    <a href="#" onclick="app.navigateTo('forgot-password-supplier'); return false;">Esqueci minha senha</a>
                </div>
                <button type="submit" class="btn-primary">Entrar como Fornecedor</button>
            </form>
            
            <div class="auth-footer">
                Não tem conta? <a href="#" onclick="app.navigateTo('register'); return false;">Cadastrar-se</a>
            </div>
        `
    }

    /**
     * Renderizar Página de Registro
     */
    renderRegisterPage() {
        const card = document.getElementById('auth-card')
        card.innerHTML = `
            <h1>Cadastrar-se</h1>
            
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="app.switchAuthTab('register-client')">Cliente</button>
                <button class="auth-tab" onclick="app.switchAuthTab('register-supplier')">Fornecedor</button>
            </div>
            
            <form id="register-client-form" class="auth-form" onsubmit="app.handleRegisterClient(event)">
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="register-client-name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="register-client-email" required>
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="tel" id="register-client-phone" required>
                </div>
                <div class="form-group">
                    <label>Senha</label>
                    <input type="password" id="register-client-password" required>
                </div>
                <button type="submit" class="btn-primary">Cadastrar como Cliente</button>
            </form>
            
            <form id="register-supplier-form" class="auth-form" style="display: none;" onsubmit="app.handleRegisterSupplier(event)">
                <div class="form-group">
                    <label>Nome da Empresa</label>
                    <input type="text" id="register-supplier-name" required>
                </div>
                <div class="form-group">
                    <label>CNPJ</label>
                    <input type="text" id="register-supplier-cnpj" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="register-supplier-email" required>
                </div>
                <div class="form-group">
                    <label>Senha</label>
                    <input type="password" id="register-supplier-password" required>
                </div>
                <button type="submit" class="btn-primary">Cadastrar como Fornecedor</button>
            </form>
            
            <div class="auth-footer">
                Já tem conta? <a href="#" onclick="app.navigateTo('login'); return false;">Entrar</a>
            </div>
        `
    }

    /**
     * Renderizar Página de Esqueci a Senha
     */
    renderForgotPasswordPage(userType) {
        const card = document.getElementById('auth-card')
        const isSupplier = userType === 'fornecedor'
        const typeLabel = isSupplier ? 'Fornecedor' : 'Cliente'
        const handleFn = isSupplier ? 'app.handleForgotPasswordSupplier(event)' : 'app.handleForgotPasswordClient(event)'

        card.innerHTML = `
            <div class="forgot-password-header">
                <button class="btn-back" onclick="app.navigateTo('login'); return false;">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h1>Redefinir Senha</h1>
            </div>

            <p class="forgot-password-subtitle">
                ${isSupplier
                    ? 'Insira o email da sua conta de fornecedor e defina uma nova senha.'
                    : 'Insira o email da sua conta de cliente e defina uma nova senha.'}
            </p>

            <div class="forgot-type-badge ${isSupplier ? 'badge-supplier' : 'badge-client'}">
                <i class="fas fa-${isSupplier ? 'store' : 'user'}"></i> ${typeLabel}
            </div>

            <form id="forgot-password-form" class="auth-form" onsubmit="${handleFn}">
                <div class="form-group">
                    <label>Email cadastrado</label>
                    <input type="email" id="forgot-email" placeholder="seu@email.com" required>
                </div>
                <div class="form-group">
                    <label>Nova senha</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="forgot-new-password" placeholder="Mínimo 6 caracteres" minlength="6" required>
                        <button type="button" class="toggle-password" onclick="app.togglePasswordVisibility('forgot-new-password', this)">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Confirmar nova senha</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="forgot-confirm-password" placeholder="Repita a nova senha" minlength="6" required>
                        <button type="button" class="toggle-password" onclick="app.togglePasswordVisibility('forgot-confirm-password', this)">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn-primary btn-full">
                    <i class="fas fa-lock"></i> Redefinir Senha
                </button>
            </form>

            <div class="auth-footer">
                Lembrou a senha? <a href="#" onclick="app.navigateTo('login'); return false;">Entrar</a>
            </div>
        `
    }

    /**
     * Mostrar/ocultar senha
     */
    togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId)
        if (!input) return
        const isHidden = input.type === 'password'
        input.type = isHidden ? 'text' : 'password'
        btn.querySelector('i').className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye'
    }

    /**
     * Handler - Esqueci senha Cliente
     */
    async handleForgotPasswordClient(e) {
        e.preventDefault()
        const email = document.getElementById('forgot-email').value.trim()
        const newPassword = document.getElementById('forgot-new-password').value
        const confirmPassword = document.getElementById('forgot-confirm-password').value

        if (newPassword !== confirmPassword) {
            notify.error('As senhas não coincidem')
            return
        }
        if (newPassword.length < 6) {
            notify.error('A senha deve ter no mínimo 6 caracteres')
            return
        }

        const btn = e.target.querySelector('button[type="submit"]')
        btn.disabled = true
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redefinindo...'

        try {
            await api.forgotPasswordClient(email, newPassword)
            notify.success('Senha redefinida com sucesso! Faça login com sua nova senha.')
            this.navigateTo('login')
        } catch (error) {
            notify.error(error.message || 'Erro ao redefinir senha')
            btn.disabled = false
            btn.innerHTML = '<i class="fas fa-lock"></i> Redefinir Senha'
        }
    }

    /**
     * Handler - Esqueci senha Fornecedor
     */
    async handleForgotPasswordSupplier(e) {
        e.preventDefault()
        const email = document.getElementById('forgot-email').value.trim()
        const newPassword = document.getElementById('forgot-new-password').value
        const confirmPassword = document.getElementById('forgot-confirm-password').value

        if (newPassword !== confirmPassword) {
            notify.error('As senhas não coincidem')
            return
        }
        if (newPassword.length < 6) {
            notify.error('A senha deve ter no mínimo 6 caracteres')
            return
        }

        const btn = e.target.querySelector('button[type="submit"]')
        btn.disabled = true
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redefinindo...'

        try {
            await api.forgotPasswordSupplier(email, newPassword)
            notify.success('Senha redefinida com sucesso! Faça login com sua nova senha.')
            this.navigateTo('login')
        } catch (error) {
            notify.error(error.message || 'Erro ao redefinir senha')
            btn.disabled = false
            btn.innerHTML = '<i class="fas fa-lock"></i> Redefinir Senha'
        }
    }


    /**
     * Switch entre abas de autenticação
     */
    switchAuthTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'))
        document.querySelectorAll('.auth-form').forEach(form => form.style.display = 'none')
        
        event.target.classList.add('active')
        document.getElementById(`${tabName}-form`)?.style.removeProperty('display')
    }

    /**
     * Handlers de Login
     */
    async handleLoginClient(e) {
        e.preventDefault()
        const email = document.getElementById('login-client-email').value
        const password = document.getElementById('login-client-password').value

        try {
            const response = await api.loginClient(email, password)
            UserManager.setUser(response.cliente, config.USER_TYPES.CLIENT, response.token)
            
            // ✅ Sincronizar favoritos do servidor após login
            await FavoritesManager.sincronizar()
            
            notify.success('Bem-vindo!')
            this.updateUI()
            this.navigateTo('home')
        } catch (error) {
            notify.error(error.message || 'Erro no login')
        }
    }

    async handleLoginSupplier(e) {
        e.preventDefault()
        const email = document.getElementById('login-supplier-email').value
        const password = document.getElementById('login-supplier-password').value

        try {
            const response = await api.loginSupplier(email, password)
            UserManager.setUser(response.fornecedor, config.USER_TYPES.SUPPLIER, response.token)
            notify.success('Bem-vindo!')
            this.updateUI()
            this.navigateTo('home')
        } catch (error) {
            notify.error(error.message || 'Erro no login')
        }
    }

    /**
     * Handlers de Registro
     */
    async handleRegisterClient(e) {
        e.preventDefault()
        const name = document.getElementById('register-client-name').value
        const email = document.getElementById('register-client-email').value
        const telefone = document.getElementById('register-client-phone').value
        const password = document.getElementById('register-client-password').value

        if (!isValidEmail(email)) {
            notify.error('Email inválido')
            return
        }

        if (!isValidPhone(telefone)) {
            notify.error('Telefone inválido')
            return
        }

        if (password.length < 6) {
            notify.error('Senha deve ter no mínimo 6 caracteres')
            return
        }

        try {
            await api.registerClient(name, email, telefone, password)
            notify.success('Cadastro realizado! Faça login para continuar.')
            this.navigateTo('login')
        } catch (error) {
            notify.error(error.message || 'Erro no cadastro')
        }
    }

    async handleRegisterSupplier(e) {
        e.preventDefault()
        const name = document.getElementById('register-supplier-name').value
        const cnpj = document.getElementById('register-supplier-cnpj').value
        const email = document.getElementById('register-supplier-email').value
        const password = document.getElementById('register-supplier-password').value

        const cnpjLimpo = cnpj.replace(/\D/g, '')

        if (cnpjLimpo.length !== 14) {
            notify.error('CNPJ inválido')
            return
        }

        if (!isValidEmail(email)) {
            notify.error('Email inválido')
            return
        }

        if (password.length < 6) {
            notify.error('Senha deve ter no mínimo 6 caracteres')
            return
        }

        try {
            await api.registerSupplier(name, cnpjLimpo, email, password)
            notify.success('Cadastro realizado! Faça login para continuar.')
            this.navigateTo('login')
        } catch (error) {
            notify.error(error.message || 'Erro no cadastro')
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            const userType = UserManager.getUserType()
            if (userType === config.USER_TYPES.CLIENT) {
                await api.logoutClient()
            } else if (userType === config.USER_TYPES.SUPPLIER) {
                await api.logoutSupplier()
            }
        } catch (error) {
            console.error('Erro no logout:', error)
        } finally {
            UserManager.logout()
            notify.success('Logout realizado')
            this.updateUI()
            this.navigateTo('home')
        }
    }

    /**
     * Renderizar Dashboard do Fornecedor
     */
    async renderSupplierDashboard() {
        try {
            const profile = await api.getSupplierProfile()
            const products = this.products.filter(p => p.id_fornecedor === profile.id_fornecedor)

            document.getElementById('supplier-name').value = profile.name
            document.getElementById('supplier-email').value = profile.email
            document.getElementById('supplier-cnpj').value = profile.cnpj

            const tbody = document.getElementById('supplier-products-tbody')
            tbody.innerHTML = products.map(p => `
                <tr>
                    <td><img src="${p.image_url}" alt="${p.Titulo}" class="product-img-thumb"></td>
                    <td>${truncateText(p.Titulo, 30)}</td>
                    <td>${p.Categoria}</td>
                    <td><a href="${p.Link}" target="_blank" style="color: #007bff; text-decoration: underline;">${truncateText(p.Link, 30)}</a></td>
                    <td class="table-actions">
                        <button class="btn-icon btn-sm" title="Editar" onclick="app.openProductModal('edit', ${p.Cod_produto})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-sm" title="Deletar" onclick="app.confirmDelete('product', ${p.Cod_produto})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('')
        } catch (error) {
            notify.error('Erro ao carregar dashboard')
        }
    }

    /**
     * Renderizar Dashboard do Cliente
     */
    async renderClientDashboard() {
        try {
            const profile = await api.getClientProfile()

            document.getElementById('client-name').value = profile.name
            document.getElementById('client-email').value = profile.email
            document.getElementById('client-phone').value = profile.telefone

            const favorites = FavoritesManager.getFavorites()
            const favoriteProducts = this.products.filter(p => favorites.includes(p.Cod_produto))
            const favContainer = document.getElementById('client-favorites')
            favContainer.innerHTML = favoriteProducts.length === 0 
                ? '<p class="text-muted text-center" style="grid-column: 1/-1; padding: 2rem;">Nenhum produto favorito ainda</p>'
                : favoriteProducts.map(p => this.renderProductCard(p)).join('')
        } catch (error) {
            notify.error('Erro ao carregar dashboard')
        }
    }

    /**
     * Mostrar seção do Dashboard de Fornecedor
     */
    showSupplierSection(section) {
        document.querySelectorAll('#supplier-dashboard-page .dashboard-section').forEach(s => s.classList.add('hidden'))
        document.querySelectorAll('#sidebar-supplier .nav-item').forEach(n => n.classList.remove('active'))
        
        if (section === 'products') {
            document.getElementById('supplier-products-section').classList.remove('hidden')
            event.target.closest('.nav-item').classList.add('active')
        } else if (section === 'profile') {
            document.getElementById('supplier-profile-section').classList.remove('hidden')
            event.target.closest('.nav-item').classList.add('active')
        } else if (section === 'analytics') {
            document.getElementById('supplier-analytics-section').classList.remove('hidden')
            event.target.closest('.nav-item').classList.add('active')
            renderFollowersChart()
        }
    }

    /**
     * Mostrar seção do Dashboard de Cliente
     */
    showClientSection(section) {
        document.querySelectorAll('#client-dashboard-page .dashboard-section').forEach(s => s.classList.add('hidden'))
        document.querySelectorAll('#sidebar-client .nav-item').forEach(n => n.classList.remove('active'))
        
        if (section === 'profile') {
            document.getElementById('client-profile-section').classList.remove('hidden')
            event.target.closest('.nav-item').classList.add('active')
        } else if (section === 'favorites') {
            document.getElementById('client-favorites-section').classList.remove('hidden')
            event.target.closest('.nav-item').classList.add('active')
        } else if (section === 'seguindo') {
            document.getElementById('client-seguindo-section').classList.remove('hidden')
            event.target.closest('.nav-item').classList.add('active')
            carregarSeguindo()
        }
    }

    /**
     * Abrir Modal de Produto
     */
    openProductModal(mode = 'create', productId = null) {
        const modal = document.getElementById('product-modal')
        const title = document.getElementById('product-modal-title')
        const form = document.getElementById('product-form')

        if (mode === 'create') {
            title.textContent = 'Novo Produto'
            form.reset()
            this.currentEditingProduct = null
        } else if (mode === 'edit' && productId) {
            const product = this.products.find(p => p.Cod_produto === productId)
            if (product) {
                title.textContent = 'Editar Produto'
                document.getElementById('product-titulo').value = product.Titulo
                document.getElementById('product-link').value = product.Link
                document.getElementById('product-categoria').value = product.Categoria
                document.getElementById('product-descricao').value = product.Descricao || ''
                document.getElementById('product-preco').value = product.Preco || ''
                document.getElementById('product-images').required = false
                this.currentEditingProduct = product
            }
        }

        modal.classList.add('show')
    }

    /**
     * Salvar Produto
     */
    async saveProduct(e) {
        e.preventDefault()

        if (!UserManager.isSupplier()) {
            notify.error('Apenas fornecedores podem salvar produtos')
            return
        }

        const titulo = document.getElementById('product-titulo').value
        const link = document.getElementById('product-link').value
        const categoria = document.getElementById('product-categoria').value
        const descricao = document.getElementById('product-descricao').value
        const preco = document.getElementById('product-preco').value
        const imageFiles = document.getElementById('product-images').files

        if (!titulo || !link || !categoria) {
            notify.error('Preencha todos os campos obrigatórios')
            return
        }

        if (imageFiles.length === 0 && !this.currentEditingProduct) {
            notify.error('Pelo menos 1 imagem é obrigatória para novos produtos')
            return
        }

        if (imageFiles.length > 5) {
            notify.error('Máximo 5 imagens permitidas')
            return
        }

        try {
            const formData = new FormData()
            formData.append('Titulo', titulo)
            formData.append('Link', link)
            formData.append('Categoria', categoria)
            formData.append('Descricao', descricao)
            formData.append('Preco', preco || null)
            
            for (let i = 0; i < imageFiles.length; i++) {
                formData.append('images', imageFiles[i])
            }

            if (this.currentEditingProduct) {
                await api.updateProduct(this.currentEditingProduct.Cod_produto, formData)
                notify.success('Produto atualizado com sucesso!')
            } else {
                await api.createProduct(formData)
                notify.success('Produto criado com sucesso!')
            }

            this.closeModal('product-modal')
            this.loadData()
            this.renderSupplierDashboard()
        } catch (error) {
            notify.error(error.message || 'Erro ao salvar produto')
        }
    }

    /**
     * Atualizar Perfil do Fornecedor
     */
    async updateSupplierProfile(e) {
        e.preventDefault()

        const name = document.getElementById('supplier-name').value
        const email = document.getElementById('supplier-email').value
        const cnpj = document.getElementById('supplier-cnpj').value
        const logoFile = document.getElementById('supplier-logo').files[0]

        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('email', email)
            formData.append('cnpj', cnpj)
            if (logoFile) formData.append('image', logoFile)

            const updated = await api.updateSupplierProfile(formData)

            // Atualiza localStorage com os novos dados (incluindo img) e refresca navbar
            const currentUser = UserManager.getUser()
            UserManager.setUser({ ...currentUser, ...updated }, config.USER_TYPES.SUPPLIER, api.getToken())
            this.updateUI()

            notify.success('Perfil atualizado com sucesso!')
        } catch (error) {
            notify.error(error.message || 'Erro ao atualizar perfil')
        }
    }

    /**
     * Atualizar Perfil do Cliente
     */
    async updateClientProfile(e) {
        e.preventDefault()

        const name = document.getElementById('client-name').value
        const currentPassword = document.getElementById('client-current-password').value
        const newPassword = document.getElementById('client-new-password').value
        const photoFile = document.getElementById('client-photo')?.files[0]

        try {
            const formData = new FormData()
            formData.append('name', name)
            if (currentPassword && newPassword) {
                formData.append('currentPassword', currentPassword)
                formData.append('newPassword', newPassword)
            }
            if (photoFile) formData.append('image', photoFile)

            const updated = await api.updateClientProfile(formData)

            // Atualiza localStorage com os novos dados (incluindo img) e refresca navbar
            const currentUser = UserManager.getUser()
            UserManager.setUser({ ...currentUser, ...updated }, config.USER_TYPES.CLIENT, api.getToken())
            this.updateUI()

            notify.success('Perfil atualizado com sucesso!')
        } catch (error) {
            notify.error(error.message || 'Erro ao atualizar perfil')
        }
    }

    /**
     * Confirmar Exclusão
     */
    confirmDelete(type, id) {
        const modal = document.getElementById('confirm-modal')
        const btn = document.getElementById('confirm-delete-btn')
        
        let message = 'Tem certeza que deseja excluir este item?'
        if (type === 'product') {
            message = 'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.'
        }
        
        document.getElementById('confirm-message').textContent = message
        
        this.deleteConfirmCallback = () => this.deleteItem(type, id)
        btn.onclick = () => this.deleteConfirmCallback()
        
        modal.classList.add('show')
    }

    /**
     * Deletar Item
     */
    async deleteItem(type, id) {
        try {
            if (type === 'product') {
                await api.deleteProduct(id)
                notify.success('Produto deletado com sucesso!')
            }
            
            this.closeModal('confirm-modal')
            this.loadData()
            this.renderSupplierDashboard()
        } catch (error) {
            notify.error(error.message || 'Erro ao deletar')
        }
    }

    /**
     * Abrir Modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId)
        if (modal) modal.classList.add('show')
    }

    /**
     * Fechar Modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId)
        if (modal) modal.classList.remove('show')
    }

    /**
     * Fechar Todos os Modais
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'))
    }

    /**
     * Toggle Menu de Usuário
     */
    toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown')
        dropdown.classList.toggle('show')
    }

    /**
     * Suppliers List (para futuro uso)
     */
    renderSuppliersList() {
        this.navigateTo('home')
    }
}

// Instanciar aplicação quando DOM está pronto
let app
document.addEventListener('DOMContentLoaded', () => {
    app = new MrNutsApp()
})