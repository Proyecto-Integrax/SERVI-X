import { mockApi } from './mock/mockApi'
import { httpApi } from './http'

const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const api = useMock ? mockApi : httpApi
