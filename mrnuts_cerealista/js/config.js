// ═══════════════════════════════════════════════════════════════════════════
// CONFIG.JS - Configurações da Aplicação
// ═══════════════════════════════════════════════════════════════════════════

const config = {
    // URL da API Backend
    API_BASE_URL: 'http://localhost:3000/api',
    
    // Categorias de Produtos
    CATEGORIES: [
        { value: 'nozes', label: 'Nozes', icon: '🥜' },
        { value: 'castanhas', label: 'Castanhas', icon: '🏔️' },
        { value: 'grãos', label: 'Grãos', icon: '🌾' },
        { value: 'sementes', label: 'Sementes', icon: '🌱' },
        { value: 'farináceos', label: 'Farináceos', icon: '🥖' },
        { value: 'chips', label: 'Chips', icon: '🍪' },
        { value: 'temperos', label: 'Temperos', icon: '🌶️' }
    ],
    
    // Tipos de Usuário
    USER_TYPES: {
        CLIENT: 'cliente',
        SUPPLIER: 'fornecedor',
        ADMIN: 'adm'
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'mrnuts_token',
        USER: 'mrnuts_user',
        USER_TYPE: 'mrnuts_user_type',
        FAVORITES: 'mrnuts_favorites',
        CART: 'mrnuts_cart'
    },

    // Endpoints da API
    ENDPOINTS: {
        // Auth
        AUTH: {
            LOGIN_CLIENT: '/auth/login/cliente',
            LOGIN_SUPPLIER: '/auth/login/fornecedor',
            REGISTER_CLIENT: '/auth/register/cliente',
            REGISTER_SUPPLIER: '/auth/register/fornecedor',
            LOGOUT_CLIENT: '/auth/logout/cliente',
            LOGOUT_SUPPLIER: '/auth/logout/fornecedor',
            FORGOT_PASSWORD_CLIENT: '/auth/forgot-password/cliente',
            FORGOT_PASSWORD_SUPPLIER: '/auth/forgot-password/fornecedor'
        },
        // Clientes
        CLIENTS: {
            LIST: '/cliente',
            GET: (idc) => `/cliente/${idc}`,
            CREATE: '/cliente',
            UPDATE: (idc) => `/cliente/${idc}`,
            DELETE: (idc) => `/cliente/${idc}`,
            PROFILE: '/cliente/profile',
            UPDATE_ME: '/cliente/me'
        },
        // Fornecedores
        SUPPLIERS: {
            LIST: '/fornecedor',
            GET: (idf) => `/fornecedor/${idf}`,
            CREATE: '/fornecedor',
            UPDATE: (idf) => `/fornecedor/${idf}`,
            DELETE: (idf) => `/fornecedor/${idf}`,
            PROFILE: '/fornecedor/profile',
            UPDATE_ME: '/fornecedor/me'
        },
        // Produtos
        PRODUCTS: {
            LIST: '/produto',
            GET: (id) => `/produto/${id}`,
            CREATE: '/produto',
            UPDATE: (id) => `/produto/${id}`,
            DELETE: (id) => `/produto/${id}`
        },
        // Favoritos
        FAVORITOS: {
            ADICIONAR: '/favoritos',
            REMOVER: '/favoritos',
            LISTAR: '/favoritos',
            VERIFICAR: (produto_id) => `/favoritos/${produto_id}`
        }
    }
}

// Exportar para uso
window.config = config
