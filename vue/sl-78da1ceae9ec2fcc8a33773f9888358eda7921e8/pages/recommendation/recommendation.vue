<template>
  <view class="recommendation-container">
    <view class="section-header">
      <text class="section-title">为您推荐</text>
      <text class="section-subtitle">基于您的学习进度定制</text>
    </view>
    
    <view class="recommendation-list">
      <view v-if="loading" class="loading">
        <view class="loader"></view>
        <text>正在加载推荐内容...</text>
      </view>
      
      <template v-else>
        <view 
          v-for="(item, index) in recommendations" 
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
            <view class="recommendation-tag" v-if="getRecommendationReason(item)">
              <text>{{ getRecommendationReason(item) }}</text>
            </view>
          </view>
        </view>
      </template>
      
      <view v-if="!loading && recommendations.length === 0" class="empty-state">
        <text>暂无推荐内容</text>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'
import detailHelper from '@/utils/detailHelper.js'
export default {
  data() {
    return {
      loading: true,
      recommendations: []
    }
  },
  
  mounted() {
    this.loadRecommendations()
  },
  
  methods: {
    async loadRecommendations() {
      this.loading = true;
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          });
          
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/login'
            });
          }, 1500);
          
          return;
        }
        
        const res = await http.get('/learning/recommendations', {
          params: { limit: 5 },
          header: {
            'Authorization': token
          }
        });
        
        console.log('推荐API响应:', res);
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.recommendations = res.data.data || [];
          
          // If API returned empty results, don't fall back to mock data
          // This lets the user know they need more learning history
          if (this.recommendations.length === 0) {
            console.log('API没有返回推荐内容');
          }
        } else {
          throw new Error(res.data.message || '获取推荐失败');
        }
      } catch (error) {
        console.error('加载推荐内容失败:', error);
        uni.showToast({
          title: '获取推荐失败: ' + (error.message || '未知错误'),
          icon: 'none'
        });
        
        // Don't use mock data, show the error to encourage fixing the API issues
        this.recommendations = [];
      } finally {
        this.loading = false;
      }
    },
    
   goToSignDetail(sign) {
     // 记录学习行为
     this.recordLearning(sign.id);
     
     // 直接跳转到详情页
     uni.navigateTo({
       url: `/pages/detail/detail?id=${sign.id}`
     });
   },
    
    async recordLearning(signId) {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          console.error('未登录，无法记录学习活动');
          return;
        }
        
        console.log(`从推荐页记录学习活动: 手语ID ${signId}`);
        
        const res = await http.post('/learning/record', {
          signId: signId
        }, {
          header: {
            'Authorization': token,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (res.statusCode === 200 && res.data.code === 0) {
          console.log('学习记录已保存');
        } else {
          console.error('保存学习记录失败:', res.data.message || '未知错误');
          
          // Show error to user
          uni.showToast({
            title: '记录学习失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('记录学习活动失败:', error);
        
        // Show meaningful error to user
        uni.showToast({
          title: '记录学习失败: ' + (error.message || '网络错误'),
          icon: 'none'
        });
      }
    },
    
    getRecommendationReason(item) {
      // 根据不同标准提供推荐理由
      if (item.difficulty === 'BEGINNER') {
        return '入门级别'
      } else if (item.difficulty === 'INTERMEDIATE') {
        return '提升难度'
      } else if (item.difficulty === 'ADVANCED') {
        return '挑战自我'
      } else if (item.category === 'HIGH_FREQUENCY') {
        return '高频使用'
      }
      return '适合您的水平'
    }
  }
}
</script>

<style lang="scss">
.recommendation-container {
  padding: 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .section-header {
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      display: block;
    }
    
    .section-subtitle {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
      display: block;
    }
  }
  
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
        width: 100rpx;
        height: 100rpx;
        border-radius: 10rpx;
        margin-right: 20rpx;
        object-fit: cover;
      }
      
      .recommendation-info {
        flex: 1;
        
        .recommendation-name {
          font-size: 32rpx;
          color: #333;
          font-weight: 500;
          margin-bottom: 6rpx;
          display: block;
        }
        
        .recommendation-pinyin {
          font-size: 24rpx;
          color: #999;
          margin-bottom: 10rpx;
          display: block;
        }
        
        .recommendation-tag {
          display: inline-block;
          background-color: rgba(60, 137, 153, 0.1);
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          
          text {
            font-size: 22rpx;
            color: #3C8999;
          }
        }
      }
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40rpx 0;
      
      .loader {
        width: 40rpx;
        height: 40rpx;
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
        font-size: 26rpx;
        color: #999;
      }
    }
    
    .empty-state {
      padding: 40rpx 0;
      text-align: center;
      
      text {
        font-size: 26rpx;
        color: #999;
      }
    }
  }
}
</style>