import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/prisma'
import { JWT_SECRET } from '../../config/env'
import { ApiError, asyncHandler } from '../../common/ApiError'

const router = Router()

// RF-01 / UC-01: autorregistro de Cliente
router.post('/usuarios', asyncHandler(async (req, res) => {
  const { nombre, tipoDocumento, numeroDocumento, email, password } = req.body
  if (!nombre || !tipoDocumento || !numeroDocumento || !email || !password) {
    throw new ApiError(400, 'Todos los campos son obligatorios.')
  }
  const existente = await prisma.cliente.findUnique({ where: { email } })
  if (existente) throw new ApiError(400, 'Ya existe un cliente registrado con ese email.')

  const passwordHash = await bcrypt.hash(password, 10)
  const cliente = await prisma.cliente.create({
    data: { nombreCompleto: nombre, tipoDocumento, numeroDocumento, email, passwordHash },
  })
  const token = jwt.sign({ usuarioId: cliente.clienteId, rol: 'Cliente' }, JWT_SECRET, { expiresIn: '8h' })
  res.status(201).json({
    token, usuarioId: cliente.clienteId, rol: 'Cliente', nombre: cliente.nombreCompleto, email: cliente.email,
  })
}))

// RF-02 / UC-02: ingresar (Cliente o Responsable)
router.post('/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) throw new ApiError(400, 'Email y contrasena son obligatorios.')

  const responsable = await prisma.responsable.findUnique({ where: { correoCorporativo: email } })
  if (responsable && responsable.estadoActivo) {
    const ok = await bcrypt.compare(password, responsable.passwordHash)
    if (!ok) throw new ApiError(401, 'Credenciales invalidas.')
    const token = jwt.sign({ usuarioId: responsable.responsableId, rol: responsable.rolOperativo }, JWT_SECRET, { expiresIn: '8h' })
    return res.json({
      token, usuarioId: responsable.responsableId, rol: responsable.rolOperativo,
      nombre: responsable.nombreCompleto, email: responsable.correoCorporativo,
    })
  }

  const cliente = await prisma.cliente.findUnique({ where: { email } })
  if (cliente) {
    const ok = await bcrypt.compare(password, cliente.passwordHash)
    if (!ok) throw new ApiError(401, 'Credenciales invalidas.')
    const token = jwt.sign({ usuarioId: cliente.clienteId, rol: 'Cliente' }, JWT_SECRET, { expiresIn: '8h' })
    return res.json({
      token, usuarioId: cliente.clienteId, rol: 'Cliente', nombre: cliente.nombreCompleto, email: cliente.email,
    })
  }

  throw new ApiError(401, 'Credenciales invalidas.')
}))

export default router
