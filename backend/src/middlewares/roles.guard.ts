import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../common/ApiError'
import { AuthUser } from './auth.jwt'

export function requireRole(...roles: AuthUser['rol'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      throw new ApiError(403, 'No tiene permisos para esta operacion.')
    }
    next()
  }
}
