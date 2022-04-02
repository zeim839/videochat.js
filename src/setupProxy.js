const { createProxyMiddleware } = require('http-proxy-middleware')

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
