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
.detail-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 40rpx;
  
  .detail-scroll {
    height: 100vh;
  }
  
  .detail-item {
    margin: 30rpx;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
    background-color: #fff;
    
    .header {
      padding: 40rpx 30rpx;
      border-bottom: 1px solid #f0f0f0;
      position: relative;
      background: linear-gradient(to right, #f6f6f6, #ffffff);
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 60%;
        background-color: #3C8999;
        border-radius: 0 4rpx 4rpx 0;
      }
      
      .title {
        font-size: 42rpx;
        color: #333;
        font-weight: bold;
        margin-bottom: 15rpx;
        display: block;
      }
      
      .pinyin {
        font-size: 32rpx;
        color: #666;
        display: block;
        font-style: italic;
      }
    }
    
    .content {
      padding: 30rpx;
      
      .gesture-section {
        margin-bottom: 40rpx;
        
        .section-title {
          font-size: 34rpx;
          color: #333;
          font-weight: bold;
          margin-bottom: 20rpx;
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
            height: 32rpx;
            background-color: #3C8999;
            border-radius: 5rpx;
          }
        }
        
        .gesture-steps {
          background-color: #f9f9f9;
          border-radius: 12rpx;
          padding: 20rpx;
          
          .step {
            font-size: 30rpx;
            color: #444;
            line-height: 1.6;
            padding: 15rpx 10rpx;
            display: flex;
            align-items: center;
            
            &:not(:last-child) {
              border-bottom: 1px dashed #e0e0e0;
            }
            
            &::before {
              content: '•';
              margin-right: 15rpx;
              color: #3C8999;
              font-size: 36rpx;
            }
          }
        }
      }
      
      .media-content {
        .sign-image {
          width: 100%;
          height: 500rpx;
          margin-bottom: 30rpx;
          border-radius: 12rpx;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
          background-color: #f5f5f5;
          transition: all 0.3s ease;
          
          &:active {
            transform: scale(0.98);
          }
        }
        
        .sign-video {
          width: 100%;
          height: 500rpx;
          margin-bottom: 20rpx;
          border-radius: 12rpx;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
  
  .loading-section {
    height: 400rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    margin: 30rpx;
    border-radius: 16rpx;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
    
    .loader {
      width: 70rpx;
      height: 70rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(60, 137, 153, 0.2);
      border-top-color: #3C8999;
      animation: spin 1s infinite linear;
      margin-bottom: 30rpx;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    text {
      color: #999;
      font-size: 30rpx;
    }
  }
  
  .error-section {
    height: 400rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    margin: 30rpx;
    border-radius: 16rpx;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
    
    text {
      color: #ff6b6b;
      font-size: 30rpx;
      margin-bottom: 30rpx;
    }
    
    .retry-btn {
      padding: 15rpx 40rpx;
      background-color: #3C8999;
      color: #fff;
      font-size: 28rpx;
      border-radius: 40rpx;
      box-shadow: 0 4rpx 10rpx rgba(60, 137, 153, 0.3);
    }
  }
  
  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    padding: 30rpx;
    
    .nav-button {
      padding: 20rpx 40rpx;
      background-color: #3C8999;
      color: #fff;
      font-size: 28rpx;
      border-radius: 40rpx;
      box-shadow: 0 4rpx 10rpx rgba(60, 137, 153, 0.3);
      
      &:active {
        transform: scale(0.98);
      }
      
      &.disabled {
        background-color: #cccccc;
        box-shadow: none;
      }
    }
  }
  
  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    margin-bottom: 30rpx;
    
    text {
      color: #999;
      font-size: 28rpx;
    }
  }
}
</style>