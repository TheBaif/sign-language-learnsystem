<template>
  <view class="container" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <view class="header">
      <image class="avatar" :src="userInfo.userPic || '/static/avatar.png'" @tap="navigateToUserProfile"/>
    </view>
    
    <view class="content" >
      <view class="welcome">
        <text>欢迎使用手语学习应用</text>
        <text class="tip">向上滑动搜索,点击下方按钮开始学习</text>
      </view>
      
      <view class="progress-wrapper">
        <view class="progress-header">
          <text class="title">学习进度</text>
          <text class="more" @tap="navigateToLearningProgress">查看详情 ></text>
        </view>
        
        <view v-if="loadingProgress" class="progress-loading">
          <view class="loader"/>
          <text>加载中...</text>
        </view>
        
        <view v-else class="progress-content">
          <view class="stats">
            <view class="stat-item">
              <text class="value">{{ progressData.totalSigns || 0 }}</text>
              <text class="label">已学习</text>
            </view>
            <view class="stat-item">
              <text class="value">{{ progressData.masteredSigns || 0 }}</text>
              <text class="label">已掌握</text>
            </view>
            <view class="stat-item">
              <text class="value">{{ formatProficiency(progressData.averageProficiency) }}</text>
              <text class="label">掌握度</text>
            </view>
          </view>
          
          <view class="bar-section">
            <view class="bar-label">
              <text>学习进度</text>
              <text>{{ calculateProgressPercentage() }}%</text>
            </view>
            <view class="bar-bg">
              <view 
                class="bar-fill"
                :style="{ width: calculateProgressPercentage() + '%' }"
              />
            </view>
          </view>
          
          <view v-if="progressData.recommendedNextSigns && progressData.recommendedNextSigns.length" class="recommend">
            <text class="recommend-title">推荐学习</text>
            <view class="recommend-items">
              <view 
                v-for="(item, index) in progressData.recommendedNextSigns.slice(0, 2)" 
                :key="index"
                class="recommend-item"
                @tap="goToSignDetail(item)"
              >
                <text class="name">{{ item.name }}</text>
                <text class="pinyin">{{ item.pinyin }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="nav">
      <button class="nav-btn study-btn" @tap="navigateToVocabulary">学习</button>
      <button class="nav-btn practice-btn" @tap="navigateToPractice">练习</button>
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
    
    checkLogin() {
      const token = uni.getStorageSync('token')
      console.log('当前token:', token)
      if (!token) {
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
    },
    
    async getUserInfo() {
      try {
        const token = uni.getStorageSync('token')
        if (!token) return
        
        const res = await http.get('/userInfo')
        if (res.data.code === 0) {
          this.userInfo = res.data.data
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },
    
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
    
    formatProficiency(proficiency) {
      if (!proficiency) return '0%'
      return Math.round(proficiency) + '%'
    },
    
    calculateProgressPercentage() {
      if (!this.progressData.totalSigns || this.progressData.totalSigns === 0) return 0
      
      // 假设总目标是100个手语
      const totalTarget = 100
      const progress = Math.min(100, Math.round((this.progressData.totalSigns / totalTarget) * 100))
      
      return progress
    },
    
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
    
    async recordLearning(signId) {
      try {
        await http.post('/learning/record', {
          signId: signId
        })
      } catch (error) {
        console.error('记录学习行为失败:', error)
      }
    },
    
    navigateToUserProfile() {
      uni.navigateTo({
        url: '/pages/user/user'
      })
    },
    
    handleAvatar() {
      uni.showActionSheet({
        itemList: ['退出登录'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.handleLogout()
          }
        }
      })
    },
    
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }
        }
      })
    },
    
    handleTouchStart(e) {
      this.touchStartY = e.touches[0].clientY
    },
    
    handleTouchEnd(e) {
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchEndY - this.touchStartY
      
      if (deltaY > this.minVerticalSwipe && 
          Math.abs(deltaY) > this.swipeThreshold) {
        this.navigateToSearch()
      }
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
    
    navigateToPractice() {
      uni.navigateTo({
        url: '/pages/practice/practice'
      });
    }
  }
}
</script>

<style lang="scss">
// 把一些通用的样式属性定义为变量
$primary-color: #3c8999;
$light-color: #f8f8f8;
$text-color: #333;
$disabled-color: #ccc;
$border-radius: 16rpx;
$box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

.container {
  height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    justify-content: flex-end;
    align-items: center;   
    padding: 30rpx;
    background-color: $light-color;
    box-shadow: $box-shadow;
    
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      border: 2rpx solid #ddd; 
    }
  }

  .content {
    flex: 1;
    padding: 30rpx;
    overflow-y: auto;
    
    .welcome {
      text-align: center;
      margin-bottom: 40rpx;
      
      text {
        display: block;
        color: $text-color;
        
        &:first-child {  
          font-size: 36rpx;
          margin-bottom: 20rpx;
        }
        
        &.tip {
          font-size: 26rpx;
          color: #999;  
        }
      }
    }
    
    .progress-wrapper {
      padding: 30rpx;
      background-color: #fff;
      border-radius: $border-radius;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .title {
          font-size: 32rpx;
          font-weight: bold;
        }
        
        .more {
          font-size: 26rpx;
          color: $primary-color;
        }
      }

      .progress-loading {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 150rpx;

        .loader {
          width: 40rpx;
          height: 40rpx;
          margin-bottom: 15rpx; 
          border-radius: 50%;
          border: 4rpx solid rgba($primary-color, 0.2);
          border-top-color: $primary-color;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }  
        }
        
        text {
          font-size: 26rpx;
          color: #999;
        }
      }

      .progress-content {
        .stats {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30rpx;

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;  

            .value {
              margin-bottom: 8rpx; 
              font-size: 36rpx;
              font-weight: bold;
              color: $primary-color; 
            }

            .label {
              font-size: 24rpx;
              color: #999;
            }
          }
        }

        .bar-section {
          margin-bottom: 30rpx;

          .bar-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10rpx;
            font-size: 26rpx;
            color: #666;
          }

          .bar-bg {
            height: 16rpx;
            background-color: #f0f0f0;
            border-radius: 8rpx;
            overflow: hidden;

            .bar-fill {
              height: 100%;
              background: linear-gradient(to right, $primary-color, #55a5b5);
              border-radius: 8rpx;
              transition: width 0.5s;
            }
          }
        }

        .recommend {
          .recommend-title {
            margin-bottom: 15rpx;
            font-size: 28rpx;
            color: #666;
          }

          .recommend-items {
            display: flex;
            gap: 20rpx;

            .recommend-item {
              flex: 1;
              padding: 15rpx 20rpx;
              background-color: rgba($primary-color, 0.1);
              border-radius: 12rpx;
              
              &:active {
                background-color: rgba($primary-color, 0.2);
              }

              .name {
                margin-bottom: 6rpx;
                font-size: 30rpx;  
              }

              .pinyin {
                font-size: 24rpx;
                color: #999;
              }
            }
          }
        }
      }
    }
  }

  .nav {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 120rpx;
    padding: 0 20rpx;
    background: $light-color;
    box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.1);
    
    .nav-btn {
      display: flex;
      justify-content: center;
      align-items: center; 
      width: 250rpx;
      height: 80rpx;
      color: #fff;
      font-size: 32rpx; 
      background-color: $primary-color;
      border-radius: 40rpx;
      box-shadow: 0 4rpx 8rpx rgba($primary-color, 0.2);
      
      &::after {
        border: none;
      }
    }
  }
}  
</style>