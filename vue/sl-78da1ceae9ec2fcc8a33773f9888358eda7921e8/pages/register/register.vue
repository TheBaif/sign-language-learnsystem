<template>
  <view class="register-container">
    <!-- Stylized background elements -->
    <view class="background-elements">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
      <view class="floating-hand hand-1"></view>
      <view class="floating-hand hand-2"></view>
    </view>
    
    <view class="register-content">
      <view class="register-header">
        <image src="/static/logo.png" mode="aspectFit" class="logo"></image>
        <text class="app-name">手语学习</text>
        <text class="app-slogan">欢迎加入手语学习之旅</text>
      </view>
      
      <form @submit="handleRegister" class="register-form-wrapper">
        <view class="register-form">
          <view class="form-title">
            <text>创建账号</text>
          </view>
          
          <view class="input-group">
            <text class="input-label">用户名</text>
            <view class="input-wrapper" :class="{'error': errors.username}">
              <input 
                name="username"
                type="text" 
                placeholder="请输入用户名 (5-16位)"
                v-model="formData.username"
                @input="validateUsername"
                class="input-field"
              />
            </view>
            <text v-if="errors.username" class="error-text">{{ errors.username }}</text>
          </view>
          
          <view class="input-group">
            <text class="input-label">密码</text>
            <view class="input-wrapper" :class="{'error': errors.password}">
              <input 
                name="password"
                type="password" 
                placeholder="请输入密码 (5-16位)"
                v-model="formData.password"
                @input="validatePassword"
                class="input-field"
              />
            </view>
            <text v-if="errors.password" class="error-text">{{ errors.password }}</text>
          </view>
          
          <view class="input-group">
            <text class="input-label">确认密码</text>
            <view class="input-wrapper" :class="{'error': errors.confirmPassword}">
              <input 
                name="confirmPassword"
                type="password" 
                placeholder="请确认密码"
                v-model="formData.confirmPassword"
                @input="validateConfirmPassword"
                class="input-field"
              />
            </view>
            <text v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</text>
          </view>
          
          <button 
            class="register-btn" 
            :class="{'loading': loading, 'disabled': !isFormValid}"
            :disabled="!isFormValid"
            form-type="submit"
          >
            <text v-if="!loading">注册</text>
            <view v-else class="btn-loader"></view>
          </button>
          
          <view class="action-links">
            <view class="login-link">
              已有账号？<text @tap="goToLogin">立即登录</text>
            </view>
          </view>
        </view>
      </form>
      
      <view class="register-footer">
        <text class="terms-text">
          注册即表示您同意我们的<text class="terms-link" @tap="showTerms">服务条款</text>和<text class="terms-link" @tap="showPrivacy">隐私政策</text>
        </text>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      loading: false,
      formData: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      errors: {
        username: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  
  computed: {
    isFormValid() {
      return this.formData.username.length >= 5 && 
             this.formData.username.length <= 16 &&
             this.formData.password.length >= 5 &&
             this.formData.password.length <= 16 &&
             this.formData.confirmPassword === this.formData.password &&
             !this.errors.username &&
             !this.errors.password &&
             !this.errors.confirmPassword;
    }
  },
  
  methods: {
    validateUsername() {
      const usernamePattern = /^\S{5,16}$/;
      if (!this.formData.username) {
        this.errors.username = '用户名不能为空';
      } else if (!usernamePattern.test(this.formData.username)) {
        this.errors.username = '用户名应为5-16位非空白字符';
      } else {
        this.errors.username = '';
      }
    },
    
    validatePassword() {
      const passwordPattern = /^\S{5,16}$/;
      if (!this.formData.password) {
        this.errors.password = '密码不能为空';
      } else if (!passwordPattern.test(this.formData.password)) {
        this.errors.password = '密码应为5-16位非空白字符';
      } else {
        this.errors.password = '';
      }
      
      // 如果已经输入确认密码，同时验证确认密码
      if (this.formData.confirmPassword) {
        this.validateConfirmPassword();
      }
    },
    
    validateConfirmPassword() {
      if (!this.formData.confirmPassword) {
        this.errors.confirmPassword = '请确认密码';
      } else if (this.formData.confirmPassword !== this.formData.password) {
        this.errors.confirmPassword = '两次输入的密码不一致';
      } else {
        this.errors.confirmPassword = '';
      }
    },
    
    async handleRegister(e) {
          if (this.loading || !this.isFormValid) return;
          
          try {
            this.loading = true;
            
            // 修改这部分，不要直接传对象
            // const requestData = {
            //   username: this.formData.username,
            //   password: this.formData.password
            // };
            
            // 使用URL编码格式
            const params = `username=${encodeURIComponent(this.formData.username)}&password=${encodeURIComponent(this.formData.password)}`;
            
            console.log('注册请求参数:', params);
            
            const res = await http.post('/user/register', params, {
              header: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            });
            
            console.log('注册响应:', res);
            
            if (res.statusCode === 200 && res.data.code === 0) {
              uni.showToast({
                title: '注册成功',
                icon: 'success'
              });
              
              setTimeout(() => {
                uni.navigateTo({
                  url: '/pages/login/login'
                });
              }, 1500);
            } else {
              throw new Error(res.data.message || '注册失败');
            }
          } catch (error) {
            console.error('注册失败:', error);
            uni.showToast({
              title: error.message || '注册失败，请重试',
              icon: 'none'
            });
          } finally {
            this.loading = false;
          }
        },
    
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    },
    
    showTerms() {
      uni.showModal({
        title: '服务条款',
        content: '这是手语学习应用的服务条款...',
        showCancel: false
      });
    },
    
    showPrivacy() {
      uni.showModal({
        title: '隐私政策',
        content: '这是手语学习应用的隐私政策...',
        showCancel: false
      });
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
$error-color: #ff4d4f;
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

@keyframes floatHand {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20rpx, -20rpx) rotate(5deg); }
  50% { transform: translate(0, -40rpx) rotate(0deg); }
  75% { transform: translate(-20rpx, -20rpx) rotate(-5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

.register-container {
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
    
    .floating-hand {
      position: absolute;
      width: 120rpx;
      height: 120rpx;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.2;
      
      &.hand-1 {
        top: 15%;
        left: 10%;
        animation: floatHand 12s infinite ease-in-out;
      }
      
      &.hand-2 {
        bottom: 20%;
        right: 10%;
        animation: floatHand 15s infinite ease-in-out reverse;
      }
    }
  }
  
  .register-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: 40rpx;
    min-height: 100vh;
  }
  
  .register-header {
    flex: 0.7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40rpx 0;
    animation: floating 4s ease-in-out infinite;
    
    .logo {
      width: 160rpx;
      height: 160rpx;
      margin-bottom: 25rpx;
      border-radius: 50%;
      box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
    }
    
    .app-name {
      font-size: 44rpx;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 15rpx;
      text-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.2);
    }
    
    .app-slogan {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50rpx;
      padding: 8rpx 25rpx;
      backdrop-filter: blur(5rpx);
    }
  }
  
  .register-form-wrapper {
    margin-bottom: 30rpx;
  }
  
  .register-form {
    background-color: #ffffff;
    border-radius: $border-radius-lg;
    padding: 40rpx 35rpx;
    box-shadow: $box-shadow;
    transform: translateY(0);
    transition: transform $transition-duration;
    
    &:active {
      transform: translateY(3rpx);
    }
    
    .form-title {
      text-align: center;
      margin-bottom: 30rpx;
      
      text {
        font-size: 34rpx;
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
      margin-bottom: 25rpx;
      
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
        border-radius: $border-radius-md;
        padding: 0 25rpx;
        height: 85rpx;
        transition: all $transition-duration;
        
        &:focus-within {
          border-color: $primary-light;
          background-color: #f9f9f9;
          box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.1);
        }
        
        &.error {
          border-color: $error-color;
          background-color: rgba($error-color, 0.05);
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
      
      .error-text {
        display: block;
        font-size: 24rpx;
        color: $error-color;
        margin-top: 10rpx;
        margin-left: 10rpx;
        animation: fadeIn 0.3s;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5rpx); }
        to { opacity: 1; transform: translateY(0); }
      }
    }
    
    .register-btn {
      width: 100%;
      height: 85rpx;
      line-height: 85rpx;
      background: linear-gradient(to right, $primary-color, $primary-light);
      color: #fff;
      border-radius: 42.5rpx;
      font-size: 32rpx;
      margin-top: 40rpx;
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
      
      &:active:not(.disabled) {
        transform: scale(0.98);
        box-shadow: 0 4rpx 8rpx rgba($primary-color, 0.3);
        
        &::after {
          left: 100%;
        }
      }
      
      &.loading {
        opacity: 0.9;
      }
      
      &.disabled {
        background: #cccccc;
        box-shadow: none;
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
      margin-top: 30rpx;
      text-align: center;
      
      .login-link {
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
  
  .register-footer {
    padding: 20rpx 0;
    text-align: center;
    
    .terms-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
      text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
      
      .terms-link {
        color: #ffffff;
        text-decoration: underline;
        transition: opacity $transition-duration;
        
        &:active {
          opacity: 0.8;
        }
      }
    }
  }
}
</style>