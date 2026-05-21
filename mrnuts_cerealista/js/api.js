// ═══════════════════════════════════════════════════════════════════════════
// API.JS - Serviço de Chamadas HTTP para a API Backend
// ═════════════════════════════════════════════════════════════════════════ */

class ApiService {
    constructor() {
        this.baseURL = config.API_BASE_URL
        this.token = localStorage.getItem(config.STORAGE_KEYS.TOKEN)
    }

    /**
     * Define o token de autenticação
     */
    setToken(token) {
        this.token = token
        if (token) {
            localStorage.setItem(config.STORAGE_KEYS.TOKEN, token)
        } else {
            localStorage.removeItem(config.STORAGE_KEYS.TOKEN)
        }
    }

    /**
     * Obtém o token atual
     */
    getToken() {
        return this.token
    }

    /**
     * Método genérico para requisições HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        }

        // Adiciona token se disponível
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`
        }

        const config = {
            method: options.method || 'GET',
            headers
        }

        // Remove Content-Type para FormData
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type']
            config.body = options.body
        } else if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body)
        }

        try {
            const response = await fetch(url, config)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`)
            }

            return data
        } catch (error) {
            console.error('API Error:', error)
            throw error
        }
    }

    // ───────────────────────────────────────────────────────────────────────
    // AUTH
    // ───────────────────────────────────────────────────────────────────────

    async loginClient(email, password) {
        return this.request(config.ENDPOINTS.AUTH.LOGIN_CLIENT, {
            method: 'POST',
            body: { email, password }
        })
    }

    async loginSupplier(email, password) {
        return this.request(config.ENDPOINTS.AUTH.LOGIN_SUPPLIER, {
            method: 'POST',
            body: { email, password }
        })
    }

    async registerClient(name, email, telefone, password) {
        return this.request(config.ENDPOINTS.AUTH.REGISTER_CLIENT, {
            method: 'POST',
            body: { name, email, telefone, password }
        })
    }

    async registerSupplier(name, cnpj, email, password) {
        return this.request(config.ENDPOINTS.AUTH.REGISTER_SUPPLIER, {
            method: 'POST',
            body: { name, cnpj, email, password }
            
        })

    }

    async logoutClient() {
        return this.request(config.ENDPOINTS.AUTH.LOGOUT_CLIENT, {
            method: 'POST'
        })
    }

    async logoutSupplier() {
        return this.request(config.ENDPOINTS.AUTH.LOGOUT_SUPPLIER, {
            method: 'POST'
        })
    }

    async forgotPasswordClient(email, newPassword) {
        return this.request(config.ENDPOINTS.AUTH.FORGOT_PASSWORD_CLIENT, {
            method: 'POST',
            body: { email, newPassword }
        })
    }

    async forgotPasswordSupplier(email, newPassword) {
        return this.request(config.ENDPOINTS.AUTH.FORGOT_PASSWORD_SUPPLIER, {
            method: 'POST',
            body: { email, newPassword }
        })
    }

    // ───────────────────────────────────────────────────────────────────────
    // CLIENTES
    // ───────────────────────────────────────────────────────────────────────

    async getClients() {
        return this.request(config.ENDPOINTS.CLIENTS.LIST)
    }

    async getClient(idc) {
        return this.request(config.ENDPOINTS.CLIENTS.GET(idc))
    }

    async createClient(formData) {
        return this.request(config.ENDPOINTS.CLIENTS.CREATE, {
            method: 'POST',
            body: formData
        })
    }

    async updateClient(idc, formData) {
        return this.request(config.ENDPOINTS.CLIENTS.UPDATE(idc), {
            method: 'PUT',
            body: formData
        })
    }

    async deleteClient(idc) {
        return this.request(config.ENDPOINTS.CLIENTS.DELETE(idc), {
            method: 'DELETE'
        })
    }

    async getClientProfile() {
        return this.request(config.ENDPOINTS.CLIENTS.PROFILE)
    }

    async updateClientProfile(data) {
        return this.request(config.ENDPOINTS.CLIENTS.UPDATE_ME, {
            method: 'PUT',
            body: data
        })
    }

    // ───────────────────────────────────────────────────────────────────────
    // FORNECEDORES
    // ───────────────────────────────────────────────────────────────────────

    async getSuppliers() {
        return this.request(config.ENDPOINTS.SUPPLIERS.LIST)
    }

    async getSupplier(idf) {
        return this.request(config.ENDPOINTS.SUPPLIERS.GET(idf))
    }

    async createSupplier(formData) {
        return this.request(config.ENDPOINTS.SUPPLIERS.CREATE, {
            method: 'POST',
            body: formData
        })
    }

    async updateSupplier(idf, formData) {
        return this.request(config.ENDPOINTS.SUPPLIERS.UPDATE(idf), {
            method: 'PUT',
            body: formData
        })
    }

    async deleteSupplier(idf) {
        return this.request(config.ENDPOINTS.SUPPLIERS.DELETE(idf), {
            method: 'DELETE'
        })
    }

    async getSupplierProfile() {
        return this.request(config.ENDPOINTS.SUPPLIERS.PROFILE)
    }

    async updateSupplierProfile(data) {
        return this.request(config.ENDPOINTS.SUPPLIERS.UPDATE_ME, {
            method: 'PUT',
            body: data
        })
    }

    // ───────────────────────────────────────────────────────────────────────
    // PRODUTOS
    // ───────────────────────────────────────────────────────────────────────

    async getProducts() {
        return this.request(config.ENDPOINTS.PRODUCTS.LIST)
    }

    async getProduct(id) {
        return this.request(config.ENDPOINTS.PRODUCTS.GET(id))
    }

    async createProduct(formData) {
        return this.request(config.ENDPOINTS.PRODUCTS.CREATE, {
            method: 'POST',
            body: formData
        })
    }

    async updateProduct(id, formData) {
        return this.request(config.ENDPOINTS.PRODUCTS.UPDATE(id), {
            method: 'PUT',
            body: formData
        })
    }

    async deleteProduct(id) {
        return this.request(config.ENDPOINTS.PRODUCTS.DELETE(id), {
            method: 'DELETE'
        })
    }

    // ───────────────────────────────────────────────────────────────────────
    // FAVORITOS
    // ───────────────────────────────────────────────────────────────────────

    async adicionarFavorito(produto_id) {
        return this.request(config.ENDPOINTS.FAVORITOS.ADICIONAR, {
            method: 'POST',
            body: { produto_id }
        })
    }

    async removerFavorito(produto_id) {
        return this.request(config.ENDPOINTS.FAVORITOS.REMOVER, {
            method: 'DELETE',
            body: { produto_id }
        })
    }

    async listarFavoritos() {
        return this.request(config.ENDPOINTS.FAVORITOS.LISTAR)
    }

    async verificarFavorito(produto_id) {
        return this.request(config.ENDPOINTS.FAVORITOS.VERIFICAR(produto_id))
    }
}

// Criar instância global
const api = new ApiService()
