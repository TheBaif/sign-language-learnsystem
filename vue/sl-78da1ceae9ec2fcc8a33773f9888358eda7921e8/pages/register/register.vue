<template>
  <view class="register-container">
    <view class="register-header">
      <image src="/static/logo.png" mode="aspectFit" class="logo"></image>
      <text class="app-name">手语学习</text>
      <text class="app-slogan">欢迎加入手语学习之旅</text>
    </view>
    
    <form @submit="handleRegister">
      <view class="register-form">
        <view class="form-header">
          <text class="form-title">创建账号</text>
        </view>
        
        <view class="input-group">
          <view class="input-icon">
            <text class="iconfont">&#xe6a4;</text>
          </view>
          <input 
            name="username"
            type="text" 
            placeholder="请输入用户名 (5-16位)"
            v-model="formData.username"
            @input="validateUsername"
            class="input-field"
          />
        </view>
        <view class="error-tip" v-if="errors.username">{{ errors.username }}</view>
        
        <view class="input-group">
          <view class="input-icon">
            <text class="iconfont">&#xe6a3;</text>
          </view>
          <input 
            name="password"
            type="password" 
            placeholder="请输入密码 (5-16位)"
            v-model="formData.password"
            @input="validatePassword"
            class="input-field"
          />
        </view>
        <view class="error-tip" v-if="errors.password">{{ errors.password }}</view>
        
        <view class="input-group">
          <view class="input-icon">
            <text class="iconfont">&#xe6a3;</text>
          </view>
          <input 
            name="confirmPassword"
            type="password" 
            placeholder="请确认密码"
            v-model="formData.confirmPassword"
            @input="validateConfirmPassword"
            class="input-field"
          />
        </view>
        <view class="error-tip" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</view>
        
        <button 
          class="register-btn" 
          form-type="submit" 
          :disabled="!isFormValid || loading"
          :class="{ loading: loading }"
        >
          <text v-if="!loading">注册</text>
          <view v-else class="btn-loader"></view>
        </button>
        
        <view class="login-link">
          已有账号？<text @tap="goToLogin">立即登录</text>
        </view>
      </view>
    </form>
    
    <view class="register-footer">
      <text class="terms-text">
        注册即表示您同意我们的<text class="terms-link" @tap="showTerms">服务条款</text>和<text class="terms-link" @tap="showPrivacy">隐私政策</text>
      </text>
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
        
        const requestData = {
          username: this.formData.username,
          password: this.formData.password
        };
        
        console.log('注册请求参数:', requestData);
        
        const res = await http.post('/user/register', requestData, {
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
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #3C8999 0%, #55a5b5 100%);
  display: flex;
  flex-direction: column;
  padding: 40rpx;
  
  .register-header {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx 0;
    
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
  
  .register-form {
    background-color: #ffffff;
    border-radius: 24rpx;
    padding: 40rpx;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
    margin-bottom: 40rpx;
    
    .form-header {
      text-align: center;
      margin-bottom: 40rpx;
      
      .form-title {
        font-size: 36rpx;
        color: #333;
        font-weight: bold;
      }
    }
    
    .input-group {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 50rpx;
      margin-bottom: 10rpx;
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
    
    .error-tip {
      font-size: 24rpx;
      color: #ff4d4f;
      padding: 0 30rpx 20rpx;
    }
    
    .register-btn {
      width: 100%;
      height: 90rpx;
      line-height: 90rpx;
      background: linear-gradient(to right, #3C8999, #55a5b5);
      color: #fff;
      border-radius: 45rpx;
      font-size: 32rpx;
      margin-top: 30rpx;
      font-weight: bold;
      box-shadow: 0 8rpx 16rpx rgba(60, 137, 153, 0.3);
      position: relative;
      
      &::after {
        border: none;
      }
      
      &:active {
        transform: scale(0.98);
      }
      
      &.loading {
        opacity: 0.8;
      }
      
      &[disabled] {
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
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    }
    
    .login-link {
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
  
  .register-footer {
    padding: 20rpx 0;
    
    .terms-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      display: block;
      
      .terms-link {
        color: #fff;
        text-decoration: underline;
      }
    }
  }
}
</style>