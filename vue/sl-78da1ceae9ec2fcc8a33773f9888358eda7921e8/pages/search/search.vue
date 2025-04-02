<template>
  <view class="search-container">
    <view class="search-header">
      <view class="search-box">
        <input 
          type="text"
          v-model="keyword"
          placeholder="请输入搜索内容"
          @confirm="handleSearch"
          @input="handleInput"
        />
        <text class="search-btn" @tap="handleSearch">搜索</text>
      </view>
    </view>
    
    <view class="search-content">
      <view v-if="loading" class="loading">
        搜索中...
      </view>
      <view v-else>
        <!-- 搜索结果预览 -->
        <view v-if="hasSearched && searchResults.length > 0" class="preview-section">
          <view class="section-header">
            <text class="title">搜索结果</text>
          </view>
          <view class="preview-list">
            <view 
              class="preview-item"
              v-for="(item, index) in searchResults"
              :key="index"
              @tap="goToDetail(index)"
            >
              <text class="name">{{item.name}}</text>
              <text class="pinyin">{{item.pinyin}}</text>
            </view>
          </view>
        </view>

        <!-- 搜索历史 -->
        <view class="history-section" v-if="!hasSearched && searchHistory.length > 0">
          <view class="section-header">
            <text class="title">搜索历史</text>
            <text class="clear-btn" @tap="clearHistory">清空</text>
          </view>
          <view class="history-list">
            <view 
              class="history-item"
              v-for="(item, index) in searchHistory"
              :key="index"
              @tap="searchByHistory(item)"
            >
              <text>{{item}}</text>
              <text class="delete-btn" @tap.stop="deleteHistoryItem(item)">×</text>
            </view>
          </view>
        </view>
        
        <!-- 搜索结果为空的提示 -->
        <view v-if="hasSearched && !searchResults.length" class="empty-result">
          暂无搜索结果
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
    
    // 从数据库加载搜索历史
    async loadSearchHistory() {
      try {
        const res = await http.get('/user/search-history')
        console.log('获取搜索历史返回:', res)
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.searchHistory = res.data.data || []
        } else {
          console.error('获取搜索历史失败:', res.data?.message || '未知错误')
        }
      } catch (error) {
        console.error('加载搜索历史出错:', error)
      }
    },
    
    // 保存搜索历史到数据库
    async saveSearchHistory() {
      if (!this.keyword || !this.keyword.trim()) return
      
      try {
        // First update the local array, ensuring deduplication and 10-item limit
        let updatedHistory = [...this.searchHistory]
        
        // Remove existing identical keywords
        updatedHistory = updatedHistory.filter(item => item !== this.keyword)
        
        // Add new keyword to the front
        updatedHistory.unshift(this.keyword)
        
        // Limit to maximum 10 records
        updatedHistory = updatedHistory.slice(0, 10)
        
        // Send the entire history array to the backend
        const res = await http.post('/user/search-history', {
          history: updatedHistory
        })
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // Update local array
          this.searchHistory = updatedHistory
        } else {
          console.error('保存搜索历史失败:', res.data?.message || '未知错误')
          // If save fails, reload from backend
          this.loadSearchHistory()
        }
      } catch (error) {
        console.error('保存搜索历史出错:', error)
        // Reload on error
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
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          })
        } else {
          uni.showToast({
            title: '删除失败',
            icon: 'none',
            duration: 1500
          })
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
    
    // 清空所有历史
    async clearHistory() {
      uni.showModal({
        title: '提示',
        content: '确定要清空搜索历史吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const response = await http.delete('/user/search-history')
              
              if (response.statusCode === 200 && response.data.code === 0) {
                this.searchHistory = []
                uni.showToast({
                  title: '已清空',
                  icon: 'success'
                })
              } else {
                uni.showToast({
                  title: '清空失败',
                  icon: 'none'
                })
              }
            } catch (error) {
              console.error('清空搜索历史失败:', error)
              uni.showToast({
                title: '清空失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    searchByHistory(keyword) {
      this.keyword = keyword
      this.handleSearch()
    },
    
    handleInput(e) {
      if(this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      
      this.searchTimer = setTimeout(() => {
        if(this.keyword.trim()) {
          this.handleSearch()
        } else {
          this.hasSearched = false
          this.searchResults = []
        }
      }, 500)
    },
    
    goToDetail(index) {
      uni.setStorageSync('searchResults', this.searchResults)
      uni.navigateTo({
        url: `/pages/detail/detail?index=${index}`
      })
    },
    
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
        const res = await http.get('/sign/search', {
          params: {
            keyword: this.keyword
          }
        })
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.searchResults = res.data.data || []
          this.hasSearched = true
          
          if (this.searchResults.length > 0) {
            // 保存到数据库搜索历史
            this.saveSearchHistory()
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
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss">
.search-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  
  .search-header {
    background-color: #fff;
    padding: 20rpx;
    position: sticky;
    top: 0;
    z-index: 100;
    
    .search-box {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 35rpx;
      padding: 0 30rpx;
      height: 70rpx;
      
      input {
        flex: 1;
        height: 100%;
        font-size: 28rpx;
      }
      
      .search-btn {
        margin-left: 20rpx;
        color: #007AFF;
        font-size: 28rpx;
      }
    }
  }
  
  .search-content {
    padding: 20rpx;
    
    .preview-section {
      margin-bottom: 30rpx;
      
      .preview-list {
        .preview-item {
          background-color: #fff;
          padding: 20rpx;
          margin-bottom: 20rpx;
          border-radius: 10rpx;
          display: flex;
          flex-direction: column;
          
          .name {
            font-size: 32rpx;
            color: #333;
            margin-bottom: 10rpx;
          }
          
          .pinyin {
            font-size: 28rpx;
            color: #666;
          }
          
          &:active {
            background-color: #f0f0f0;
          }
        }
      }
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .title {
        font-size: 32rpx;
        color: #333;
        font-weight: bold;
      }
      
      .clear-btn {
        font-size: 28rpx;
        color: #999;
      }
    }
    
    .history-list {
      display: flex;
      flex-wrap: wrap;
      margin: 0 -10rpx;
      
      .history-item {
        background-color: #fff;
        padding: 10rpx 20rpx;
        border-radius: 25rpx;
        margin: 10rpx;
        font-size: 28rpx;
        color: #666;
        display: flex;
        align-items: center;
        
        .delete-btn {
          margin-left: 10rpx;
          font-size: 28rpx;
          color: #999;
          width: 40rpx;
          height: 40rpx;
          text-align: center;
          line-height: 40rpx;
        }
        
        &:active {
          background-color: #f0f0f0;
        }
      }
    }
    
    .loading, .empty-result {
      text-align: center;
      color: #999;
      padding: 40rpx 0;
    }
  }
}
</style>