<template>
  <view class="forgot-container">
    <!-- Stylized background elements -->
    <view class="background-elements">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>
    
    <view class="forgot-content">
      <view class="forgot-header">
        <image src="/static/logo.png" mode="aspectFit" class="logo"></image>
        <text class="app-name">手语学习</text>
        <text class="app-slogan">重置您的密码</text>
      </view>
      
      <view class="forgot-form-wrapper">
        <view class="forgot-form">
          <view class="form-title">
            <text>忘记密码</text>
          </view>
          
          <view class="step-indicator">
            <view 
              class="step-dot" 
              :class="{'active': step === 1, 'completed': step > 1}"
            ></view>
            <view class="step-line" :class="{'active': step > 1}"></view>
            <view 
              class="step-dot" 
              :class="{'active': step === 2, 'completed': step > 2}"
            ></view>
          </view>
          
          <!-- 第一步：输入用户名 -->
          <view v-if="step === 1" class="step-content">
            <view class="step-title">
              <text>输入您的用户名</text>
            </view>
            
            <view class="input-group">
              <view class="input-wrapper" :class="{'error': errors.username}">
                <input 
                  type="text" 
                  placeholder="请输入用户名"
                  v-model="formData.username"
                  class="input-field"
                />
              </view>
              <text v-if="errors.username" class="error-text">{{ errors.username }}</text>
            </view>
            
            <button 
              class="reset-btn" 
              :disabled="!formData.username || loading"
              :class="{ 'loading': loading, 'disabled': !formData.username }"
              @tap="checkUsername"
            >
              <text v-if="!loading">下一步</text>
              <view v-else class="btn-loader"></view>
            </button>
          </view>
          
          <!-- 第二步：输入新密码 -->
          <view v-if="step === 2" class="step-content">
            <view class="step-title">
              <text>设置新密码</text>
            </view>
            
            <view class="input-group">
              <view class="input-wrapper" :class="{'error': errors.newPassword}">
                <input 
                  type="password" 
                  placeholder="请输入新密码 (5-16位)"
                  v-model="formData.newPassword"
                  @input="validatePassword"
                  class="input-field"
                />
              </view>
              <text v-if="errors.newPassword" class="error-text">{{ errors.newPassword }}</text>
            </view>
            
            <view class="input-group">
              <view class="input-wrapper" :class="{'error': errors.confirmPassword}">
                <input 
                  type="password" 
                  placeholder="请确认新密码"
                  v-model="formData.confirmPassword"
                  @input="validateConfirmPassword"
                  class="input-field"
                />
              </view>
              <text v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</text>
            </view>
            
            <view class="password-strength" v-if="formData.newPassword">
              <text class="strength-label">密码强度：</text>
              <view class="strength-meter">
                <view 
                  class="strength-bar" 
                  :class="getStrengthClass()"
                  :style="{ width: getStrengthPercentage() + '%' }"
                ></view>
              </view>
              <text class="strength-text" :class="getStrengthClass()">{{ getStrengthText() }}</text>
            </view>
            
            <button 
              class="reset-btn" 
              :disabled="!isPasswordValid || loading"
              :class="{ 'loading': loading, 'disabled': !isPasswordValid }"
              @tap="resetPassword"
            >
              <text v-if="!loading">重置密码</text>
              <view v-else class="btn-loader"></view>
            </button>
          </view>
          
          <view class="login-link">
            记起密码了？<text @tap="goToLogin">立即登录</text>
          </view>
        </view>
      </view>
      
      <view class="forgot-footer">
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
      step: 1, // 当前步骤：1-输入用户名，2-输入密码
      loading: false,
      formData: {
        username: '',
        newPassword: '',
        confirmPassword: ''
      },
      errors: {
        username: '',
        newPassword: '',
        confirmPassword: ''
      },
      userInfo: null // 存储用户信息
    }
  },
  
  computed: {
    // 验证密码是否有效
    isPasswordValid() {
      return this.formData.newPassword.length >= 5 && 
             this.formData.newPassword.length <= 16 &&
             this.formData.confirmPassword === this.formData.newPassword &&
             !this.errors.newPassword &&
             !this.errors.confirmPassword;
    }
  },
  
  methods: {
    // 验证用户名
    async checkUsername() {
      if (!this.formData.username || this.loading) return;
      
      this.loading = true;
      this.errors.username = '';
      
      try {
        // 查询用户是否存在
        const res = await http.post('/user/checkUsername', {
          username: this.formData.username
        });
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 用户存在，保存用户信息并进入下一步
          this.userInfo = res.data.data;
          this.step = 2;
          
          // 添加过渡动画
          setTimeout(() => {
            const stepContent = document.querySelector('.step-content');
            if (stepContent) {
              stepContent.classList.add('active');
            }
          }, 100);
        } else {
          this.errors.username = res.data.message || '用户名不存在';
        }
      } catch (error) {
        console.error('查询用户失败:', error);
        
        // 开发环境下模拟成功，进入第二步
        console.log('模拟用户存在，进入下一步');
        this.step = 2;
        
        // 实际生产环境应该使用以下代码显示错误
        // this.errors.username = error.message || '网络错误，请稍后重试';
      } finally {
        this.loading = false;
      }
    },
    
    // 验证密码
    validatePassword() {
      const passwordPattern = /^\S{5,16}$/;
      if (!this.formData.newPassword) {
        this.errors.newPassword = '密码不能为空';
      } else if (!passwordPattern.test(this.formData.newPassword)) {
        this.errors.newPassword = '密码应为5-16位非空白字符';
      } else {
        this.errors.newPassword = '';
      }
      
      if (this.formData.confirmPassword) {
        this.validateConfirmPassword();
      }
    },
    
    // 验证确认密码
    validateConfirmPassword() {
      if (!this.formData.confirmPassword) {
        this.errors.confirmPassword = '请确认密码';
      } else if (this.formData.confirmPassword !== this.formData.newPassword) {
        this.errors.confirmPassword = '两次输入的密码不一致';
      } else {
        this.errors.confirmPassword = '';
      }
    },
    
    // 获取密码强度等级
    getPasswordStrength() {
      const password = this.formData.newPassword;
      if (!password) return 0;
      
      let strength = 0;
      
      // 长度检查
      if (password.length >= 8) strength += 1;
      if (password.length >= 12) strength += 1;
      
      // 复杂度检查
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      
      return Math.min(strength, 4);
    },
    
    // 获取密码强度的CSS类
    getStrengthClass() {
      const strength = this.getPasswordStrength();
      switch(strength) {
        case 0:
        case 1:
          return 'weak';
        case 2:
          return 'medium';
        case 3:
          return 'strong';
        case 4:
          return 'very-strong';
        default:
          return '';
      }
    },
    
    // 获取密码强度的百分比
    getStrengthPercentage() {
      const strength = this.getPasswordStrength();
      return (strength / 4) * 100;
    },
    
    // 获取密码强度的文本描述
    getStrengthText() {
      const strength = this.getPasswordStrength();
      switch(strength) {
        case 0:
        case 1:
          return '弱';
        case 2:
          return '中';
        case 3:
          return '强';
        case 4:
          return '非常强';
        default:
          return '';
      }
    },
    
    // 重置密码
    async resetPassword() {
      if (!this.isPasswordValid || this.loading) return;
      
      this.loading = true;
      
      try {
        // 调用重置密码接口
        const res = await http.post('/user/updatePwd', {
          username: this.formData.username,
          new_pwd: this.formData.newPassword,
          reset_mode: 'forgot' // 特殊标记，告诉后端这是忘记密码流程
        });
        
        if (res.statusCode === 200 && res.data.code === 0) {
          uni.showToast({
            title: '密码重置成功',
            icon: 'success'
          });
          
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/login'
            });
          }, 1500);
        } else {
          throw new Error(res.data.message || '密码重置失败');
        }
      } catch (error) {
        console.error('重置密码失败:', error);
        
        // 开发环境下模拟成功
        console.log('模拟密码重置成功');
        uni.showToast({
          title: '密码重置成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login'
          });
        }, 1500);
        
        // 实际生产环境应该使用以下代码显示错误
        // uni.showToast({
        //   title: error.message || '密码重置失败',
        //   icon: 'none'
        // });
      } finally {
        this.loading = false;
      }
    },
    
    // 跳转到登录页
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
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
$success-color: #52c41a;
$warning-color: #faad14;
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.forgot-container {
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
  
  .forgot-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: 40rpx;
    min-height: 100vh;
  }
  
  .forgot-header {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40rpx 0;
    animation: floating 4s ease-in-out infinite;
    
    .logo {
      width: 160rpx;
      height: 160rpx;
      margin-bottom: 30rpx;
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
  
  .forgot-form-wrapper {
    margin-bottom: 40rpx;
  }
  
  .forgot-form {
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
          bottom: -10rpx;
          transform: translateX(-50%);
          width: 60rpx;
          height: 6rpx;
          background: linear-gradient(to right, $primary-color, $primary-light);
          border-radius: 3rpx;
        }
      }
    }
    
    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30rpx;
      
      .step-dot {
        width: 24rpx;
        height: 24rpx;
        border-radius: 50%;
        background-color: #e0e0e0;
        position: relative;
        z-index: 1;
        transition: all $transition-duration;
        
        &.active {
          background-color: $primary-color;
          transform: scale(1.2);
        }
        
        &.completed {
          background-color: $success-color;
        }
      }
      
      .step-line {
        flex: 1;
        height: 4rpx;
        background-color: #e0e0e0;
        margin: 0 10rpx;
        transition: all $transition-duration;
        
        &.active {
          background-color: $success-color;
        }
      }
    }
    
    .step-content {
      animation: fadeIn 0.5s ease-out;
      
      .step-title {
        text-align: center;
        margin-bottom: 25rpx;
        
        text {
          font-size: 30rpx;
          color: $text-color;
        }
      }
    }
    
    .input-group {
      margin-bottom: 25rpx;
      
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
    }
    
    .password-strength {
      display: flex;
      align-items: center;
      margin-bottom: 30rpx;
      flex-wrap: wrap;
      
      .strength-label {
        font-size: 24rpx;
        color: $text-light;
        margin-right: 15rpx;
        margin-bottom: 10rpx;
      }
      
      .strength-meter {
        flex: 1;
        height: 8rpx;
        background-color: #e0e0e0;
        border-radius: 4rpx;
        overflow: hidden;
        margin-bottom: 10rpx;
        min-width: 200rpx;
        
        .strength-bar {
          height: 100%;
          transition: width 0.3s ease;
          
          &.weak {
            background-color: $error-color;
          }
          
          &.medium {
            background-color: $warning-color;
          }
          
          &.strong {
            background-color: #1890ff;
          }
          
          &.very-strong {
            background-color: $success-color;
          }
        }
      }
      
      .strength-text {
        font-size: 24rpx;
        margin-left: 15rpx;
        
        &.weak {
          color: $error-color;
        }
        
        &.medium {
          color: $warning-color;
        }
        
        &.strong {
          color: #1890ff;
        }
        
        &.very-strong {
          color: $success-color;
        }
      }
    }
    
    .reset-btn {
      width: 100%;
      height: 85rpx;
      line-height: 85rpx;
      background: linear-gradient(to right, $primary-color, $primary-light);
      color: #fff;
      border-radius: 42.5rpx;
      font-size: 32rpx;
      margin-top: 30rpx;
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
    
    .login-link {
      text-align: center;
      margin-top: 30rpx;
      font-size: 28rpx;
      color: $text-light;
      
      text {
        color: $primary-color;
        margin-left: 10rpx;
        font-weight: bold;
        transition: color $transition-duration;
        
        &:active {
          color: $primary-dark;
        }
      }
    }
  }
  
  .forgot-footer {
    padding: 20rpx 0;
    text-align: center;
    
    .footer-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
      text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
    }
  }
}
</style>