<template>
  <view class="search-container">
    <!-- Stylized background elements -->
    <view class="background-elements">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
    </view>
    
    <!-- Header area with back button -->
    <view class="search-header">
      <view class="page-title">
        <text>手语搜索</text>
      </view>
    </view>
    
    <!-- Search input area -->
    <view class="search-input-wrapper">
      <view class="search-input-container">
        <input 
          class="search-input"
          type="text"
          v-model="keyword"
          placeholder="搜索手语词汇..."
          confirm-type="search"
          @confirm="handleSearch"
          @input="handleInput"
          :focus="true"
        />
        <view v-if="keyword" class="clear-icon" @tap="clearKeyword">
          <text>×</text>
        </view>
      </view>
      <view class="search-button" @tap="handleSearch" :class="{'active': !!keyword.trim()}">
        <text>搜索</text>
      </view>
    </view>
    
    <!-- Main content area -->
    <scroll-view scroll-y class="search-content">
      <!-- Loading indicator -->
      <view v-if="loading" class="loading-state">
        <view class="loader"></view>
        <text>正在搜索...</text>
      </view>
      
      <!-- Search Results -->
      <block v-else-if="hasSearched">
        <view v-if="searchResults.length > 0" class="results-container">
          <view class="results-header">
            <text class="results-title">搜索结果</text>
            <text class="results-count">找到 {{ searchResults.length }} 个结果</text>
          </view>
          
          <view class="results-list">
            <view 
              class="result-item"
              v-for="(item, index) in searchResults"
              :key="index"
              @tap="goToDetail(index)"
            >
              <image 
                :src="item.imageSrc || '/static/placeholder-sign.png'" 
                mode="aspectFill"
                class="result-image"
              ></image>
              
              <view class="result-content">
                <view class="result-title-row">
                  <text class="result-title">{{ item.name }}</text>
                  <view class="result-label" v-if="item.difficulty">
                    <text>{{ getDifficultyText(item.difficulty) }}</text>
                  </view>
                </view>
                <text class="result-pinyin">{{ item.pinyin || '无拼音' }}</text>
                <text class="result-category" v-if="item.parentName">
                  分类: {{ item.parentName }}{{ item.childName ? ' > ' + item.childName : '' }}
                </text>
              </view>
              
              <view class="result-arrow">
              </view>
            </view>
          </view>
        </view>
        
        <!-- Empty results state -->
        <view v-else class="empty-results">
          <image src="/static/empty-search.png" mode="aspectFit" class="empty-image"></image>
          <text class="empty-title">未找到相关结果</text>
          <text class="empty-subtitle">换个关键词试试吧</text>
        </view>
      </block>
      
      <!-- Search History -->
      <view v-else-if="!hasSearched && searchHistory.length > 0" class="history-container">
        <view class="history-header">
          <text class="history-title">搜索历史</text>
          <text class="clear-history" @tap="showClearHistoryConfirm">清空</text>
        </view>
        
        <view class="history-list">
          <view 
            class="history-item"
            v-for="(item, index) in searchHistory"
            :key="index"
            @tap="searchByHistory(item)"
          >
            <view class="history-item-content">
              <text class="history-text">{{ item }}</text>
            </view>
            <text class="delete-icon" @tap.stop="deleteHistoryItem(item)">×</text>
          </view>
        </view>
      </view>
      
      <!-- Empty history state -->
      <view v-else-if="!hasSearched && searchHistory.length === 0" class="empty-history">
        <image src="/static/empty-history.png" mode="aspectFit" class="empty-image"></image>
        <text class="empty-title">暂无搜索历史</text>
        <text class="empty-subtitle">搜索记录会保存在这里</text>
      </view>
    </scroll-view>
    
    <!-- Voice search button (future feature) -->
    <view class="voice-search-button" @tap="showVoiceSearchFeature">
      <text class="icon-mic">&#xe677;</text>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      keyword: '',
      loading: false,
      hasSearched: false,
      searchResults: [],
      searchHistory: [],
      searchTimer: null
    }
  },
  
  onLoad() {
    this.checkToken()
    this.loadSearchHistory()
  },
  
  methods: {
    navigateBack() {
      uni.navigateBack()
    },
    
    clearKeyword() {
      this.keyword = ''
      this.searchResults = []
      this.hasSearched = false
    },
    
    checkToken() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }, 1500)
      }
    },
    
    // 加载搜索历史
    async loadSearchHistory() {
      try {
        const res = await http.get('/user/search-history')
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.searchHistory = res.data.data || []
        } else {
          console.error('获取搜索历史失败:', res.data?.message || '未知错误')
        }
      } catch (error) {
        console.error('加载搜索历史出错:', error)
      }
    },
    
    // 保存搜索历史
    async saveSearchHistory() {
      if (!this.keyword || !this.keyword.trim()) return
      
      try {
        // 更新本地数组，确保去重并限制10条
        let updatedHistory = [...this.searchHistory]
        
        // 移除相同关键词
        updatedHistory = updatedHistory.filter(item => item !== this.keyword)
        
        // 将新关键词添加到前面
        updatedHistory.unshift(this.keyword)
        
        // 限制最多10条记录
        updatedHistory = updatedHistory.slice(0, 10)
        
        // 发送整个历史数组到后端
        const res = await http.post('/user/search-history', {
          history: updatedHistory
        })
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 更新本地数组
          this.searchHistory = updatedHistory
        } else {
          console.error('保存搜索历史失败:', res.data?.message || '未知错误')
          // 保存失败，从后端重新加载
          this.loadSearchHistory()
        }
      } catch (error) {
        console.error('保存搜索历史出错:', error)
        // 出错时重新加载
        this.loadSearchHistory()
      }
    },
    
    // 删除单个历史记录
    async deleteHistoryItem(keyword) {
      try {
        const res = await http.delete(`/user/search-history/${encodeURIComponent(keyword)}`)
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 重新加载搜索历史
          this.loadSearchHistory()
          
          // 显示删除成功提示
          uni.showToast({
            title: '已删除',
            icon: 'success',
            duration: 1500
          })
        } else {
          throw new Error(res.data?.message || '删除失败')
        }
      } catch (error) {
        console.error('删除搜索历史失败:', error)
        uni.showToast({
          title: '删除失败',
          icon: 'none',
          duration: 1500
        })
      }
    },
    
    // 显示清空确认对话框
    showClearHistoryConfirm() {
      uni.showModal({
        title: '确认清空',
        content: '是否清空所有搜索历史？',
        confirmColor: '#3C8999',
        success: (res) => {
          if (res.confirm) {
            this.clearHistory()
          }
        }
      })
    },
    
    // 清空所有历史
    async clearHistory() {
      try {
        const response = await http.delete('/user/search-history')
        
        if (response.statusCode === 200 && response.data.code === 0) {
          this.searchHistory = []
          uni.showToast({
            title: '已清空历史',
            icon: 'success'
          })
        } else {
          throw new Error(response.data?.message || '清空失败')
        }
      } catch (error) {
        console.error('清空搜索历史失败:', error)
        uni.showToast({
          title: '清空失败',
          icon: 'none'
        })
      }
    },
    
    // 点击历史记录进行搜索
    searchByHistory(keyword) {
      this.keyword = keyword
      this.handleSearch()
    },
    
    // 输入监听，实现防抖动
    handleInput(e) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      
      this.searchTimer = setTimeout(() => {
        if (this.keyword.trim()) {
          // 支持实时搜索功能，但考虑性能，关键词超过2个字符才触发
          if (this.keyword.trim().length > 2) {
            this.handleSearch()
          }
        } else {
          this.hasSearched = false
          this.searchResults = []
        }
      }, 500)
    },
    
    // 导航到详情页
    goToDetail(index) {
      uni.setStorageSync('searchResults', this.searchResults)
      uni.navigateTo({
        url: `/pages/detail/detail?index=${index}`
      })
    },
    
    // 搜索处理
    async handleSearch() {
      if (!this.keyword.trim()) {
        uni.showToast({
          title: '请输入搜索内容',
          icon: 'none'
        })
        return
      }
      
      try {
        this.loading = true
        this.hasSearched = true
        
        const res = await http.get('/sign/search', {
          params: {
            keyword: this.keyword
          }
        })
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.searchResults = res.data.data || []
          
          // 如果搜索结果不为空，保存到历史记录
          if (this.searchResults.length > 0) {
            this.saveSearchHistory()
          }
          
          // 如果搜到了多个结果，显示一个提示
          if (this.searchResults.length > 1) {
            uni.showToast({
              title: `找到${this.searchResults.length}个结果`,
              icon: 'none',
              duration: 1500
            })
          }
        } else {
          throw new Error(res.data.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索失败:', error)
        uni.showToast({
          title: error.message || '搜索失败',
          icon: 'none'
        })
        
        // 出错时清空结果
        this.searchResults = []
      } finally {
        this.loading = false
      }
    },
    
    // 获取难度文本
    getDifficultyText(difficulty) {
      const difficultyMap = {
        'BEGINNER': '初级',
        'INTERMEDIATE': '中级',
        'ADVANCED': '高级'
      }
      return difficultyMap[difficulty] || '未知'
    },
    
    // 展示语音搜索功能（未来功能）
    showVoiceSearchFeature() {
      uni.showToast({
        title: '语音搜索功能即将上线',
        icon: 'none',
        duration: 2000
      })
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

// Main container styles
.search-container {
  min-height: 100vh;
  background-color: $background-color;
  position: relative;
  
  // Background decorative elements
  .background-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 220rpx;
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
        width: 300rpx;
        height: 300rpx;
        animation: pulse 8s infinite ease-in-out;
      }
      
      &.circle-2 {
        bottom: -150rpx;
        left: -150rpx;
        width: 350rpx;
        height: 350rpx;
        animation: pulse 12s infinite ease-in-out;
      }
    }
  }
  
  // Header styling
  .search-header {
    height: 120rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    position: relative;
    z-index: 1;
    
    .back-button {
      width: 70rpx;
      height: 70rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10rpx);
      border-radius: 35rpx;
      margin-right: 20rpx;
      
      .icon-back {
        font-family: "iconfont";
        color: #fff;
        font-size: 30rpx;
      }
      
      &:active {
        background-color: rgba(255, 255, 255, 0.4);
      }
    }
    
    .page-title {
      flex: 1;
      
      text {
        font-size: 36rpx;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
      }
    }
  }
  
  // Search input area
  .search-input-wrapper {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    margin: 0 30rpx 30rpx;
    
    .search-input-container {
      flex: 1;
      height: 85rpx;
      background-color: #fff;
      border-radius: 42.5rpx;
      display: flex;
      align-items: center;
      padding: 0 25rpx;
      box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.08);
      margin-right: 20rpx;
      
      .icon-search {
        font-family: "iconfont";
        font-size: 36rpx;
        color: $text-lighter;
        margin-right: 15rpx;
      }
      
      .search-input {
        flex: 1;
        height: 100%;
        font-size: 28rpx;
        color: $text-color;
      }
      
      .clear-icon {
        width: 50rpx;
        height: 50rpx;
        border-radius: 25rpx;
        background-color: rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        
        text {
          color: #fff;
          font-size: 30rpx;
          font-weight: bold;
        }
        
        &:active {
          background-color: rgba(0, 0, 0, 0.15);
        }
      }
    }
    
    .search-button {
      background-color: rgba(255, 255, 255, 0.2);
      height: 85rpx;
      padding: 0 30rpx;
      border-radius: 42.5rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10rpx);
      
      text {
        color: rgba(255, 255, 255, 0.8);
        font-size: 30rpx;
        font-weight: bold;
      }
      
      &.active {
        background-color: $accent-color;
        box-shadow: 0 4rpx 15rpx rgba($accent-color, 0.3);
        
        text {
          color: #fff;
        }
      }
      
      &:active {
        transform: scale(0.98);
      }
    }
  }
  
  // Content area
  .search-content {
    height: calc(100vh - 235rpx);
    position: relative;
    z-index: 0;
    
    // Loading state
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80rpx 0;
      
      .loader {
        width: 70rpx;
        height: 70rpx;
        border-radius: 50%;
        border: 4rpx solid rgba($primary-color, 0.1);
        border-top: 4rpx solid $primary-color;
        animation: spin 1s infinite linear;
        margin-bottom: 30rpx;
      }
      
      text {
        font-size: 28rpx;
        color: $text-lighter;
      }
    }
    
    // Results container
    .results-container {
      padding: 20rpx 30rpx;
      
      .results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25rpx;
        
        .results-title {
          font-size: 32rpx;
          font-weight: bold;
          color: $text-color;
        }
        
        .results-count {
          font-size: 26rpx;
          color: $text-lighter;
        }
      }
      
      .results-list {
        .result-item {
          display: flex;
          align-items: center;
          background-color: $card-background;
          border-radius: $border-radius-lg;
          padding: 20rpx;
          margin-bottom: 20rpx;
          box-shadow: $box-shadow;
          position: relative;
          transition: transform $transition-duration, box-shadow $transition-duration;
          
          &:active {
            transform: scale(0.98);
            box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
          }
          
          .result-image {
            width: 120rpx;
            height: 120rpx;
            border-radius: $border-radius-md;
            background-color: #f0f0f0;
            margin-right: 20rpx;
          }
          
          .result-content {
            flex: 1;
            overflow: hidden;
            
            .result-title-row {
              display: flex;
              align-items: center;
              margin-bottom: 10rpx;
              
              .result-title {
                font-size: 32rpx;
                font-weight: bold;
                color: $text-color;
                margin-right: 15rpx;
              }
              
              .result-label {
                background-color: rgba($primary-color, 0.1);
                padding: 4rpx 12rpx;
                border-radius: 20rpx;
                
                text {
                  font-size: 22rpx;
                  color: $primary-color;
                }
              }
            }
            
            .result-pinyin {
              font-size: 26rpx;
              color: $text-light;
              margin-bottom: 10rpx;
              display: block;
            }
            
            .result-category {
              font-size: 24rpx;
              color: $text-lighter;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              display: block;
            }
          }
          
          .result-arrow {
            width: 60rpx;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            
            .icon-right {
              font-family: "iconfont";
              font-size: 36rpx;
              color: $text-lighter;
              transition: transform $transition-duration;
            }
            
            &:active .icon-right {
              transform: translateX(5rpx);
            }
          }
        }
      }
    }
    
    // Empty states
    .empty-results,
    .empty-history {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100rpx 30rpx;
      animation: fadeIn 0.5s;
      
      .empty-image {
        width: 250rpx;
        height: 250rpx;
        margin-bottom: 30rpx;
        opacity: 0.7;
      }
      
      .empty-title {
        font-size: 32rpx;
        font-weight: bold;
        color: $text-color;
        margin-bottom: 15rpx;
      }
      
      .empty-subtitle {
        font-size: 26rpx;
        color: $text-lighter;
      }
    }
    
    // History container
    .history-container {
      padding: 20rpx 30rpx;
      
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25rpx;
        
        .history-title {
          font-size: 32rpx;
          font-weight: bold;
          color: $text-color;
        }
        
        .clear-history {
          font-size: 26rpx;
          color: $text-light;
          padding: 8rpx 20rpx;
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 30rpx;
          
          &:active {
            background-color: rgba(0, 0, 0, 0.1);
          }
        }
      }
      
      .history-list {
        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20rpx;
          background-color: $card-background;
          border-radius: $border-radius-lg;
          margin-bottom: 20rpx;
          box-shadow: $box-shadow;
          
          &:active {
            background-color: #f9f9f9;
          }
          
          .history-item-content {
            flex: 1;
            display: flex;
            align-items: center;
            
            .icon-history {
              font-family: "iconfont";
              font-size: 36rpx;
              color: $text-lighter;
              margin-right: 20rpx;
            }
            
            .history-text {
              font-size: 28rpx;
              color: $text-color;
            }
          }
          
          .delete-icon {
            width: 50rpx;
            height: 50rpx;
            line-height: 50rpx;
            text-align: center;
            font-size: 40rpx;
            color: $text-lighter;
            
            &:active {
              color: $text-light;
            }
          }
        }
      }
    }
  }
  
  // Voice search button
  .voice-search-button {
    position: fixed;
    right: 40rpx;
    bottom: 40rpx;
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary-color, $primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 20rpx rgba($primary-color, 0.3);
    z-index: 10;
    transition: transform $transition-duration, box-shadow $transition-duration;
    
    .icon-mic {
      font-family: "iconfont";
      font-size: 50rpx;
      color: #fff;
    }
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 2rpx 10rpx rgba($primary-color, 0.2);
    }
  }
}
</style>