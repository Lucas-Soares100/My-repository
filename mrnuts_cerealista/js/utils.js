// ═══════════════════════════════════════════════════════════════════════════
// UTILS.JS - Funções Utilitárias
// ═════════════════════════════════════════════════════════════════════════ */

/**
 * Classe para gerenciar notificações (Toasts)
 */
class NotificationManager {
    constructor() {
        this.container = document.getElementById('toast-container')
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div')
        toast.className = `toast ${type}`
        toast.innerHTML = message
        
        this.container.appendChild(toast)

        // Remove após duração
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease'
            setTimeout(() => toast.remove(), 300)
        }, duration)
    }

    success(message) {
        this.show(message, 'success')
    }

    error(message) {
        this.show(message, 'error', 5000)
    }

    warning(message) {
        this.show(message, 'warning')
    }

    info(message) {
        this.show(message, 'info')
    }
}

/**
 * Formatar valor monetário
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

/**
 * Formatar data
 */
function formatDate(dateString) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date)
}

/**
 * Validar email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}

/**
 * Validar CNPJ
 */
function isValidCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '')
    if (cnpj.length !== 14) return false
    
    let size = cnpj.length - 2
    let numbers = cnpj.substring(0, size)
    let digits = cnpj.substring(size)
    let sum = 0
    let pos = size - 7
    
    for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--
        if (pos < 2) pos = 9
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11
    if (result !== parseInt(digits.charAt(0))) return false
    
    size = size - 1
    numbers = cnpj.substring(0, size)
    sum = 0
    pos = size - 7
    
    for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--
        if (pos < 2) pos = 9
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11
    if (result !== parseInt(digits.charAt(1))) return false
    
    return true
}

/**
 * Validar telefone brasileiro
 */
function isValidPhone(phone) {
    const regex = /^\d{10,11}$/
    return regex.test(phone.replace(/\D/g, ''))
}

/**
 * Formatar CNPJ para padrão XX.XXX.XXX/XXXX-XX
 */
function formatCNPJ(cnpj) {
    const numbers = cnpj.replace(/\D/g, '')
    return numbers
        .slice(0, 14)
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formatar telefone para padrão (XX) X XXXX-XXXX
 */
function formatPhone(phone) {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length === 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else if (numbers.length === 11) {
        return numbers.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
    }
    return phone
}

/**
 * Truncar texto
 */
function truncateText(text, maxLength) {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

/**
 * Gerar estrellas de rating
 */
function generateStars(rating, maxRating = 5) {
    let stars = '★'.repeat(Math.floor(rating))
    if (rating % 1 !== 0) stars += '⭐'
    stars += '☆'.repeat(maxRating - Math.ceil(rating))
    return stars
}

/**
 * Converter arquivo para Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Obter URL de upload
 */
function getImageUrl(imagePath) {
    if (!imagePath) return 'https://via.placeholder.com/200?text=Sem+Imagem'
    if (imagePath.startsWith('http')) return imagePath
    return `${config.API_BASE_URL}/../${imagePath}`
}

/**
 * Classe para gerenciar usuário
 */
class UserManager {
    static setUser(user, userType, token) {
        localStorage.setItem(config.STORAGE_KEYS.USER, JSON.stringify(user))
        localStorage.setItem(config.STORAGE_KEYS.USER_TYPE, userType)
        localStorage.setItem(config.STORAGE_KEYS.TOKEN, token)
        api.setToken(token)
    }

    static getUser() {
        const userJson = localStorage.getItem(config.STORAGE_KEYS.USER)
        return userJson ? JSON.parse(userJson) : null
    }

    static getUserType() {
        return localStorage.getItem(config.STORAGE_KEYS.USER_TYPE)
    }

    static isLoggedIn() {
        return !!localStorage.getItem(config.STORAGE_KEYS.TOKEN)
    }

    static logout() {
        localStorage.removeItem(config.STORAGE_KEYS.USER)
        localStorage.removeItem(config.STORAGE_KEYS.USER_TYPE)
        localStorage.removeItem(config.STORAGE_KEYS.TOKEN)
        localStorage.removeItem(config.STORAGE_KEYS.CART)
        FavoritesManager.limpar()  // ✅ Limpar cache de favoritos
        api.setToken(null)
    }

    static getFullName() {
        const user = this.getUser()
        return user?.name || 'Usuário'
    }

    static isSupplier() {
        return this.getUserType() === config.USER_TYPES.SUPPLIER
    }

    static isClient() {
        return this.getUserType() === config.USER_TYPES.CLIENT
    }

    static isAdmin() {
        return this.getUserType() === config.USER_TYPES.ADM
    }
}

/**
 * Classe para gerenciar favoritos (sincronizados com backend)
 * Mantém um cache local para verificações rápidas, mas sincroniza com o servidor
 */
class FavoritesManager {
    static _cache = [] // Cache local de favoritos do cliente logado

    /**
     * Carregar favoritos do servidor (executar após login)
     */
    static async sincronizar() {
        try {
            const favoritos = await api.listarFavoritos()
            this._cache = favoritos.map(f => f.Cod_produto) || []
        } catch (err) {
            console.error('Erro ao sincronizar favoritos:', err)
            this._cache = []
        }
    }

    /**
     * Obter lista de favoritos do cache local
     */
    static getFavorites() {
        return [...this._cache] // Retorna cópia para evitar modificações externas
    }

    /**
     * Verificar se um produto é favorito (usa cache local)
     */
    static isFavorite(productId) {
        return this._cache.includes(productId)
    }

    /**
     * Toggle favorito (sincroniza com servidor)
     */
    static async toggleFavorite(productId) {
        try {
            if (this.isFavorite(productId)) {
                // Remover favorito
                await api.removerFavorito(productId)
                this._cache = this._cache.filter(id => id !== productId)
                return false
            } else {
                // Adicionar favorito
                await api.adicionarFavorito(productId)
                this._cache.push(productId)
                return true
            }
        } catch (err) {
            console.error('Erro ao alternar favorito:', err)
            notify.error('Erro ao salvar favorito')
            throw err
        }
    }

    /**
     * Limpar cache ao fazer logout
     */
    static limpar() {
        this._cache = []
    }
}

/**
 * Classe para gerenciar carrinho
 */
class CartManager {
    static getCart() {
        const cartJson = localStorage.getItem(config.STORAGE_KEYS.CART)
        return cartJson ? JSON.parse(cartJson) : []
    }

    static addToCart(product, quantity = 1) {
        const cart = this.getCart()
        const existingItem = cart.find(item => item.id === product.Cod_produto)
        
        if (existingItem) {
            existingItem.quantity += quantity
        } else {
            cart.push({
                id: product.Cod_produto,
                title: product.Titulo,
                price: product.Preco,
                image: product.img,
                quantity
            })
        }
        
        localStorage.setItem(config.STORAGE_KEYS.CART, JSON.stringify(cart))
    }

    static removeFromCart(productId) {
        let cart = this.getCart()
        cart = cart.filter(item => item.id !== productId)
        localStorage.setItem(config.STORAGE_KEYS.CART, JSON.stringify(cart))
    }

    static updateQuantity(productId, quantity) {
        const cart = this.getCart()
        const item = cart.find(item => item.id === productId)
        if (item) {
            item.quantity = quantity
            if (item.quantity <= 0) {
                this.removeFromCart(productId)
            } else {
                localStorage.setItem(config.STORAGE_KEYS.CART, JSON.stringify(cart))
            }
        }
    }

    static clearCart() {
        localStorage.removeItem(config.STORAGE_KEYS.CART)
    }

    static getCartTotal() {
        const cart = this.getCart()
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    }

    static getCartCount() {
        const cart = this.getCart()
        return cart.reduce((count, item) => count + item.quantity, 0)
    }
}

// Criar instância global do notification manager
const notify = new NotificationManager()

// Adicionar estilos de animação para toast
const styleSheet = document.createElement('style')
styleSheet.innerHTML = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`
document.head.appendChild(styleSheet)
