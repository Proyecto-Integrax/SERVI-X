import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { JWT_SECRET } from '../config/env'
import { ApiError } from '../common/ApiError'

export interface AuthUser {
  usuarioId: string
  rol: 'Cliente' | 'Agente' | 'Administrador'
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function authJwt(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Token no proporcionado.')
  }
  const token = header.slice('Bearer '.length)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser
    req.user = payload
    next()
  } catch {
    throw new ApiError(401, 'Token invalido o expirado.')
  }
}
