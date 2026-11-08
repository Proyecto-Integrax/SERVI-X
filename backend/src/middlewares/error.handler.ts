import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { ApiError } from '../common/ApiError'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message })
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Registro no encontrado.' })
    if (err.code === 'P2002') return res.status(409).json({ error: 'El registro ya existe (valor duplicado).' })
    console.error(err)
    return res.status(400).json({ error: 'Datos invalidos para esta operacion.' })
  }
  console.error(err)
  return res.status(500).json({ error: 'Error interno del servidor.' })
}
