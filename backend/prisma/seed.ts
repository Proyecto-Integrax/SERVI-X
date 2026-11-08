import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Clave123*', 10)

  const luis = await prisma.responsable.upsert({
    where: { correoCorporativo: 'luis.ramirez@servix.local' },
    update: {},
    create: { nombreCompleto: 'Luis Ramirez', correoCorporativo: 'luis.ramirez@servix.local', passwordHash, rolOperativo: 'Agente' },
  })
  await prisma.responsable.upsert({
    where: { correoCorporativo: 'juan.torres@servix.local' },
    update: {},
    create: { nombreCompleto: 'Juan Torres', correoCorporativo: 'juan.torres@servix.local', passwordHash, rolOperativo: 'Agente' },
  })
  await prisma.responsable.upsert({
    where: { correoCorporativo: 'carla.mendez@servix.local' },
    update: {},
    create: { nombreCompleto: 'Carla Mendez', correoCorporativo: 'carla.mendez@servix.local', passwordHash, rolOperativo: 'Administrador' },
  })

  const juan = await prisma.cliente.upsert({
    where: { email: 'juan.perez@example.com' },
    update: {},
    create: {
      nombreCompleto: 'Juan Perez', tipoDocumento: 'Cedula de Ciudadania', numeroDocumento: '1001',
      email: 'juan.perez@example.com', passwordHash,
    },
  })
  await prisma.cliente.upsert({
    where: { email: 'maria.garcia@example.com' },
    update: {},
    create: {
      nombreCompleto: 'Maria Garcia', tipoDocumento: 'Cedula de Ciudadania', numeroDocumento: '1002',
      email: 'maria.garcia@example.com', passwordHash,
    },
  })
  const carlos = await prisma.cliente.upsert({
    where: { email: 'carlos.lopez@example.com' },
    update: {},
    create: {
      nombreCompleto: 'Carlos Lopez', tipoDocumento: 'Cedula de Ciudadania', numeroDocumento: '1003',
      email: 'carlos.lopez@example.com', passwordHash,
    },
  })

  const casosExistentes = await prisma.caso.count()
  if (casosExistentes === 0) {
    await prisma.caso.create({
      data: {
        clienteId: carlos.clienteId, tipoSolicitud: 'Peticion',
        descripcion: 'Solicita copia de la factura del ultimo pedido.', responsableId: luis.responsableId,
        historial: { create: { estadoAnterior: null, estadoNuevo: 'Radicado', accionRealizada: 'Caso radicado.', usuarioAccionId: carlos.clienteId, accion: 'Creacion' } },
      },
    })
    console.log('Seed: caso demo creado.')
  }

  console.log('Seed completo. Usuarios demo (password: Clave123*):')
  console.log('  Cliente:       juan.perez@example.com')
  console.log('  Agente:        luis.ramirez@servix.local')
  console.log('  Administrador: carla.mendez@servix.local')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
