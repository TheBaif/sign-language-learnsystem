<template>
  <view class="login-container">
    <!-- Stylized background elements -->
    <view class="background-elements">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>
    
    <view class="login-content">
      <view class="login-header">
        <image src="/static/logo.png" mode="aspectFit" class="logo"></image>
        <text class="app-name">手语学习</text>
        <text class="app-slogan">连接无声世界的桥梁</text>
      </view>
      
      <form @submit="handleLogin" class="login-form-wrapper">
        <view class="login-form">
          <view class="form-title">
            <text>欢迎回来</text>
          </view>
          
          <view class="input-group">
            <text class="input-label">用户名</text>
            <view class="input-wrapper">
              <input 
                name="username"
                type="text" 
                placeholder="请输入用户名"
                class="input-field"
              />
            </view>
          </view>
          
          <view class="input-group">
            <text class="input-label">密码</text>
            <view class="input-wrapper">
              <input 
                name="password"
                type="password" 
                placeholder="请输入密码"
                class="input-field"
              />
            </view>
          </view>
          
          <button class="login-btn" :class="{'loading': loading}" form-type="submit">
            <text v-if="!loading">登录</text>
            <view v-else class="btn-loader"></view>
          </button>
          
          <view class="action-links">
            <view class="register-link">
              还没有账号？<text @tap="goToRegister">立即注册</text>
            </view>
            <view class="forgot-link">
              <text @tap="goToForgotPassword">忘记密码？</text>
            </view>
          </view>
        </view>
      </form>
      
      <view class="login-footer">
        <text class="footer-text">© 2025 手语学习助手</text>
      </view>
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
            
            // 使用传统方式构建URL编码参数
            const params = `username=${encodeURIComponent(formData.username)}&password=${encodeURIComponent(formData.password)}`
            
            const res = await http.post('/user/login', params, {
              header: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            })
            
            console.log('Login response:', res)
            
            if (res.statusCode === 200 && res.data.code === 0) {
              const token = res.data.data
              if (!token) {
                throw new Error('登录失败：未获取到token')
              }
              
              uni.setStorageSync('token', token)
              console.log('Token stored in local storage:', token)
              
              uni.showToast({
                title: '登录成功',
                icon: 'success'
              })
              
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
    },
    
    goToForgotPassword() {
      uni.navigateTo({
        url: '/pages/forgot-password/forgot-password'
      })
    }
  }
}
</script>

<style lang="scss">
// Define variables for consistent theming
$primary-color: #3C8999;
$primary-light: #55a5b5;
$primary-dark: #2a6b78;
$accent-color: #FF9B50;
$text-color: #333;
$text-light: #666;
$text-lighter: #999;
$border-radius-sm: 10rpx;
$border-radius-md: 20rpx;
$border-radius-lg: 30rpx;
$box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
$transition-duration: 0.3s;

// Keyframes for animations
@keyframes floating {
  0% { transform: translateY(0); }
  50% { transform: translateY(-15rpx); }
  100% { transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 0.6; }
  100% { transform: scale(1); opacity: 0.8; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
  overflow: hidden;
  position: relative;
  
  // Background decorative elements
  .background-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    
    .circle {
      position: absolute;
      border-radius: 50%;
      background: linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
      
      &.circle-1 {
        top: -100rpx;
        right: -100rpx;
        width: 500rpx;
        height: 500rpx;
        animation: pulse 8s infinite ease-in-out;
      }
      
      &.circle-2 {
        bottom: -150rpx;
        left: -150rpx;
        width: 600rpx;
        height: 600rpx;
        animation: pulse 12s infinite ease-in-out;
      }
      
      &.circle-3 {
        top: 30%;
        right: -50rpx;
        width: 300rpx;
        height: 300rpx;
        animation: pulse 10s infinite ease-in-out;
      }
    }
  }
  
  .login-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: 40rpx;
    min-height: 100vh;
  }
  
  .login-header {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx 0;
    animation: floating 4s ease-in-out infinite;
    
    .logo {
      width: 180rpx;
      height: 180rpx;
      margin-bottom: 30rpx;
      border-radius: 50%;
      box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
    }
    
    .app-name {
      font-size: 48rpx;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 20rpx;
      text-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.2);
    }
    
    .app-slogan {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50rpx;
      padding: 10rpx 30rpx;
      backdrop-filter: blur(5rpx);
    }
  }
  
  .login-form-wrapper {
    margin-bottom: 60rpx;
  }
  
  .login-form {
    background-color: #ffffff;
    border-radius: $border-radius-lg;
    padding: 50rpx 40rpx;
    box-shadow: $box-shadow;
    transform: translateY(0);
    transition: transform $transition-duration;
    
    &:active {
      transform: translateY(5rpx);
    }
    
    .form-title {
      text-align: center;
      margin-bottom: 40rpx;
      
      text {
        font-size: 36rpx;
        font-weight: bold;
        color: $primary-color;
        position: relative;
        
        &::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -15rpx;
          transform: translateX(-50%);
          width: 60rpx;
          height: 6rpx;
          background: linear-gradient(to right, $primary-color, $primary-light);
          border-radius: 3rpx;
        }
      }
    }
    
    .input-group {
      margin-bottom: 30rpx;
      
      .input-label {
        display: block;
        font-size: 26rpx;
        color: $text-light;
        margin-bottom: 10rpx;
        margin-left: 10rpx;
      }
      
      .input-wrapper {
        display: flex;
        align-items: center;
        background-color: #f8f8f8;
        border: 2rpx solid #f0f0f0;
        border-radius: $border-radius-lg;
        padding: 0 30rpx;
        height: 90rpx;
        transition: all $transition-duration;
        
        &:focus-within {
          border-color: $primary-light;
          background-color: #f9f9f9;
          box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.1);
        }
        
        .input-icon {
          margin-right: 20rpx;
          font-family: "iconfont";
          font-size: 36rpx;
          color: $primary-color;
        }
        
        .input-field {
          flex: 1;
          height: 100%;
          font-size: 28rpx;
          color: $text-color;
          
          &::placeholder {
            color: $text-lighter;
          }
        }
      }
    }
    
    .login-btn {
      width: 100%;
      height: 90rpx;
      line-height: 90rpx;
      background: linear-gradient(to right, $primary-color, $primary-light);
      color: #fff;
      border-radius: 45rpx;
      font-size: 32rpx;
      margin-top: 50rpx;
      font-weight: bold;
      box-shadow: 0 8rpx 16rpx rgba($primary-color, 0.3);
      position: relative;
      overflow: hidden;
      transition: all $transition-duration;
      
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg, 
          rgba(255, 255, 255, 0) 0%, 
          rgba(255, 255, 255, 0.2) 50%, 
          rgba(255, 255, 255, 0) 100%
        );
        transition: all 0.8s;
      }
      
      &:active {
        transform: scale(0.98);
        box-shadow: 0 4rpx 8rpx rgba($primary-color, 0.3);
        
        &::after {
          left: 100%;
        }
      }
      
      &.loading {
        opacity: 0.9;
      }
      
      .btn-loader {
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        border: 4rpx solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        animation: spin 1s infinite linear;
        position: absolute;
        left: 50%;
        top: 50%;
        margin-top: -20rpx;
        margin-left: -20rpx;
      }
    }
    
    .action-links {
      margin-top: 40rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .register-link, .forgot-link {
        font-size: 28rpx;
        color: $text-light;
        
        text {
          color: $primary-color;
          font-weight: bold;
          transition: color $transition-duration;
          
          &:active {
            color: $primary-dark;
          }
        }
      }
    }
  }
  
  .login-footer {
    padding: 30rpx 0;
    text-align: center;
    
    .footer-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
      text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
    }
  }
}
</style>