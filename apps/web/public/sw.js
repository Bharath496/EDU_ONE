const CACHE_NAME = 'eduone-static-v2'
const PUBLIC_STATIC_PATHS = new Set([
  '/icon.svg',
  '/manifest.webmanifest',
])

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('eduone-static-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || request.mode === 'navigate') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Only cache public, versioned build assets and explicitly public app metadata.
  // Never cache API responses, authenticated pages, student records, or documents.
  const scopePath = new URL(self.registration.scope).pathname.replace(/\\/$/, '')
  const relativePath = scopePath && scopePath !== '/'
    ? url.pathname.slice(scopePath.length) || '/'
    : url.pathname
  const scopedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  const isNextStaticAsset = scopedPath.startsWith('/_next/static/')
  if (!isNextStaticAsset && !PUBLIC_STATIC_PATHS.has(scopedPath)) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached

      try {
        const response = await fetch(request)
        const cacheControl = response.headers.get('Cache-Control') || ''
        const isPublicCacheable = !/private|no-store/i.test(cacheControl)
        if (response.ok && response.type === 'basic' && isPublicCacheable) {
          await cache.put(request, response.clone())
        }
        return response
      } catch {
        return new Response('This public asset is unavailable while offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
    })
  )
})
