import { Router } from 'express'
import { asyncHandler } from '../../common/ApiError'
import { authJwt } from '../../middlewares/auth.jwt'
import { requireRole } from '../../middlewares/roles.guard'
import * as service from './casos.service'

const router = Router()
router.use(authJwt)

router.post('/casos', requireRole('Cliente'), asyncHandler(async (req, res) => {
  const caso = await service.crearCaso(req.body, req.user!)
  res.status(201).json(caso)
}))

router.get('/casos', asyncHandler(async (req, res) => {
  const casos = await service.listarCasos(req.query, req.user!)
  res.json(casos)
}))

router.get('/casos/:casoId/historial', asyncHandler(async (req, res) => {
  const detalle = await service.obtenerCaso(req.params.casoId, req.user!)
  res.json(detalle)
}))

router.patch('/casos/:casoId/asignacion', requireRole('Agente', 'Administrador'), asyncHandler(async (req, res) => {
  const caso = await service.asignarResponsable(req.params.casoId, req.body.responsableId, req.user!)
  res.json(caso)
}))

router.patch('/casos/:casoId/estado', requireRole('Agente', 'Administrador'), asyncHandler(async (req, res) => {
  const caso = await service.actualizarEstado(req.params.casoId, req.body.estadoAtencion, req.body.observacion, req.user!)
  res.json(caso)
}))

router.post('/casos/:casoId/respuesta', requireRole('Agente', 'Administrador'), asyncHandler(async (req, res) => {
  const caso = await service.registrarRespuesta(req.params.casoId, req.body.texto, req.user!)
  res.json(caso)
}))

router.patch('/casos/:casoId/cierre', requireRole('Agente', 'Administrador'), asyncHandler(async (req, res) => {
  const caso = await service.cerrarCaso(req.params.casoId, req.user!)
  res.json(caso)
}))

router.get('/historial', asyncHandler(async (req, res) => {
  const eventos = await service.listarHistorial(req.query, req.user!)
  res.json(eventos)
}))

export default router
