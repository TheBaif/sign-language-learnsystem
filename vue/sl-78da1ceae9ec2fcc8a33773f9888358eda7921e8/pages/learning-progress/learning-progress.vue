<template>
  <view class="dashboard-container">
    <!-- 页面标题 -->
    <view class="dashboard-header">
      <view class="back-button" @tap="navigateBack">
        <text class="iconfont">&#xe679;</text>
      </view>
      <view class="page-title">学习进度</view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-section">
      <view class="loader"></view>
      <text>加载中...</text>
    </view>
    
    <!-- 进度概览卡片 -->
    <view v-else class="progress-overview">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ progressData.totalSigns || 0 }}</text>
          <text class="stat-label">已学习</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ progressData.masteredSigns || 0 }}</text>
          <text class="stat-label">已掌握</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ formatTime(progressData.totalLearningTimeMinutes) }}</text>
          <text class="stat-label">学习时长</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ formatProficiency(progressData.averageProficiency) }}</text>
          <text class="stat-label">平均熟练度</text>
        </view>
      </view>
      
      <!-- 进度条 -->
      <view class="progress-bar-section">
        <view class="progress-label">
          <text>学习进度</text>
          <text>{{ calculateProgressPercentage() }}%</text>
        </view>
        <view class="progress-bar-bg">
          <view 
            class="progress-bar-fill"
            :style="{ width: calculateProgressPercentage() + '%' }"
          ></view>
        </view>
      </view>
    </view>
    
    <!-- 学习时间统计 -->
    <view v-if="!loading" class="learning-timeline">
      <view class="section-header">
        <text class="section-title">学习频率</text>
      </view>
      <view class="timeline-chart">
        <!-- 学习频率图表 -->
        <view class="daily-activity">
          <view 
            v-for="(day, index) in activityData" 
            :key="index"
            class="day-column"
          >
            <view 
              class="activity-bar"
              :style="{ height: day.height + '%' }"
              :class="getActivityClass(day.value)"
            ></view>
            <text class="day-label">{{ day.label }}</text>
          </view>
        </view>
        <text class="chart-note">最近7天学习情况</text>
      </view>
    </view>
    
    <!-- 技能掌握热图 -->
    <view v-if="!loading" class="skill-heatmap">
      <view class="section-header">
        <text class="section-title">技能掌握度</text>
      </view>
      <view class="heatmap-chart">
        <!-- 技能掌握热图 -->
        <view class="heatmap-container">
          <view 
            v-for="(category, index) in skillCategories" 
            :key="index"
            class="heatmap-category"
          >
            <text class="category-name">{{ category.name }}</text>
            <view class="heatmap-cells">
              <view 
                v-for="(level, levelIndex) in 5" 
                :key="levelIndex"
                class="heatmap-cell"
                :class="getCellClass(category.proficiency, level)"
              ></view>
            </view>
          </view>
        </view>
        
        <view class="heatmap-legend">
          <view class="legend-item">
            <view class="legend-cell level-1"></view>
            <text>入门</text>
          </view>
          <view class="legend-item">
            <view class="legend-cell level-3"></view>
            <text>熟悉</text>
          </view>
          <view class="legend-item">
            <view class="legend-cell level-5"></view>
            <text>精通</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 继续学习建议 -->
    <view v-if="!loading && progressData.recommendedNextSigns" class="continue-learning">
      <view class="section-header">
        <text class="section-title">学习建议</text>
      </view>
      <view class="recommendation-list">
        <view 
          v-for="(item, index) in progressData.recommendedNextSigns" 
          :key="index"
          class="recommendation-item"
          @tap="goToSignDetail(item)"
        >
          <image 
            :src="item.imageSrc || '/static/images/default-sign.png'" 
            class="recommendation-image" 
            mode="aspectFill"
          ></image>
          <view class="recommendation-info">
            <text class="recommendation-name">{{ item.name }}</text>
            <text class="recommendation-pinyin">{{ item.pinyin }}</text>
          </view>
          <view class="start-btn">
            <text>开始</text>
          </view>
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
      loading: true,
      progressData: {
        totalSigns: 0,
        masteredSigns: 0,
        averageProficiency: 0,
        totalLearningTimeMinutes: 0,
        recommendedNextSigns: []
      },
      // 模拟的学习活动数据
      activityData: [
        { label: '一', value: 2, height: 40 },
        { label: '二', value: 0, height: 0 },
        { label: '三', value: 1, height: 20 },
        { label: '四', value: 3, height: 60 },
        { label: '五', value: 4, height: 80 },
        { label: '六', value: 2, height: 40 },
        { label: '日', value: 1, height: 20 }
      ],
      // 模拟数据，实际应从API获取
      skillCategories: [
        { name: '日常用语', proficiency: 4.5 },
        { name: '数字', proficiency: 3.8 },
        { name: '颜色', proficiency: 2.5 },
        { name: '情感', proficiency: 1.2 },
        { name: '家庭', proficiency: 3.2 }
      ]
    }
  },
  
  onLoad() {
    this.checkLogin()
  },
  
  methods: {
    checkLogin() {
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
      
      this.loadProgressData()
    },
    
    async loadProgressData() {
      this.loading = true
      
      try {
        const res = await http.get('/learning/progress')
        
        if (res.data.code === 0) {
          this.progressData = res.data.data
        } else {
          uni.showToast({
            title: '获取进度数据失败',
            icon: 'none'
          })
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
        this.loading = false
      }
    },
    
    navigateBack() {
      uni.navigateBack()
    },
    
    formatTime(minutes) {
      if (!minutes) return '0h'
      
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      
      if (hours > 0) {
        return `${hours}h ${mins}m`
      }
      
      return `${mins}m`
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
    
    getCellClass(proficiency, level) {
      const normalizedLevel = proficiency / 5 * 5
      if (normalizedLevel >= level) {
        return `level-${level}`
      }
      return 'level-empty'
    },
    
    getActivityClass(value) {
      if (value === 0) return 'activity-none'
      if (value <= 1) return 'activity-low'
      if (value <= 3) return 'activity-medium'
      return 'activity-high'
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
    }
  }
}
</script>

<style lang="scss">
.dashboard-container {
  padding: 30rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
  
  .dashboard-header {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    background-color: #fff;
    padding: 20rpx;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .back-button {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(60, 137, 153, 0.1);
      border-radius: 30rpx;
      margin-right: 20rpx;
      
      .iconfont {
        font-size: 30rpx;
        color: #3C8999;
      }
    }
    
    .page-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      flex: 1;
    }
  }
  
  .loading-section {
    height: 300rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .loader {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(60, 137, 153, 0.2);
      border-top-color: #3C8999;
      animation: spin 1s infinite linear;
      margin-bottom: 20rpx;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    text {
      color: #999;
      font-size: 28rpx;
    }
  }
  
  .section-header {
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .progress-overview {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .stats-grid {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 30rpx;
      
      .stat-item {
        width: 50%;
        padding: 15rpx 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .stat-value {
          font-size: 40rpx;
          font-weight: bold;
          color: #3C8999;
          margin-bottom: 8rpx;
        }
        
        .stat-label {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
    
    .progress-bar-section {
      .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10rpx;
        
        text {
          font-size: 26rpx;
          color: #666;
        }
      }
      
      .progress-bar-bg {
        height: 20rpx;
        background-color: #f0f0f0;
        border-radius: 10rpx;
        overflow: hidden;
        
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(to right, #3C8999, #55a5b5);
          border-radius: 10rpx;
          transition: width 0.5s;
        }
      }
    }
  }
  
  .learning-timeline {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .timeline-chart {
      .daily-activity {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 200rpx;
        padding: 20rpx 0;
        
        .day-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 14%;
          
          .activity-bar {
            width: 40rpx;
            background-color: #d5f0f3;
            border-radius: 6rpx;
            transition: height 0.3s;
            
            &.activity-none {
              background-color: #f0f0f0;
            }
            
            &.activity-low {
              background-color: #d5f0f3;
            }
            
            &.activity-medium {
              background-color: #77c2cd;
            }
            
            &.activity-high {
              background-color: #3C8999;
            }
          }
          
          .day-label {
            font-size: 24rpx;
            color: #999;
            margin-top: 10rpx;
          }
        }
      }
      
      .chart-note {
        font-size: 24rpx;
        color: #999;
        text-align: center;
        margin-top: 20rpx;
        display: block;
      }
    }
  }
  
  .skill-heatmap {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .heatmap-chart {
      .heatmap-container {
        margin-bottom: 20rpx;
        
        .heatmap-category {
          display: flex;
          align-items: center;
          margin-bottom: 15rpx;
          
          .category-name {
            width: 150rpx;
            font-size: 26rpx;
            color: #666;
            margin-right: 20rpx;
          }
          
          .heatmap-cells {
            flex: 1;
            display: flex;
            gap: 6rpx;
            
            .heatmap-cell {
              flex: 1;
              height: 30rpx;
              border-radius: 4rpx;
              background-color: #f0f0f0;
              
              &.level-1 {
                background-color: #d5f0f3;
              }
              
              &.level-2 {
                background-color: #a6e1e8;
              }
              
              &.level-3 {
                background-color: #77c2cd;
              }
              
              &.level-4 {
                background-color: #55a5b5;
              }
              
              &.level-5 {
                background-color: #3C8999;
              }
            }
          }
        }
      }
      
      .heatmap-legend {
        display: flex;
        justify-content: center;
        gap: 30rpx;
        
        .legend-item {
          display: flex;
          align-items: center;
          
          .legend-cell {
            width: 24rpx;
            height: 24rpx;
            border-radius: 4rpx;
            margin-right: 8rpx;
            
            &.level-1 {
              background-color: #d5f0f3;
            }
            
            &.level-3 {
              background-color: #77c2cd;
            }
            
            &.level-5 {
              background-color: #3C8999;
            }
          }
          
          text {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
    }
  }
  
  .continue-learning {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .recommendation-list {
      .recommendation-item {
        display: flex;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:active {
          background-color: #f9f9f9;
        }
        
        .recommendation-image {
          width: 80rpx;
          height: 80rpx;
          border-radius: 10rpx;
          margin-right: 20rpx;
          object-fit: cover;
        }
        
        .recommendation-info {
          flex: 1;
          
          .recommendation-name {
            font-size: 30rpx;
            color: #333;
            font-weight: 500;
            margin-bottom: 6rpx;
            display: block;
          }
          
          .recommendation-pinyin {
            font-size: 24rpx;
            color: #999;
            display: block;
          }
        }
        
        .start-btn {
          background-color: #3C8999;
          border-radius: 30rpx;
          padding: 10rpx 30rpx;
          
          text {
            font-size: 26rpx;
            color: #fff;
          }
        }
      }
    }
  }
}
</style>