import request from 'supertest'
import { app } from '../../src/app'
import { prisma } from '../../src/config/prisma'

const unique = Date.now()

describe('Pruebas de integracion SERVI-X (PDF seccion 10)', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  // CP-01: Crear usuario exitoso (UC-01 / RF-01)
  test('CP-01 crea un Cliente y retorna clienteId UUID v4', async () => {
    const res = await request(app).post('/api/v1/usuarios').send({
      nombre: 'Juan Perez',
      tipoDocumento: 'Cedula de Ciudadania',
      numeroDocumento: '123456789',
      email: `cp01-${unique}@example.com`,
      password: 'Clave123*',
    })
    expect(res.status).toBe(201)
    expect(res.body.usuarioId).toMatch(/^[0-9a-f-]{36}$/)
    expect(res.body.rol).toBe('Cliente')
  })

  // CP-02: Registrar PQRS exitoso (UC-05 / RF-05)
  test('CP-02 radica un caso y genera el primer registro de historial', async () => {
    const registro = await request(app).post('/api/v1/usuarios').send({
      nombre: 'Cliente CP02',
      tipoDocumento: 'Cedula de Ciudadania',
      numeroDocumento: '987654321',
      email: `cp02-${unique}@example.com`,
      password: 'Clave123*',
    })
    const token = registro.body.token

    const res = await request(app).post('/api/v1/casos')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipoSolicitud: 'Reclamo', descripcion: 'El producto llego incompleto.' })

    expect(res.status).toBe(201)
    expect(res.body.estadoAtencion).toBe('Radicado')
    expect(res.body.casoId).toMatch(/^[0-9a-f-]{36}$/)

    const detalle = await request(app).get(`/api/v1/casos/${res.body.casoId}/historial`)
      .set('Authorization', `Bearer ${token}`)
    expect(detalle.body.historial).toHaveLength(1)
    expect(detalle.body.historial[0].accion).toBe('Creacion')
  })

  // CP-03: Cierre fallido por falta de respuesta (UC-09 / RF-09 / RN-03)
  test('CP-03 rechaza el cierre de un caso sin respuesta oficial previa', async () => {
    const cliente = await request(app).post('/api/v1/usuarios').send({
      nombre: 'Cliente CP03',
      tipoDocumento: 'Cedula de Ciudadania',
      numeroDocumento: '555555555',
      email: `cp03-cliente-${unique}@example.com`,
      password: 'Clave123*',
    })
    const caso = await request(app).post('/api/v1/casos')
      .set('Authorization', `Bearer ${cliente.body.token}`)
      .send({ tipoSolicitud: 'Queja', descripcion: 'Demora en la atencion.' })

    const agente = await request(app).post('/api/v1/auth/login').send({
      email: 'luis.ramirez@servix.local', password: 'Clave123*',
    })
    expect(agente.status).toBe(200)

    const cierre = await request(app).patch(`/api/v1/casos/${caso.body.casoId}/cierre`)
      .set('Authorization', `Bearer ${agente.body.token}`)

    expect(cierre.status).toBe(400)
    expect(cierre.body.error).toBe('No se puede cerrar un caso sin emitir una respuesta oficial.')
  })
})
