<template>
  <view class="login-container">
    <view class="login-header">
      <image src="/static/logo.png" mode="aspectFit" class="logo"></image>
      <text class="app-name">手语学习</text>
      <text class="app-slogan">连接无声世界的桥梁</text>
    </view>
    
    <form @submit="handleLogin">
      <view class="login-form">
        <view class="input-group">
          <view class="input-icon">
            <text class="iconfont">&#xe6a4;</text>
          </view>
          <input 
            name="username"
            type="text" 
            placeholder="请输入用户名"
            class="input-field"
          />
        </view>
        
        <view class="input-group">
          <view class="input-icon">
            <text class="iconfont">&#xe6a3;</text>
          </view>
          <input 
            name="password"
            type="password" 
            placeholder="请输入密码"
            class="input-field"
          />
        </view>
        
        <button class="login-btn" form-type="submit">登录</button>
        
        <view class="register-link">
          还没有账号？<text @tap="goToRegister">立即注册</text>
        </view>
      </view>
    </form>
    
    <view class="login-footer">
      <text class="footer-text">© 2025 手语学习助手</text>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      loading: false
    }
  },
  methods: {
    async handleLogin(e) {
      if(this.loading) return
      
      const formData = e.detail.value
      
      if (!formData.username || !formData.password) {
        uni.showToast({
          title: '请输入用户名和密码',
          icon: 'none'
        })
        return
      }
      
      try {
        this.loading = true
        console.log('Attempting login with:', formData.username)
        
        // Convert form data to URL-encoded format
        const params = new URLSearchParams()
        params.append('username', formData.username)
        params.append('password', formData.password)
        
        const res = await http.post('/user/login', params.toString(), {
          header: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        
        console.log('Login response:', res)
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // Get token from response data
          const token = res.data.data
          if (!token) {
            throw new Error('登录失败：未获取到token')
          }
          
          // Store token in local storage
          uni.setStorageSync('token', token)
          console.log('Token stored in local storage:', token)
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          // Navigate to home page after successful login
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }, 1500)
        } else {
          throw new Error(res.data.message || '登录失败')
        }
      } catch (error) {
        console.error('Login failed:', error)
        uni.showToast({
          title: error.message || '登录失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      })
    }
  }
}
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #3C8999 0%, #55a5b5 100%);
  display: flex;
  flex-direction: column;
  padding: 40rpx;
  
  .login-header {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 0;
    
    .logo {
      width: 180rpx;
      height: 180rpx;
      margin-bottom: 30rpx;
    }
    
    .app-name {
      font-size: 48rpx;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 20rpx;
    }
    
    .app-slogan {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  .login-form {
    background-color: #ffffff;
    border-radius: 24rpx;
    padding: 50rpx 40rpx;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
    margin-bottom: 60rpx;
    
    .input-group {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 50rpx;
      margin-bottom: 30rpx;
      padding: 0 30rpx;
      height: 90rpx;
      
      .input-icon {
        margin-right: 20rpx;
        
        .iconfont {
          font-size: 36rpx;
          color: #3C8999;
        }
      }
      
      .input-field {
        flex: 1;
        height: 100%;
        font-size: 28rpx;
      }
    }
    
    .login-btn {
      width: 100%;
      height: 90rpx;
      line-height: 90rpx;
      background: linear-gradient(to right, #3C8999, #55a5b5);
      color: #fff;
      border-radius: 45rpx;
      font-size: 32rpx;
      margin-top: 50rpx;
      font-weight: bold;
      box-shadow: 0 8rpx 16rpx rgba(60, 137, 153, 0.3);
      
      &::after {
        border: none;
      }
      
      &:active {
        transform: scale(0.98);
      }
    }
    
    .register-link {
      text-align: center;
      margin-top: 40rpx;
      font-size: 28rpx;
      color: #666;
      
      text {
        color: #3C8999;
        margin-left: 10rpx;
        font-weight: bold;
      }
    }
  }
  
  .login-footer {
    padding: 30rpx 0;
    text-align: center;
    
    .footer-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}
</style>