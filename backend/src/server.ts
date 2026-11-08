import { app } from './app'
import { PORT } from './config/env'

app.listen(PORT, () => {
  console.log(`SERVI-X backend escuchando en http://localhost:${PORT}`)
})
