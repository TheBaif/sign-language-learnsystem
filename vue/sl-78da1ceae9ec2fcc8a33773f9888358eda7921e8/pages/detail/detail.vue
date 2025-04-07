<template>
  <view class="detail-container">
    <scroll-view scroll-y class="detail-scroll">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-section">
        <view class="loader"></view>
        <text>加载中...</text>
      </view>
      
      <!-- 错误状态 -->
      <view v-else-if="error" class="error-section">
        <text>{{ errorMessage || '加载失败' }}</text>
        <view class="retry-btn" @tap="fetchSignDetail">重试</view>
      </view>
      
      <!-- 内容显示 -->
      <view v-else class="detail-item">
        <view class="header">
          <text class="title">{{ searchResult.name || '未命名手语' }}</text>
          <text class="pinyin">{{ searchResult.pinyin || '' }}</text>
        </view>
        
        <view class="content">
          <!-- 手势说明部分 -->
          <view class="gesture-section" v-if="gestureSteps && gestureSteps.length">
            <text class="section-title">手势说明</text>
            <view class="gesture-steps">
              <text 
                v-for="(step, index) in gestureSteps" 
                :key="index" 
                class="step"
              >{{ step }}</text>
            </view>
          </view>
          <view v-else class="empty-state">
            <text>暂无手势说明</text>
          </view>
          
          <!-- 媒体内容部分 -->
          <view class="media-content">
            <!-- 图片展示 -->
            <image 
              v-if="searchResult.imageSrc" 
              :src="searchResult.imageSrc" 
              mode="aspectFit" 
              class="sign-image"
              @tap="previewImage(searchResult.imageSrc)"
              @error="handleImageError"
            ></image>
            <view v-else class="empty-state">
              <text>暂无图片</text>
            </view>
            
            <!-- 视频展示 -->
            <video 
              v-if="searchResult.wordVideoSrc" 
              :src="searchResult.wordVideoSrc"
              class="sign-video"
              :controls="true"
              :show-play-btn="true"
              :enable-play-gesture="true"
              :show-fullscreen-btn="true"
              :object-fit="'cover'"
              :initial-time="0"
              @error="handleVideoError"
            ></video>
            <view v-else class="empty-state">
              <text>暂无视频</text>
            </view>
          </view>
        </view>
      </view>
      
    </scroll-view>
  </view>
</template>
<script>
import http from '@/utils/request.js'
import detailHelper from '@/utils/detailHelper.js'
export default {
  data() {
    return {
      signId: null,
            searchResult: {},
            loading: true,
            error: false,
            errorMessage: ''
  }
  },
  
  computed: {
      gestureSteps() {
        if (!this.searchResult.gesture) return [];
        return this.searchResult.gesture.split('|||').map(step => step.trim());
      }
    },
  
  onLoad(options) {
    console.log('详情页收到参数:', options);
      
      // 方式1: 通过ID参数获取
      if (options.id && options.id !== 'null' && options.id !== 'undefined') {
        this.signId = options.id;
        this.fetchSignDetail();
        return;
      }
      
      // 方式2: 通过索引获取本地存储数据
      if (options.index) {
        const results = uni.getStorageSync('searchResults');
        if (results && results[parseInt(options.index)]) {
          this.searchResult = results[parseInt(options.index)];
          this.loading = false;
          return;
        }
      }
      
      // 两种方式都失败
      this.error = true;
      this.errorMessage = '参数错误，无法获取手语详情';
      this.loading = false;
      
      uni.showToast({
        title: '参数错误，无法获取详情',
        icon: 'none'
      });
  },
  
  methods: {
    navigateBack() {
      uni.navigateBack()
    },
    
    loadSignDetail(index) {
      const results = uni.getStorageSync('searchResults')
      if (results && index !== undefined) {
        this.signData = results[parseInt(index)]
        // Record this view for learning tracking
        this.recordLearningActivity()
      } else {
        uni.showToast({
          title: '加载详情失败',
          icon: 'none'
        })
      }
    },
    
    async recordLearningActivity() {
      if (!this.signData || !this.signData.id) return
      
      try {
        await http.post('/learning/record', {
          signId: this.signData.id
        })
        console.log('学习记录已保存')
      } catch (error) {
        console.error('保存学习记录失败:', error)
      }
    },
	async recordDetailedView(signId) {
	  try {
	    const token = uni.getStorageSync('token');
	    if (!token) {
	      console.error('未登录，无法记录学习活动');
	      return;
	    }
	    
	    console.log(`记录详细学习: 手语ID ${signId}`);
	    
	    // This viewing is more intensive learning than just list view
	    // We can consider it more valuable by sending an extended viewing parameter
	    const res = await http.post('/learning/record', {
	      signId: signId,
	      // Using extended time parameter to indicate deeper learning
	      extendedView: true
	    }, {
	      header: {
	        'Authorization': token,
	        'Content-Type': 'application/x-www-form-urlencoded'
	      }
	    });
	    
	    if (res.statusCode === 200 && res.data.code === 0) {
	      console.log('详细学习记录已保存');
	    } else {
	      console.error('保存详细学习记录失败:', res.data.message);
	    }
	  } catch (error) {
	    console.error('记录详细学习活动失败:', error);
	  }
	},
	async fetchSignDetail() {
	    try {
	      this.loading = true;
	      
	      const res = await uni.request({
	        url: `http://localhost:8080/sign/detail/${this.signId}`,
	        method: 'GET',
	        header: {
	          'Authorization': uni.getStorageSync('token')
	        }
	      });
	      
	      if (res[1].statusCode === 200 && res[1].data.code === 0) {
	        this.searchResult = res[1].data.data;
	      } else {
	        throw new Error(res[1].data?.message || '获取详情失败');
	      }
	    } catch (error) {
	      console.error('获取手语详情失败:', error);
	      this.error = true;
	      this.errorMessage = error.message || '获取详情失败';
	    } finally {
	      this.loading = false;
	    }
	  },
    
    async getRelatedSigns() {
      // Mock related signs - in a real app, this would come from an API
      this.relatedSigns = [
        { id: 1, name: '你好', imageSrc: '/static/signs/hello.png' },
        { id: 2, name: '谢谢', imageSrc: '/static/signs/thanks.png' },
        { id: 3, name: '再见', imageSrc: '/static/signs/goodbye.png' },
        { id: 4, name: '朋友', imageSrc: '/static/signs/friend.png' }
      ]
    },
	debugDetailData() {
	    console.group('详情页数据调试');
	    console.log('当前详情数据:', this.searchResult);
	    console.log('图片URL:', this.searchResult.imageSrc);
	    console.log('视频URL:', this.searchResult.wordVideoSrc);
	    console.log('手势说明:', this.gestureSteps);
	    console.log('错误信息:', this.errorInfo);
	    console.groupEnd();
	    
	    // 显示调试信息
	    uni.showModal({
	      title: '调试信息',
	      content: `ID: ${this.searchResult.id}\n`+
	               `图片: ${this.searchResult.imageSrc ? '有' : '无'}\n`+
	               `视频: ${this.searchResult.wordVideoSrc ? '有' : '无'}\n`+
	               `手势: ${this.gestureSteps && this.gestureSteps.length ? '有' : '无'}`,
	      showCancel: false
	    });
	  },
    
      
     previewImage(url) {
           if (!url) return;
           uni.previewImage({
             urls: [url],
             current: url
           });
         }
       },
    
    toggleFavorite() {
      this.isFavorite = !this.isFavorite
      uni.showToast({
        title: this.isFavorite ? '已添加到收藏' : '已取消收藏',
        icon: 'none'
      })
    },
    
    viewRelatedSign(sign) {
      const results = [sign]
      uni.setStorageSync('searchResults', results)
      uni.redirectTo({
        url: `/pages/detail/detail?index=0`
      })
    },
    
    startPractice() {
      uni.navigateTo({
        url: '/pages/practice/practice'
      })
    },
    
    getDifficultyText(difficulty) {
      const difficultyMap = {
        'BEGINNER': '初级',
        'INTERMEDIATE': '中级',
        'ADVANCED': '高级'
      }
      return difficultyMap[difficulty] || '未知'
    }
  }

</script>

<style lang="scss">
// Variables
$primary-color: #3C8999;
$primary-light: #55a5b5;
$primary-dark: #2a6b78;
$accent-color: #FF9B50;
$text-color: #333;
$text-light: #666;
$text-lighter: #999;
$background-color: #f8f8f8;
$card-background: #ffffff;
$border-radius-sm: 10rpx;
$border-radius-md: 20rpx;
$border-radius-lg: 30rpx;
$box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
$transition-duration: 0.3s;

// Animations
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(40rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.detail-container {
  min-height: 100vh;
  background-color: $background-color;
  position: relative;
  
  .detail-scroll {
    height: 100vh;
  }
  
  // Enhanced Detail Item Card
  .detail-item {
    margin: 30rpx;
    border-radius: $border-radius-lg;
    overflow: hidden;
    box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
    background-color: $card-background;
    position: relative;
    animation: fadeIn 0.5s ease-out;
    
    // Enhanced Header
    .header {
      padding: 40rpx 30rpx;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
      background: linear-gradient(to right, #f9f9f9, $card-background);
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 60%;
        background: linear-gradient(to bottom, $primary-color, $primary-light);
        border-radius: 0 4rpx 4rpx 0;
      }
      
      .title {
        font-size: 42rpx;
        color: $text-color;
        font-weight: bold;
        margin-bottom: 15rpx;
        display: block;
        padding-left: 25rpx;
        letter-spacing: 1rpx;
      }
      
      .pinyin {
        font-size: 32rpx;
        color: $text-light;
        display: block;
        font-style: italic;
        padding-left: 25rpx;
      }
    }
    
    // Enhanced Content Section
    .content {
      padding: 40rpx 30rpx;
      
      // Gesture Section
      .gesture-section {
        margin-bottom: 50rpx;
        animation: slideInUp 0.6s ease-out;
        
        .section-title {
          font-size: 36rpx;
          color: $text-color;
          font-weight: bold;
          margin-bottom: 25rpx;
          display: block;
          position: relative;
          padding-left: 24rpx;
          
          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 10rpx;
            height: 36rpx;
            background-color: $primary-color;
            border-radius: 5rpx;
          }
        }
        
        .gesture-steps {
          background-color: #f9f9f9;
          border-radius: $border-radius-lg;
          padding: 25rpx;
          box-shadow: inset 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
          
          .step {
            font-size: 32rpx;
            color: $text-color;
            line-height: 1.6;
            padding: 20rpx 15rpx;
            display: flex;
            align-items: center;
            
            &:not(:last-child) {
              border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
            }
            
            &::before {
              content: '•';
              margin-right: 15rpx;
              color: $primary-color;
              font-size: 40rpx;
              font-weight: bold;
            }
          }
        }
      }
      
      // Media Content Section
      .media-content {
        animation: slideInUp 0.7s ease-out;
        
        // Enhanced Image Display
        .sign-image {
          width: 100%;
          height: 500rpx;
          margin-bottom: 40rpx;
          border-radius: $border-radius-lg;
          box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.12);
          background-color: #f5f5f5;
          transition: all 0.4s ease;
          object-fit: contain;
          overflow: hidden;
          position: relative;
          
          &:active {
            transform: scale(0.98);
            box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.08);
          }
          
          &::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.02),
              rgba(0, 0, 0, 0)
            );
            pointer-events: none;
          }
        }
        
        // Enhanced Video Display
        .sign-video {
          width: 100%;
          height: 520rpx;
          margin-bottom: 40rpx;
          border-radius: $border-radius-lg;
          box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.12);
          overflow: hidden;
          background-color: #000;
        }
      }
      
      // Category & Difficulty Info
      .metadata-section {
        margin-top: 40rpx;
        padding-top: 30rpx;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
        animation: slideInUp 0.8s ease-out;
        
        .metadata-item {
          flex: 1;
          min-width: 45%;
          background-color: #f9f9f9;
          padding: 20rpx;
          border-radius: $border-radius-md;
          
          .metadata-label {
            font-size: 24rpx;
            color: $text-lighter;
            margin-bottom: 8rpx;
            display: block;
          }
          
          .metadata-value {
            font-size: 28rpx;
            color: $text-color;
            font-weight: 500;
          }
          
          &.difficulty {
            .metadata-value {
              display: inline-block;
              padding: 4rpx 16rpx;
              border-radius: 20rpx;
              font-size: 26rpx;
              
              &.beginner {
                background-color: rgba(82, 196, 26, 0.1);
                color: #52c41a;
              }
              
              &.intermediate {
                background-color: rgba(250, 173, 20, 0.1);
                color: #faad14;
              }
              
              &.advanced {
                background-color: rgba(245, 34, 45, 0.1);
                color: #f5222d;
              }
            }
          }
        }
      }
    }
    
    // Related Signs Section
    .related-section {
      margin: 0 30rpx 40rpx;
      
      .related-title {
        font-size: 36rpx;
        color: $text-color;
        font-weight: bold;
        margin-bottom: 25rpx;
        display: block;
        position: relative;
        padding-left: 24rpx;
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 10rpx;
          height: 36rpx;
          background-color: $primary-color;
          border-radius: 5rpx;
        }
      }
      
      .related-list {
        display: flex;
        overflow-x: auto;
        padding: 10rpx 0 20rpx;
        margin: 0 -10rpx;
        
        &::-webkit-scrollbar {
          height: 6rpx;
        }
        
        &::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 3rpx;
        }
        
        .related-item {
          min-width: 200rpx;
          margin: 0 10rpx;
          background-color: #fff;
          border-radius: $border-radius-md;
          overflow: hidden;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
          transition: transform 0.3s;
          
          &:active {
            transform: scale(0.97);
          }
          
          .related-image {
            width: 200rpx;
            height: 150rpx;
            object-fit: cover;
          }
          
          .related-name {
            padding: 10rpx;
            font-size: 26rpx;
            color: $text-color;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
    
    // Action Buttons
    .action-buttons {
      display: flex;
      gap: 20rpx;
      padding: 0 30rpx 40rpx;
      
      .action-btn {
        flex: 1;
        height: 90rpx;
        line-height: 90rpx;
        text-align: center;
        border-radius: 45rpx;
        font-size: 30rpx;
        font-weight: bold;
        transition: all $transition-duration;
        
        &.practice-btn {
          background: linear-gradient(to right, $primary-color, $primary-light);
          color: #fff;
          box-shadow: 0 8rpx 16rpx rgba($primary-color, 0.3);
          
          &:active {
            transform: scale(0.98);
            box-shadow: 0 4rpx 8rpx rgba($primary-color, 0.2);
          }
        }
        
        &.favorite-btn {
          background-color: #f0f0f0;
          color: $text-color;
          
          &:active {
            background-color: #e6e6e6;
          }
          
          &.active {
            background-color: rgba(255, 155, 80, 0.1);
            color: $accent-color;
          }
        }
      }
    }
  }
  
  // Navigation Buttons
  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    padding: 30rpx;
    
    .nav-button {
      padding: 20rpx 40rpx;
      background-color: $primary-color;
      color: #fff;
      font-size: 28rpx;
      border-radius: 40rpx;
      box-shadow: 0 4rpx 10rpx rgba($primary-color, 0.3);
      
      &:active {
        transform: scale(0.98);
        box-shadow: 0 2rpx 5rpx rgba($primary-color, 0.2);
      }
      
      &.disabled {
        background-color: #cccccc;
        box-shadow: none;
      }
    }
  }
  
  // Empty State
  .empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 200rpx;
    background-color: #f5f5f5;
    border-radius: $border-radius-lg;
    margin-bottom: 30rpx;
    
    text {
      color: $text-lighter;
      font-size: 28rpx;
    }
  }
  
  // Loading & Error States
  .loading-section, .error-section {
    height: 400rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    margin: 30rpx;
    border-radius: $border-radius-lg;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
    
    .loader {
      width: 70rpx;
      height: 70rpx;
      border-radius: 50%;
      border: 4rpx solid rgba($primary-color, 0.1);
      border-top-color: $primary-color;
      animation: spin 1s infinite linear;
      margin-bottom: 30rpx;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    text {
      color: $text-lighter;
      font-size: 30rpx;
    }
  }
  
  .error-section {
    text {
      color: #ff6b6b;
    }
    
    .retry-btn {
      margin-top: 30rpx;
      padding: 15rpx 40rpx;
      background-color: $primary-color;
      color: #fff;
      font-size: 28rpx;
      border-radius: 40rpx;
      box-shadow: 0 4rpx 10rpx rgba($primary-color, 0.3);
    }
  }
  
  // Floating Action Button
  .floating-action-button {
    position: fixed;
    right: 30rpx;
    bottom: 50rpx;
    width: 110rpx;
    height: 110rpx;
    border-radius: 55rpx;
    background: linear-gradient(135deg, $primary-color, $primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 20rpx rgba($primary-color, 0.4);
    z-index: 100;
    animation: pulse 3s infinite ease-in-out;
    
    .fab-icon {
      font-size: 50rpx;
      color: #fff;
    }
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 10rpx rgba($primary-color, 0.3);
    }
  }
}

/* Mobile landscape and tablet adjustments */
@media screen and (min-width: 768px) {
  .detail-container {
    .detail-item {
      max-width: 960rpx;
      margin: 40rpx auto;
      
      .content {
        display: flex;
        flex-wrap: wrap;
        gap: 30rpx;
        
        .gesture-section {
          flex: 1;
          min-width: 45%;
        }
        
        .media-content {
          flex: 1;
          min-width: 45%;
        }
      }
    }
  }
}
</style>