import { Router } from 'express'
import upload from './uploadConfig.js'
import { verifyTokenMiddleware } from './middlewares/authMiddleware.js'
import { registerADM, loginADM, logoutADM, forgotPasswordADM } from './controllers/authADMController.js'
import { getUsersADM, getADMByRA, createUserADM, updateUserADM, deleteUserADM, profileADM, updateMeADM } from './controllers/ADMController.js'
import { registerClient, loginClient, logoutClient, forgotPasswordClient } from './controllers/authClienteController.js'
import { getUsersClient, getClientByID, createUserClient, updateUserClient, deleteUserClient, profileClient, updateMeClient } from './controllers/ClienteController.js'
import { registerFornecedor, loginFornecedor, logoutFornecedor, forgotPasswordFornecedor } from './controllers/authFornecedorController.js'
import { getUsersFornecedor, getFornecedorByID, createUserFornecedor, updateUserFornecedor, deleteUserFornecedor, profileFornecedor, updateMeFornecedor } from './controllers/FornecedorController.js'
import { getProdutos, getProdutoById, createProduto, updateProduto as updateProdutoFornecedor, deleteProduto as deleteProdutoFornecedor } from './controllers/ProdutoController.js'
import { listarAvaliacoes, criarAvaliacao, excluirAvaliacao } from './controllers/AvaliacaoController.js'
import { verificarPerfilExistente, trocarPerfil, criarPerfilClienteVinculado, criarPerfilFornecedorVinculado } from './controllers/TrocaPerfilController.js'
import { seguirFornecedor, deixarDeSeguirFornecedor, listarSeguindoCliente, buscarSeguidoresFornecedor, buscarAnalyticsSeguidores } from './controllers/SeguidorController.js'
import { adicionarFavorito, removerFavorito, listarFavoritos, verificarFavorito } from './controllers/FavoritoController.js'
import {
  getAllClientes, createCliente, getClienteById, updateCliente, deleteCliente,
  getAllFornecedores, createFornecedor, getFornecedorById, updateFornecedor, deleteFornecedor,
  getAllProdutos, createProduto as createProdutoAdmin, getProdutoById as getProdutoByIdAdmin, updateProduto as updateProdutoAdmin, deleteProduto as deleteProdutoAdmin,
  getAllAvaliacoes, updateAvaliacao, deleteAvaliacaoAdmin
} from './controllers/AdminDashboardController.js'

// Middleware para verificar se é ADM
const verifyADM = (req, res, next) => {
  if (!req.adm)
    return res.status(403).json({ error: 'Acesso restrito a Administradores' })
  next()
}

// Middleware opcional: popula req.cliente se token válido, mas não bloqueia se ausente
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader?.split(' ')[1]
    if (token) {
      const { verifyToken } = await import('./services/tokenService.js')
      const decoded = await verifyToken(token)
      req.cliente = decoded.idc ? { idc: decoded.idc } : undefined
      req.fornecedor = decoded.idf ? { idf: decoded.idf } : undefined
    }
  } catch { /* token inválido — continua sem autenticação */ }
  next()
}

const r = Router()

// ── Auth sem token ────────────────────────────────────────
r.post('/auth/register/adm', registerADM)
r.post('/auth/login/adm', loginADM)
r.post('/auth/forgot-password/adm', forgotPasswordADM)
r.post('/auth/register/cliente', registerClient)
r.post('/auth/login/cliente', loginClient)
r.post('/auth/forgot-password/cliente', forgotPasswordClient)
r.post('/auth/register/fornecedor', registerFornecedor)
r.post('/auth/login/fornecedor', loginFornecedor)
r.post('/auth/forgot-password/fornecedor', forgotPasswordFornecedor)

// ── Logout (com token) ────────────────────────────────────
r.post('/auth/logout/adm', verifyTokenMiddleware, logoutADM)
r.post('/auth/logout/cliente', verifyTokenMiddleware, logoutClient)
r.post('/auth/logout/fornecedor', verifyTokenMiddleware, logoutFornecedor)

// ── Perfil do usuário logado ──────────────────────────────
r.get('/adm/profile', verifyTokenMiddleware, profileADM)
r.put('/adm/me', verifyTokenMiddleware, updateMeADM)
r.get('/cliente/profile', verifyTokenMiddleware, profileClient)
r.put('/cliente/me', verifyTokenMiddleware, upload.single('image'), updateMeClient)
r.get('/fornecedor/profile', verifyTokenMiddleware, profileFornecedor)
r.put('/fornecedor/me', verifyTokenMiddleware, upload.single('image'), updateMeFornecedor)

// ── CRUD ADM ──────────────────────────────────────────────
r.get('/adm', getUsersADM)
r.get('/adm/:ra', verifyTokenMiddleware, getADMByRA)
r.post('/adm', verifyTokenMiddleware, upload.single('image'), createUserADM)
r.put('/adm/:ra', verifyTokenMiddleware, upload.single('image'), updateUserADM)
r.delete('/adm/:ra', verifyTokenMiddleware, deleteUserADM)

// ── CRUD Cliente ──────────────────────────────────────────
r.get('/cliente', getUsersClient)
r.get('/cliente/seguindo', verifyTokenMiddleware, listarSeguindoCliente)
r.get('/cliente/:idc', verifyTokenMiddleware, getClientByID)
r.post('/cliente', verifyTokenMiddleware, upload.single('image'), createUserClient)
r.put('/cliente/:idc', verifyTokenMiddleware, upload.single('image'), updateUserClient)
r.delete('/cliente/:idc', verifyTokenMiddleware, deleteUserClient)

// ── CRUD Fornecedor ───────────────────────────────────────
r.get('/fornecedor', getUsersFornecedor)
r.get('/fornecedor/:idf', verifyTokenMiddleware, getFornecedorByID)
r.post('/fornecedor', verifyTokenMiddleware, upload.single('image'), createUserFornecedor)
r.put('/fornecedor/:idf', verifyTokenMiddleware, upload.single('image'), updateUserFornecedor)
r.delete('/fornecedor/:idf', verifyTokenMiddleware, deleteUserFornecedor)

// ── Produtos ──────────────────────────────────────────────
r.get('/produto', getProdutos)
r.get('/produto/:id', getProdutoById)
r.post('/produto', verifyTokenMiddleware, upload.array('images', 5), createProduto)
r.put('/produto/:id', verifyTokenMiddleware, upload.array('images', 5), updateProdutoFornecedor)
r.delete('/produto/:id', verifyTokenMiddleware, deleteProdutoFornecedor)

// ── Avaliações ────────────────────────────────────────────
r.get('/produto/:id/avaliacoes', listarAvaliacoes)
r.post('/avaliacoes', verifyTokenMiddleware, criarAvaliacao)
r.delete('/avaliacoes/:id', verifyTokenMiddleware, excluirAvaliacao)

// ── Troca de Perfil ──────────────────────────────────────
r.post('/perfil/verificar', verifyTokenMiddleware, verificarPerfilExistente)
r.post('/perfil/trocar', verifyTokenMiddleware, trocarPerfil)
r.post('/perfil/criar-cliente', verifyTokenMiddleware, criarPerfilClienteVinculado)
r.post('/perfil/criar-fornecedor', verifyTokenMiddleware, criarPerfilFornecedorVinculado)

// ── Seguidores ───────────────────────────────────────────
r.post('/fornecedor/:id/seguir', verifyTokenMiddleware, seguirFornecedor)
r.delete('/fornecedor/:id/seguir', verifyTokenMiddleware, deixarDeSeguirFornecedor)
r.get('/fornecedor/:id/seguidores', optionalAuth, buscarSeguidoresFornecedor)
r.get('/fornecedor/:id/analytics-seguidores', verifyTokenMiddleware, buscarAnalyticsSeguidores)

// ── Favoritos ─────────────────────────────────────────────
r.post('/favoritos', verifyTokenMiddleware, adicionarFavorito)
r.delete('/favoritos', verifyTokenMiddleware, removerFavorito)
r.get('/favoritos', verifyTokenMiddleware, listarFavoritos)
r.get('/favoritos/:produto_id', verifyTokenMiddleware, verificarFavorito)

// ── ADMIN DASHBOARD - Gerenciamento Total ─────────────────
r.get('/admin/clientes', verifyTokenMiddleware, verifyADM, getAllClientes)
r.post('/admin/clientes', verifyTokenMiddleware, verifyADM, createCliente)
r.get('/admin/clientes/:idc', verifyTokenMiddleware, verifyADM, getClienteById)
r.put('/admin/clientes/:idc', verifyTokenMiddleware, verifyADM, updateCliente)
r.delete('/admin/clientes/:idc', verifyTokenMiddleware, verifyADM, deleteCliente)

r.get('/admin/fornecedores', verifyTokenMiddleware, verifyADM, getAllFornecedores)
r.post('/admin/fornecedores', verifyTokenMiddleware, verifyADM, createFornecedor)
r.get('/admin/fornecedores/:idf', verifyTokenMiddleware, verifyADM, getFornecedorById)
r.put('/admin/fornecedores/:idf', verifyTokenMiddleware, verifyADM, updateFornecedor)
r.delete('/admin/fornecedores/:idf', verifyTokenMiddleware, verifyADM, deleteFornecedor)

r.get('/admin/produtos', verifyTokenMiddleware, verifyADM, getAllProdutos)
r.post('/admin/produtos', verifyTokenMiddleware, verifyADM, createProdutoAdmin)
r.get('/admin/produtos/:id', verifyTokenMiddleware, verifyADM, getProdutoByIdAdmin)
r.put('/admin/produtos/:id', verifyTokenMiddleware, verifyADM, updateProdutoAdmin)
r.delete('/admin/produtos/:id', verifyTokenMiddleware, verifyADM, deleteProdutoAdmin)

r.get('/admin/avaliacoes', verifyTokenMiddleware, verifyADM, getAllAvaliacoes)
r.put('/admin/avaliacoes/:id', verifyTokenMiddleware, verifyADM, updateAvaliacao)
r.delete('/admin/avaliacoes/:id', verifyTokenMiddleware, verifyADM, deleteAvaliacaoAdmin)

export default r
