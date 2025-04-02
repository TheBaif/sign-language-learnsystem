<template>
  <view 
    class="home_container"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <view class="home_top">
      <image class="avatar" :src="userInfo.userPic || '/static/avatar.png'" @tap="navigateToUserProfile"></image>
    </view>
    
    <!-- 主要内容区 -->
    <view class="main_content">
      <view class="welcome_text">
        <text>欢迎使用手语学习应用</text>
        <text class="tip_text">向上滑动搜索，点击下方按钮开始学习</text>
      </view>
      
      <!-- 学习进度概览 -->
      <view class="progress_overview">
        <view class="progress_header">
          <text class="progress_title">学习进度</text>
          <text class="view_more" @tap="navigateToLearningProgress">查看详情 ></text>
        </view>
        
        <view v-if="loadingProgress" class="progress_loading">
          <view class="loader"></view>
          <text>加载中...</text>
        </view>
        
        <view v-else class="progress_content">
          <view class="progress_stats">
            <view class="stat_item">
              <text class="stat_value">{{ progressData.totalSigns || 0 }}</text>
              <text class="stat_label">已学习</text>
            </view>
            <view class="stat_item">
              <text class="stat_value">{{ progressData.masteredSigns || 0 }}</text>
              <text class="stat_label">已掌握</text>
            </view>
            <view class="stat_item">
              <text class="stat_value">{{ formatProficiency(progressData.averageProficiency) }}</text>
              <text class="stat_label">掌握度</text>
            </view>
          </view>
          
          <!-- 进度条 -->
          <view class="progress_bar_section">
            <view class="progress_bar_label">
              <text>学习进度</text>
              <text>{{ calculateProgressPercentage() }}%</text>
            </view>
            <view class="progress_bar_bg">
              <view 
                class="progress_bar_fill"
                :style="{ width: calculateProgressPercentage() + '%' }"
              ></view>
            </view>
          </view>
          
          <!-- 学习建议 -->
          <view v-if="progressData.recommendedNextSigns && progressData.recommendedNextSigns.length > 0" class="recommended_section">
            <text class="recommended_title">推荐学习</text>
            <view class="recommended_items">
              <view 
                v-for="(item, index) in progressData.recommendedNextSigns.slice(0, 2)" 
                :key="index"
                class="recommended_item"
                @tap="goToSignDetail(item)"
              >
                <text class="item_name">{{ item.name }}</text>
                <text class="item_pinyin">{{ item.pinyin }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="navigation1">
      <button class="left_nav1_btn" @tap="navigateToVocabulary">学习</button>
      <button class="right_nav1_btn" @tap="navigateToPractice">练习</button>
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
.home_container {
  width: 100%;
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;

  .home_top {
    width: 100%;
    height: 150rpx;
    position: relative;
    background: #f8f8f8;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);

    .avatar {
      width: 100rpx;
      height: 100rpx;
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      border-radius: 50%;
      margin-right: 30rpx;
      border: 2rpx solid #ddd;
    }
  }

  .main_content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 30rpx;
    overflow-y: auto;
    
    .welcome_text {
      text-align: center;
      margin-bottom: 40rpx;
      
      text {
        font-size: 36rpx;
        color: #333;
        display: block;
        margin-bottom: 20rpx;
      }
      
      .tip_text {
        font-size: 26rpx;
        color: #999;
      }
    }
    
    .progress_overview {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 30rpx;
      margin-bottom: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      
      .progress_header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .progress_title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
        
        .view_more {
          font-size: 26rpx;
          color: #3C8999;
        }
      }
      
      .progress_loading {
        height: 150rpx;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        
        .loader {
          width: 40rpx;
          height: 40rpx;
          border-radius: 50%;
          border: 4rpx solid rgba(60, 137, 153, 0.2);
          border-top-color: #3C8999;
          animation: spin 1s infinite linear;
          margin-bottom: 15rpx;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        text {
          font-size: 26rpx;
          color: #999;
        }
      }
      
      .progress_content {
        .progress_stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30rpx;
          
          .stat_item {
            flex: 1;
            text-align: center;
            padding: 0 10rpx;
            
            .stat_value {
              font-size: 36rpx;
              font-weight: bold;
              color: #3C8999;
              display: block;
              margin-bottom: 8rpx;
            }
            
            .stat_label {
              font-size: 24rpx;
              color: #999;
            }
          }
        }
        
        .progress_bar_section {
          margin-bottom: 30rpx;
          
          .progress_bar_label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10rpx;
            
            text {
              font-size: 26rpx;
              color: #666;
            }
          }
          
          .progress_bar_bg {
            height: 16rpx;
            background-color: #f0f0f0;
            border-radius: 8rpx;
            overflow: hidden;
            
            .progress_bar_fill {
              height: 100%;
              background: linear-gradient(to right, #3C8999, #55a5b5);
              border-radius: 8rpx;
              transition: width 0.5s;
            }
          }
        }
        
        .recommended_section {
          .recommended_title {
            font-size: 28rpx;
            color: #666;
            margin-bottom: 15rpx;
            display: block;
          }
          
          .recommended_items {
            display: flex;
            flex-wrap: wrap;
            gap: 20rpx;
            
            .recommended_item {
              flex: 1;
              min-width: 45%;
              background-color: rgba(60, 137, 153, 0.1);
              padding: 15rpx 20rpx;
              border-radius: 12rpx;
              
              &:active {
                background-color: rgba(60, 137, 153, 0.2);
              }
              
              .item_name {
                font-size: 30rpx;
                color: #333;
                display: block;
                margin-bottom: 6rpx;
              }
              
              .item_pinyin {
                font-size: 24rpx;
                color: #999;
              }
            }
          }
        }
      }
    }
  }

  .navigation1 {
    display: flex;
    background: #f8f8f8;
    height: 120rpx;
    align-items: center;
    justify-content: space-around;
    padding: 0 20rpx;
    box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.1);

    .left_nav1_btn,
    .right_nav1_btn {
      background-color: #3C8999;
      width: 250rpx;
      height: 80rpx;
      padding: 0;
      white-space: nowrap;
      color: white;
      font-size: 32rpx;
      text-align: center;
      line-height: 80rpx;
      border-radius: 40rpx;
      box-shadow: 0 4rpx 8rpx rgba(60, 137, 153, 0.2);
    }
  }
}
</style>