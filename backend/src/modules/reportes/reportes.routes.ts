import { Router } from 'express'
import { prisma } from '../../config/prisma'
import { asyncHandler } from '../../common/ApiError'
import { authJwt } from '../../middlewares/auth.jwt'
import { requireRole } from '../../middlewares/roles.guard'

const router = Router()

router.get('/reportes/resumen', authJwt, requireRole('Agente', 'Administrador'), asyncHandler(async (req, res) => {
  const { desde, hasta } = req.query as { desde?: string; hasta?: string }
  const where: any = {}
  if (desde || hasta) {
    where.fechaCreacion = {}
    if (desde) where.fechaCreacion.gte = new Date(`${desde}T00:00:00.000Z`)
    if (hasta) where.fechaCreacion.lte = new Date(`${hasta}T23:59:59.999Z`)
  }
  const casos = await prisma.caso.findMany({ where })
  const porTipo: Record<string, number> = {}
  const porEstado: Record<string, number> = {}
  for (const c of casos) {
    porTipo[c.tipoSolicitud] = (porTipo[c.tipoSolicitud] || 0) + 1
    porEstado[c.estadoAtencion] = (porEstado[c.estadoAtencion] || 0) + 1
  }
  res.json({ total: casos.length, porTipo, porEstado })
}))

export default router
