const { createProxyMiddleware } = require('http-proxy-middleware')

// Using a proxy allows reactJS to query the server API
// without having to build the app.
module.exports = (app) => {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true
    })
  )

  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true
    })
  )

  app.use(
    '/peerjs',
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true
    })
  )
}
