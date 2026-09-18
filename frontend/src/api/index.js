import { mockApi } from './mock/mockApi'

// Fase 0 (mockups): siempre mock. Fase 1 (feature/frontend-conectar-api) agregara
// una implementacion http.js con la misma forma y se elegira por VITE_USE_MOCK_API.
export const api = mockApi
