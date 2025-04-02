module.exports = {
  devServer: {
    proxy: {
      // 配置 API 代理规则
      '/api': {
        target: 'http://localhost:8080', // 后端地址
        changeOrigin: true, // 开启跨域
        pathRewrite: {
          '^/api': '', // 去掉 /api 前缀
        },
      },
    },
  },
};
