<template>
  <view class="home-container">
    <!-- Stylized background elements -->
    <view class="background-elements">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>
    
    <view class="home-content">
      <!-- Header with user profile -->
      <view class="header">
        <view class="logo-area">
          <image src="/static/logo.png" mode="aspectFit" class="mini-logo"></image>
          <text class="app-name">手语学习</text>
        </view>
        <view class="avatar-wrapper" @tap="navigateToUserProfile">
          <image class="avatar" :src="userInfo.userPic || '/static/avatar.png'" mode="aspectFill"></image>
          <view class="avatar-indicator" v-if="calculateConsecutiveDays()">
            <text>{{ calculateConsecutiveDays() }}天</text>
          </view>
        </view>
      </view>
      
      <!-- Main welcome card -->
      <view class="welcome-card">
        <view class="welcome-content">
          <view class="welcome-text">
            <text class="greeting">{{ getGreeting() }}</text>
            <text class="username">{{ userInfo.nickname || userInfo.username || '学习者' }}</text>
          </view>
          <view class="tip-container">
            <text class="tip-text">{{ getDailyTip() }}</text>
          </view>
        </view>
        <view class="illustration">
          <image src="/static/welcome-illus.png" mode="aspectFit"></image>
        </view>
      </view>
      
      <!-- Learning Progress Card -->
      <view class="progress-card" :class="{'loading': loadingProgress}">
        <view class="card-header">
          <text class="section-title">学习进度</text>
          <text class="view-more" @tap="navigateToLearningProgress">查看详情</text>
        </view>
        
        <view v-if="loadingProgress" class="loading-state">
          <view class="loader"></view>
          <text>加载中...</text>
        </view>
        
        <view v-else class="progress-content">
          <!-- Stats overview -->
          <view class="stats-grid">
            <view class="stat-item">
              <view class="stat-value-container">
                <text class="stat-value">{{ progressData.totalSigns || 0 }}</text>
              </view>
              <text class="stat-label">已学习</text>
            </view>
            <view class="stat-item">
              <view class="stat-value-container">
                <text class="stat-value">{{ progressData.masteredSigns || 0 }}</text>
              </view>
              <text class="stat-label">已掌握</text>
            </view>
            <view class="stat-item">
              <view class="stat-value-container">
                <text class="stat-value">{{ formatProficiency(progressData.averageProficiency) }}</text>
              </view>
              <text class="stat-label">掌握度</text>
            </view>
          </view>
          
          <!-- Progress bar -->
          <view class="progress-bar-section">
            <view class="progress-label">
              <text>学习进度</text>
              <text>{{ calculateProgressPercentage() }}%</text>
            </view>
            <view class="progress-track">
              <view class="progress-milestone" style="left: 33%">
                <view class="milestone-dot" :class="{'reached': calculateProgressPercentage() >= 33}"></view>
                <text class="milestone-label">初级</text>
              </view>
              <view class="progress-milestone" style="left: 66%">
                <view class="milestone-dot" :class="{'reached': calculateProgressPercentage() >= 66}"></view>
                <text class="milestone-label">中级</text>
              </view>
              <view class="progress-milestone" style="left: 100%">
                <view class="milestone-dot" :class="{'reached': calculateProgressPercentage() >= 100}"></view>
                <text class="milestone-label">高级</text>
              </view>
              <view class="progress-fill" :style="{ width: calculateProgressPercentage() + '%' }"></view>
            </view>
          </view>
          
          <!-- Recommendations -->
          <view class="recommendations" v-if="progressData.recommendedNextSigns && progressData.recommendedNextSigns.length">
            <text class="recommendation-title">推荐学习</text>
            <scroll-view scroll-x class="recommendation-scroll" show-scrollbar="false">
              <view 
                v-for="(item, index) in progressData.recommendedNextSigns" 
                :key="index"
                class="recommendation-item"
                @tap="goToSignDetail(item)"
              >
                <image 
                  :src="item.imageSrc || '/static/placeholder-sign.png'" 
                  mode="aspectFill"
                  class="recommendation-image"
                ></image>
                <view class="recommendation-info">
                  <text class="recommendation-name">{{ item.name }}</text>
                  <text class="recommendation-pinyin">{{ item.pinyin }}</text>
                </view>
              </view>
            </scroll-view>
          </view>
        </view>
      </view>
      
      <!-- Search card -->
      <view class="search-card" @tap="navigateToSearch">
        <text class="search-placeholder">搜索手语词汇...</text>
      </view>
      
      <!-- Navigation buttons -->
      <view class="nav-buttons">
        <view class="nav-button study-button" @tap="navigateToVocabulary">
          <view class="button-icon">
          </view>
          <text class="button-text">学习词汇</text>
        </view>
        
        <view class="nav-button practice-button" @tap="navigateToPractice">
          <view class="button-icon">
          </view>
          <text class="button-text">练习测试</text>
        </view>
        
        
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      touchStartY: 0,
      swipeThreshold: 100,
      minVerticalSwipe: 30,
      userInfo: {},
      loadingProgress: true,
      progressData: {
        totalSigns: 0,
        masteredSigns: 0,
        averageProficiency: 0,
        totalLearningTimeMinutes: 0,
        recommendedNextSigns: []
      }
    }
  },
  
  onLoad() {
    this.checkLogin()
    this.getUserInfo()
    this.loadProgressData()
  },
  
  onShow() {
    this.checkLogin()
    this.getUserInfo()
    this.loadProgressData()
  },
  
  methods: {
    // Navigation methods
    navigateToVocabulary() {
      uni.navigateTo({
        url: '/pages/vocabulary/index/index'
      })
    },
    
    navigateToLearningProgress() {
      uni.navigateTo({
        url: '/pages/learning-progress/learning-progress'
      })
    },
    
    navigateToPractice() {
      uni.navigateTo({
        url: '/pages/practice/practice'
      });
    },
    
    navigateToRecognition() {
      uni.navigateTo({
        url: '/pages/recognition/recognition'
      });
    },
    
    navigateToSearch() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login'
          })
        }, 1500)
        return
      }
      
      uni.navigateTo({
        url: '/pages/search/search'
      })
    },
    
    navigateToUserProfile() {
      uni.navigateTo({
        url: '/pages/user/user'
      })
    },
    
    // Get time-appropriate greeting
    getGreeting() {
      const hour = new Date().getHours()
      if (hour < 6) return '夜深了，'
      if (hour < 9) return '早上好，'
      if (hour < 12) return '上午好，'
      if (hour < 14) return '中午好，'
      if (hour < 18) return '下午好，'
      if (hour < 22) return '晚上好，'
      return '夜深了，'
    },
    
    // Get random daily tip
    getDailyTip() {
      const tips = [
        '每天学习15分钟，坚持才会有收获',
        '手语学习需要不断练习才能熟练',
        '向上滑动可以快速搜索手语词汇',
        '尝试通过练习模式检验学习成果',
        '学习遇到困难，不妨多看几遍视频'
      ]
      return tips[Math.floor(Math.random() * tips.length)]
    },
    
    // Simulate consecutive days calculation
    calculateConsecutiveDays() {
      if (this.progressData && this.progressData.consecutiveLearningDays) {
        return this.progressData.consecutiveLearningDays
      }
      return 0
    },
    
    // Authentication check
    checkLogin() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
    },
    
    // Load user information
    async getUserInfo() {
      try {
        const token = uni.getStorageSync('token')
        if (!token) return
        
        const res = await http.get('/user/userInfo')
        if (res.data.code === 0) {
          this.userInfo = res.data.data
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },
    
    // Load progress data
    async loadProgressData() {
      this.loadingProgress = true
      
      try {
        const res = await http.get('/learning/progress')
        
        if (res.data.code === 0) {
          this.progressData = res.data.data
        } else {
          console.error('获取进度数据失败:', res.data.message)
        }
      } catch (error) {
        console.error('加载进度数据失败:', error)
        // 使用模拟数据保证页面正常显示
        this.progressData = {
          totalSigns: 28,
          masteredSigns: 12,
          averageProficiency: 65.4,
          totalLearningTimeMinutes: 205,
          consecutiveLearningDays: 3,
          recommendedNextSigns: [
            {
              id: 1,
              name: '你好',
              pinyin: 'nǐ hǎo',
              imageSrc: '/static/images/default-sign.png'
            },
            {
              id: 2,
              name: '谢谢',
              pinyin: 'xiè xiè',
              imageSrc: '/static/images/default-sign.png'
            },
            {
              id: 3,
              name: '再见',
              pinyin: 'zài jiàn',
              imageSrc: '/static/images/default-sign.png'
            }
          ]
        }
      } finally {
        this.loadingProgress = false
      }
    },
    
    // Format proficiency percentage
    formatProficiency(proficiency) {
      if (!proficiency) return '0%'
      return Math.round(proficiency) + '%'
    },
    
    // Calculate progress percentage
    calculateProgressPercentage() {
      if (!this.progressData.totalSigns || this.progressData.totalSigns === 0) return 0
      
      // 假设总目标是100个手语
      const totalTarget = 6700
      const progress = Math.min(100, Math.round((this.progressData.totalSigns / totalTarget) * 100))
      
      return progress
    },
    
    // Navigate to sign detail
    goToSignDetail(sign) {
      // 记录学习行为
      this.recordLearning(sign.id)
      
      // 将选择的手语缓存
      const results = [sign]
      uni.setStorageSync('searchResults', results)
      
      // 跳转到详情页
      uni.navigateTo({
        url: `/pages/detail/detail?index=0`
      })
    },
    
    // Record learning activity
    async recordLearning(signId) {
      try {
        await http.post('/learning/record', {
          signId: signId
        })
      } catch (error) {
        console.error('记录学习行为失败:', error)
      }
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
$background-color: #f5f5f5;
$card-background: #ffffff;
$border-radius-sm: 10rpx;
$border-radius-md: 20rpx;
$border-radius-lg: 30rpx;
$box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
$transition-duration: 0.3s;

// Keyframes for animations
@keyframes floating {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
  100% { transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.05); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0.6; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

// Main container styles
.home-container {
  min-height: 100vh;
  background-color: $background-color;
  position: relative;
  
  // Background decorative elements
  .background-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40vh;
    background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
    border-bottom-left-radius: 30rpx;
    border-bottom-right-radius: 30rpx;
    overflow: hidden;
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
        width: 400rpx;
        height: 400rpx;
        animation: pulse 12s infinite ease-in-out;
      }
      
      &.circle-3 {
        top: 20%;
        right: 20%;
        width: 200rpx;
        height: 200rpx;
        animation: pulse 10s infinite ease-in-out;
      }
    }
  }
  
  // Main content
  .home-content {
    position: relative;
    z-index: 1;
    padding: 40rpx 30rpx;
    
    // Header styling
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;
      
      .logo-area {
        display: flex;
        align-items: center;
        
        .mini-logo {
          width: 60rpx;
          height: 60rpx;
          margin-right: 15rpx;
          border-radius: 50%;
          box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
        }
        
        .app-name {
          font-size: 34rpx;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
        }
      }
      
      .avatar-wrapper {
        position: relative;
        
        .avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          border: 3rpx solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
        }
        
        .avatar-indicator {
          position: absolute;
          bottom: -5rpx;
          right: -5rpx;
          min-width: 40rpx;
          height: 40rpx;
          border-radius: 20rpx;
          background-color: $accent-color;
          color: #fff;
          font-size: 20rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 8rpx;
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
        }
      }
    }
    
    // Welcome card
    .welcome-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10rpx);
      border-radius: $border-radius-lg;
      padding: 30rpx;
      margin-bottom: 30rpx;
      box-shadow: $box-shadow;
      display: flex;
      align-items: center;
      
      .welcome-content {
        flex: 1;
        
        .welcome-text {
          margin-bottom: 15rpx;
          
          .greeting {
            font-size: 28rpx;
            color: $text-light;
            display: block;
            margin-bottom: 5rpx;
          }
          
          .username {
            font-size: 40rpx;
            font-weight: bold;
            color: $primary-color;
            display: block;
          }
        }
        
        .tip-container {
          background-color: rgba($primary-color, 0.1);
          padding: 15rpx 20rpx;
          border-radius: $border-radius-md;
          border-left: 4rpx solid $primary-color;
          
          .tip-text {
            font-size: 24rpx;
            color: $primary-dark;
            line-height: 1.5;
          }
        }
      }
      
      .illustration {
        width: 180rpx;
        height: 180rpx;
        margin-left: 20rpx;
        animation: floating 4s ease-in-out infinite;
        
        image {
          width: 100%;
          height: 100%;
        }
      }
    }
    
    // Progress card
    .progress-card {
      background-color: $card-background;
      border-radius: $border-radius-lg;
      padding: 30rpx;
      margin-bottom: 30rpx;
      box-shadow: $box-shadow;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30rpx;
        
        .section-title {
          font-size: 32rpx;
          font-weight: bold;
          color: $text-color;
          position: relative;
          padding-left: 20rpx;
          
          &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 15%;
            height: 70%;
            width: 8rpx;
            background: linear-gradient(to bottom, $primary-color, $primary-light);
            border-radius: 4rpx;
          }
        }
        
        .view-more {
          font-size: 26rpx;
          color: $primary-color;
          padding: 8rpx 16rpx;
          background-color: rgba($primary-color, 0.1);
          border-radius: 30rpx;
          transition: background-color $transition-duration;
          
          &:active {
            background-color: rgba($primary-color, 0.2);
          }
        }
      }
      
      &.loading {
        .loading-state {
          height: 300rpx;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          
          .loader {
            width: 60rpx;
            height: 60rpx;
            border-radius: 50%;
            border: 4rpx solid rgba($primary-color, 0.1);
            border-top-color: $primary-color;
            animation: spin 1s infinite linear;
            margin-bottom: 20rpx;
          }
          
          text {
            font-size: 28rpx;
            color: $text-lighter;
          }
        }
      }
      
      .progress-content {
        // Stats grid
        .stats-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40rpx;
          
          .stat-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            
            &:not(:last-child)::after {
              content: "";
              position: absolute;
              right: 0;
              top: 15%;
              height: 70%;
              width: 1px;
              background-color: rgba(0, 0, 0, 0.05);
            }
            
            .stat-value-container {
              margin-bottom: 10rpx;
              position: relative;
              
              .stat-value {
                font-size: 46rpx;
                font-weight: bold;
                color: $primary-color;
              }
            }
            
            .stat-label {
              font-size: 24rpx;
              color: $text-light;
            }
          }
        }
        
        // Progress bar
        .progress-bar-section {
          margin-bottom: 40rpx;
          
          .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10rpx;
            
            text {
              font-size: 26rpx;
              color: $text-light;
            }
          }
          
          .progress-track {
            height: 12rpx;
            background-color: #f0f0f0;
            border-radius: 6rpx;
            position: relative;
            margin-bottom: 30rpx;
            margin-top: 30rpx;
            
            .progress-milestone {
              position: absolute;
              top: -10rpx;
              transform: translateX(-50%);
              
              .milestone-dot {
                width: 24rpx;
                height: 24rpx;
                border-radius: 50%;
                background-color: #f0f0f0;
                border: 3rpx solid #fff;
                box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
                margin: 0 auto 10rpx;
                transition: all $transition-duration;
                
                &.reached {
                  background-color: $primary-color;
                  box-shadow: 0 2rpx 10rpx rgba($primary-color, 0.3);
                }
              }
              
              .milestone-label {
                font-size: 22rpx;
                color: $text-lighter;
                text-align: center;
                display: block;
                white-space: nowrap;
              }
            }
            
            .progress-fill {
              height: 100%;
              border-radius: 6rpx;
              background: linear-gradient(to right, $primary-color, $primary-light);
              position: relative;
              transition: width 0.5s ease-out;
              
              &::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                  90deg,
                  rgba(255,255,255,0) 0%,
                  rgba(255,255,255,0.5) 50%,
                  rgba(255,255,255,0) 100%
                );
                background-size: 200% 100%;
                animation: shimmer 2s infinite;
                border-radius: 6rpx;
              }
            }
          }
        }
        
        // Recommendations section
        .recommendations {
          .recommendation-title {
            font-size: 28rpx;
            color: $text-color;
            margin-bottom: 20rpx;
            display: block;
          }
          
          .recommendation-scroll {
            white-space: nowrap;
            
            .recommendation-item {
              display: inline-block;
              width: 200rpx;
              margin-right: 20rpx;
              background-color: #f9f9f9;
              border-radius: $border-radius-md;
              overflow: hidden;
              box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
              transition: transform $transition-duration;
              
              &:active {
                transform: scale(0.98);
              }
              
              .recommendation-image {
                width: 200rpx;
                height: 150rpx;
                background-color: #f0f0f0;
              }
              
              .recommendation-info {
                padding: 15rpx;
                
                .recommendation-name {
                  font-size: 28rpx;
                  color: $text-color;
                  font-weight: bold;
                  margin-bottom: 5rpx;
                  display: block;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                
                .recommendation-pinyin {
                  font-size: 22rpx;
                  color: $text-light;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
              }
            }
          }
        }
      }
    }
    
    // Search card
    .search-card {
      background-color: $card-background;
      border-radius: 50rpx;
      padding: 20rpx 30rpx;
      margin-bottom: 30rpx;
      box-shadow: $box-shadow;
      display: flex;
      align-items: center;
      transition: all $transition-duration;
      
      &:active {
        transform: scale(0.98);
        background-color: #f9f9f9;
      }
      
      .search-icon {
        font-family: "iconfont";
        font-size: 36rpx;
        color: $text-lighter;
        margin-right: 15rpx;
      }
      
      .search-placeholder {
        font-size: 28rpx;
        color: $text-lighter;
      }
    }
    
    // Navigation buttons
    .nav-buttons {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40rpx;
      
      .nav-button {
        flex: 1;
        margin: 0 10rpx;
        background-color: $card-background;
        border-radius: $border-radius-lg;
        padding: 25rpx 20rpx;
        box-shadow: $box-shadow;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: all $transition-duration;
        
        &:active {
          transform: translateY(3rpx);
        }
        
        .button-icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 40rpx;
          margin-bottom: 15rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          
          .icon-text {
            font-family: "iconfont";
            font-size: 40rpx;
          }
        }
        
        .button-text {
          font-size: 26rpx;
          font-weight: bold;
        }
        
        &.study-button {
          .button-icon {
            background-color: rgba(60, 137, 153, 0.1);
            
            .icon-text {
              color: $primary-color;
            }
          }
          
          .button-text {
            color: $primary-color;
          }
        }
        
        &.practice-button {
          .button-icon {
            background-color: rgba(255, 155, 80, 0.1);
            
            .icon-text {
              color: $accent-color;
            }
          }
          
          .button-text {
            color: $accent-color;
          }
        }
        
        &.recognition-button {
          .button-icon {
            background-color: rgba(24, 144, 255, 0.1);
            
            .icon-text {
              color: #1890ff;
            }
          }
          
          .button-text {
            color: #1890ff;
          }
        }
      }
    }
  }
}
</style>