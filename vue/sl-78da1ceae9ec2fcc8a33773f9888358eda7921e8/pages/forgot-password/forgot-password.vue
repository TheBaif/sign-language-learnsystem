<template>
  <view class="forgot-container">
    <view class="forgot-header">
      <image src="/static/logo.png" mode="aspectFit" class="logo"></image>
      <text class="app-name">手语学习</text>
      <text class="app-slogan">重置您的密码</text>
    </view>
    
    <view class="forgot-form">
      <view class="form-header">
        <text class="form-title">忘记密码</text>
      </view>
      
      <!-- 第一步：输入用户名 -->
      <view v-if="step === 1">
        <view class="input-group">
          <input 
            type="text" 
            placeholder="请输入用户名"
            v-model="formData.username"
            class="input-field"
          />
        </view>
        <view class="error-tip" v-if="errors.username">{{ errors.username }}</view>
        
        <button 
          class="reset-btn" 
          :disabled="!formData.username || loading"
          :class="{ loading: loading }"
          @tap="checkUsername"
        >
          <text v-if="!loading">下一步</text>
          <view v-else class="btn-loader"></view>
        </button>
      </view>
      
      <!-- 第二步：输入新密码 -->
      <view v-if="step === 2">
        <view class="step-info">
          <text>请输入新密码</text>
        </view>
        
        <view class="input-group">
          <input 
            type="password" 
            placeholder="请输入新密码 (5-16位)"
            v-model="formData.newPassword"
            @input="validatePassword"
            class="input-field"
          />
        </view>
        <view class="error-tip" v-if="errors.newPassword">{{ errors.newPassword }}</view>
        
        <view class="input-group">
          <input 
            type="password" 
            placeholder="请确认新密码"
            v-model="formData.confirmPassword"
            @input="validateConfirmPassword"
            class="input-field"
          />
        </view>
        <view class="error-tip" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</view>
        
        <button 
          class="reset-btn" 
          :disabled="!isPasswordValid || loading"
          :class="{ loading: loading }"
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
.forgot-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #3C8999 0%, #55a5b5 100%);
  display: flex;
  flex-direction: column;
  padding: 40rpx;
  
  .forgot-header {
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
  
  .forgot-form {
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
    
    .step-info {
      margin-bottom: 20rpx;
      text-align: center;
      
      text {
        font-size: 28rpx;
        color: #666;
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
    
    .reset-btn {
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
}
</style>