// vue.config.js
module.exports = {
  devServer: {
    port: 8081, // 前端项目端口
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端服务器地址
        changeOrigin: true,
        pathRewrite: {
          '^/api': '' // 将请求中的 /api 替换为空
        }
      }
    }
  }
}
