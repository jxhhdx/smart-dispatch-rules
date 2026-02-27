import '@testing-library/jest-dom'
import { vi } from 'vitest'

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// 模拟 navigator.language
Object.defineProperty(window, 'navigator', {
  value: {
    language: 'zh-CN',
    languages: ['zh-CN', 'en'],
  },
  writable: true,
})

// 模拟 IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
})

// 模拟 ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
})

// 模拟 window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
    href: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
})

// 清理所有 mock
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
