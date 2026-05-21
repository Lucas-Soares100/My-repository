import { verifyToken } from '../services/tokenService.js'

export async function verifyTokenMiddleware(req, res, next) {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader?.split(' ')[1]
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' })

        const decoded = await verifyToken(token)

        // Popula req.user genérico e também os aliases específicos
        req.user = { ...decoded }
        req.adm       = decoded.ra  ? { ra:  decoded.ra,  jti: decoded.jti } : undefined
        req.cliente   = decoded.idc ? { idc: decoded.idc, jti: decoded.jti } : undefined
        req.fornecedor= decoded.idf ? { idf: decoded.idf, jti: decoded.jti } : undefined

        next()
    } catch (err) {
        const status = err.message === 'Token denylisted' ? 401 : 403
        return res.status(status).json({ error: 'Token inválido ou expirado' })
    }
}
