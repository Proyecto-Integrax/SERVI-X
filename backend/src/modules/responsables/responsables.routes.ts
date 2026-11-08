import { Router } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma'
import { ApiError, asyncHandler } from '../../common/ApiError'
import { authJwt } from '../../middlewares/auth.jwt'
import { requireRole } from '../../middlewares/roles.guard'

const router = Router()

function serialize(r: any) {
  return { responsableId: r.responsableId, nombre: r.nombreCompleto, email: r.correoCorporativo, rol: r.rolOperativo, activo: r.estadoActivo }
}

// Lista responsables (por defecto solo activos; ?incluirInactivos=true para administrar)
router.get('/responsables', authJwt, requireRole('Agente', 'Administrador'), asyncHandler(async (req, res) => {
  const incluirInactivos = req.query.incluirInactivos === 'true'
  const responsables = await prisma.responsable.findMany({ where: incluirInactivos ? {} : { estadoActivo: true } })
  res.json(responsables.map(serialize))
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
  res.status(201).json(serialize(responsable))
}))

// Editar nombre/rol de un responsable
router.patch('/responsables/:responsableId', authJwt, requireRole('Administrador'), asyncHandler(async (req, res) => {
  const { nombre, rol } = req.body
  const data: any = {}
  if (nombre) data.nombreCompleto = nombre
  if (rol) data.rolOperativo = rol
  if (Object.keys(data).length === 0) throw new ApiError(400, 'No hay campos para actualizar.')

  const existente = await prisma.responsable.findUnique({ where: { responsableId: req.params.responsableId } })
  if (!existente) throw new ApiError(404, 'Responsable no encontrado.')

  const actualizado = await prisma.responsable.update({ where: { responsableId: req.params.responsableId }, data })
  res.json(serialize(actualizado))
}))

// Desactivar (baja logica, preserva integridad con casos ya asignados)
router.delete('/responsables/:responsableId', authJwt, requireRole('Administrador'), asyncHandler(async (req, res) => {
  const existente = await prisma.responsable.findUnique({ where: { responsableId: req.params.responsableId } })
  if (!existente) throw new ApiError(404, 'Responsable no encontrado.')

  const actualizado = await prisma.responsable.update({ where: { responsableId: req.params.responsableId }, data: { estadoActivo: false } })
  res.json(serialize(actualizado))
}))

// Reactivar
router.patch('/responsables/:responsableId/reactivar', authJwt, requireRole('Administrador'), asyncHandler(async (req, res) => {
  const existente = await prisma.responsable.findUnique({ where: { responsableId: req.params.responsableId } })
  if (!existente) throw new ApiError(404, 'Responsable no encontrado.')

  const actualizado = await prisma.responsable.update({ where: { responsableId: req.params.responsableId }, data: { estadoActivo: true } })
  res.json(serialize(actualizado))
}))

export default router
