import { Router } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma'
import { ApiError, asyncHandler } from '../../common/ApiError'
import { authJwt } from '../../middlewares/auth.jwt'
import { requireRole } from '../../middlewares/roles.guard'

const router = Router()

router.get('/responsables', authJwt, requireRole('Agente', 'Administrador'), asyncHandler(async (_req, res) => {
  const responsables = await prisma.responsable.findMany({ where: { estadoActivo: true } })
  res.json(responsables.map((r) => ({
    responsableId: r.responsableId, nombre: r.nombreCompleto, email: r.correoCorporativo, rol: r.rolOperativo,
  })))
}))

router.post('/responsables', authJwt, requireRole('Administrador'), asyncHandler(async (req, res) => {
  const { nombre, email, rol, password } = req.body
  if (!nombre || !email || !rol || !password) throw new ApiError(400, 'Todos los campos son obligatorios.')
  const existente = await prisma.responsable.findUnique({ where: { correoCorporativo: email } })
  if (existente) throw new ApiError(400, 'Ya existe un responsable con ese email.')

  const passwordHash = await bcrypt.hash(password, 10)
  const responsable = await prisma.responsable.create({
    data: { nombreCompleto: nombre, correoCorporativo: email, rolOperativo: rol, passwordHash },
  })
  res.status(201).json({
    responsableId: responsable.responsableId, nombre: responsable.nombreCompleto,
    email: responsable.correoCorporativo, rol: responsable.rolOperativo,
  })
}))

export default router
