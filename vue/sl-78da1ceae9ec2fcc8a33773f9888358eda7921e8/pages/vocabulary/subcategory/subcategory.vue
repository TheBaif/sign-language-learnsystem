<template>
  <view class="subcategory-container">
    <!-- Enhanced Header with Background Gradient -->
    <view class="subcategory-header">
      <view class="header-content">
        <view class="back-button" @tap="navigateBack">
          <text class="back-icon">&#xe679;</text>
        </view>
        <view class="title-container">
          <text class="header-title">{{ parentName || '未命名词库' }}</text>
          <view class="breadcrumb" v-if="parentName">
            <text class="breadcrumb-text">{{ parentName }}</text>
            <text class="breadcrumb-divider" v-if="parentName">›</text>
            <text class="breadcrumb-text">子分类</text>
          </view>
        </view>
        <view class="search-button" @tap="navigateToSearch">
          <text class="search-icon">&#xe665;</text>
        </view>
      </view>
    </view>
    
    <!-- Main Content Area -->
    <scroll-view scroll-y class="subcategory-content" enable-back-to-top>
      <!-- Loading State -->
      <view v-if="loading" class="loading-state">
        <view class="loader"></view>
        <text class="loading-text">加载分类中...</text>
      </view>
      
      <!-- Main Content -->
      <block v-else>
        <!-- Empty State -->
        <view v-if="subcategories.length === 0" class="empty-state">
          <image src="/static/empty.png" mode="aspectFit" class="empty-image"></image>
          <text class="empty-title">暂无子分类</text>
          <text class="empty-desc">可直接查看该分类下的词汇</text>
          <button class="view-all-btn" @tap="navigateToAllWords">浏览全部词汇</button>
        </view>
        
        <!-- Subcategory List -->
        <view v-else class="subcategory-list">
          <!-- Header with Info -->
          <view class="section-header">
            <view class="header-info">
              <text class="section-title">子分类</text>
              <text class="section-count">共 {{ subcategories.length }} 项</text>
            </view>
            <view class="view-all-link" @tap="navigateToAllWords">
              <text>查看全部词汇</text>
              <text class="arrow-icon">›</text>
            </view>
          </view>
          
          <!-- Categories Grid -->
          <view class="subcategory-grid">
            <view 
              class="subcategory-card" 
              v-for="(item, index) in displayedSubcategories" 
              :key="index"
              @tap="navigateToWordlist(item)"
            >
              <view class="card-icon" :class="'color-' + (index % 6)">
                <text class="icon-text">{{ item.name.slice(0, 1) }}</text>
              </view>
              <view class="card-info">
                <text class="card-title">{{ item.name || '未命名子分类' }}</text>
                <text class="card-desc">{{ getSubcategoryDesc(item) }}</text>
              </view>
              <text class="card-arrow">›</text>
            </view>
          </view>
          
          <!-- Enhanced Pagination Controls -->
          <view class="pagination-controls" v-if="totalPages > 1">
            <view class="page-indicator">
              <text>{{ currentPage }} / {{ totalPages }}</text>
            </view>
            
            <view class="page-buttons">
              <view 
                class="page-btn first-btn" 
                :class="{ disabled: currentPage <= 1 }"
                @tap="goToFirstPage"
              >
                <text class="btn-text">首页</text>
              </view>
              
              <view 
                class="page-btn prev-btn" 
                :class="{ disabled: currentPage <= 1 }"
                @tap="goToPrevPage"
              >
                <text class="btn-text">上一页</text>
              </view>
              
              <view class="page-numbers">
                <view 
                  v-for="page in displayedPageNumbers" 
                  :key="page"
                  class="page-number"
                  :class="{ active: page === currentPage, divider: page === '...' }"
                  @tap="goToPage(page)"
                >
                  {{ page }}
                </view>
              </view>
              
              <view 
                class="page-btn next-btn" 
                :class="{ disabled: currentPage >= totalPages }"
                @tap="goToNextPage"
              >
                <text class="btn-text">下一页</text>
              </view>
              
              <view 
                class="page-btn last-btn" 
                :class="{ disabled: currentPage >= totalPages }"
                @tap="goToLastPage"
              >
                <text class="btn-text">尾页</text>
              </view>
            </view>
          </view>
        </view>
      </block>
    </scroll-view>
    
    <!-- Fixed Action Button for Navigation -->
    <view class="floating-action-button" @tap="navigateToAllWords">
      <text class="fab-icon">&#xe664;</text>
      <text class="fab-text">查看词汇</text>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      parentId: '',
      parentName: '',
      loading: true,
      errorMessage: '',
      subcategories: [],
      currentPage: 1,
      pageSize: 6,
      totalItems: 0,
      popularSigns: []
    }
  },
  
  computed: {
    totalPages() {
      return Math.ceil(this.totalItems / this.pageSize);
    },
    
    displayedSubcategories() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = Math.min(start + this.pageSize, this.subcategories.length);
      return this.subcategories.slice(start, end);
    },
    
    displayedPageNumbers() {
      // Create a page number array for pagination display
      const totalPages = this.totalPages;
      const currentPage = this.currentPage;
      let pages = [];
      
      if (totalPages <= 5) {
        // If total pages are 5 or less, show all pages
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always include first page
        pages.push(1);
        
        // Current page neighborhood
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);
        
        // Add ellipsis if needed
        if (startPage > 2) {
          pages.push('...');
        }
        
        // Add pages around current page
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
        
        // Add ellipsis if needed
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        
        // Always include last page
        pages.push(totalPages);
      }
      
      return pages;
    }
  },
  
  onLoad(options) {
    console.log('子词库页面接收到的参数:', options);
    
    if (options.parentId) {
      this.parentId = options.parentId;
    }
    
    if (options.parentName) {
      this.parentName = decodeURIComponent(options.parentName);
    } else {
      this.parentName = '未命名词库';
    }
    
    this.checkLogin();
  },
  
  methods: {
    navigateBack() {
      uni.navigateBack();
    },
    
    navigateToSearch() {
      uni.navigateTo({
        url: '/pages/search/search'
      });
    },
    
    // 检查登录状态
    checkLogin() {
      const token = uni.getStorageSync('token');
      console.log('当前token:', token);
      
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
      
      // 已登录，加载数据
      this.loadSubcategories();
      this.loadPopularSigns();
    },
    
    // 加载子词库列表
    async loadSubcategories() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('未登录');
        }
        
        console.log('开始获取子词库列表, parentId:', this.parentId);
        
        // 使用childSign接口获取所有子词库
        const res = await http.get('/childSign/list', {
          header: {
            'Authorization': token
          }
        });
        
        console.log('子词库API响应:', res);
        
        if (res.data && res.data.code === 0 && res.data.data) {
          console.log('子词库原始数据:', res.data.data);
          
          // 筛选当前parentId的子词库
          if (Array.isArray(res.data.data)) {
            // 确保parentId是数字进行比较
            const parentIdNum = parseInt(this.parentId, 10);
            console.log('转换后的parentId(数字):', parentIdNum);
            
            this.subcategories = res.data.data.filter(item => {
              console.log('比较:', item.parentId, parentIdNum, item.parentId == parentIdNum);
              return item.parentId == parentIdNum;
            });
            
            console.log('筛选后的子词库:', this.subcategories);
            this.totalItems = this.subcategories.length;
            
            // 确保每个子词库都有名称
            this.subcategories = this.subcategories.map(item => {
              if (!item.name || item.name.trim() === '') {
                return {...item, name: '未命名子词库'};
              }
              return item;
            });
          } else {
            console.warn('返回的数据不是数组:', res.data.data);
            this.subcategories = [];
            this.totalItems = 0;
          }
        } else {
          const errorMsg = res.data?.message || '获取数据失败';
          console.error('API返回错误:', errorMsg, res.data);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error('获取子词库列表失败:', error.message || error);
        this.errorMessage = `获取子词库列表失败: ${error.message || '请检查网络后重试'}`;
        
        // 如果服务器没有数据，使用模拟数据
        if (this.subcategories.length === 0) {
          console.log('使用模拟数据');
          this.subcategories = this.getMockSubcategories();
          this.totalItems = this.subcategories.length;
          this.errorMessage = '';  // 清除错误消息
        }
      } finally {
        this.loading = false;
      }
    },
    
    // 加载热门手语
    async loadPopularSigns() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) return;
        
        // 尝试从API获取热门数据
        const res = await http.get('/sign/list', {
          params: {
            pageNum: 1,
            pageSize: 10
          },
          header: {
            'Authorization': token
          }
        });
        
        if (res.statusCode === 200 && res.data.code === 0) {
          if (res.data.data && res.data.data.records) {
            this.popularSigns = res.data.data.records.filter(item => item.imageSrc).slice(0, 10);
          }
        }
        
        // 如果没有获取到数据，使用模拟数据
        if (!this.popularSigns.length) {
          this.popularSigns = this.getMockPopularSigns();
        }
      } catch (error) {
        console.error('获取热门手语失败:', error);
        this.popularSigns = this.getMockPopularSigns();
      }
    },
    
    // 跳转到词汇列表页面
    navigateToWordlist(subcategory) {
      const childName = subcategory.name || '未命名子词库';
      uni.navigateTo({
        url: `/pages/vocabulary/wordlist/wordlist?childId=${subcategory.id}&childName=${encodeURIComponent(childName)}&parentId=${this.parentId}&parentName=${encodeURIComponent(this.parentName)}`
      });
    },
    
    // 跳转到该分类下的所有词汇
    navigateToAllWords() {
      uni.navigateTo({
        url: `/pages/vocabulary/wordlist/wordlist?parentId=${this.parentId}&parentName=${encodeURIComponent(this.parentName)}`
      });
    },
    
    // 获取子分类描述
    getSubcategoryDesc(item) {
      return `点击查看详情`;
    },
    
    // 跳转到第一页
    goToFirstPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage = 1;
    },
    
    // 跳转到上一页
    goToPrevPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage--;
    },
    
    // 跳转到下一页
    goToNextPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage++;
    },
    
    // 跳转到最后一页
    goToLastPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage = this.totalPages;
    },
    
    // 跳转到指定页
    goToPage(page) {
      if (page === '...' || this.loading) return;
      this.currentPage = page;
    },
    
    // 开发阶段使用的模拟数据
    getMockSubcategories() {
      return [
        { id: 1, name: '初级词汇', parentId: this.parentId, parentName: this.parentName, description: '适合初学者的基础词汇' },
        { id: 2, name: '中级词汇', parentId: this.parentId, parentName: this.parentName, description: '适合有一定基础的学习者' },
        { id: 3, name: '高级词汇', parentId: this.parentId, parentName: this.parentName, description: '适合进阶学习者的词汇' },
        { id: 4, name: '常用口语', parentId: this.parentId, parentName: this.parentName, description: '日常交流中的常用表达' },
        { id: 5, name: '特殊场景', parentId: this.parentId, parentName: this.parentName, description: '特定场景中的专业词汇' },
        { id: 6, name: '情感表达', parentId: this.parentId, parentName: this.parentName, description: '表达情感的手语词汇' },
        { id: 7, name: '社交礼仪', parentId: this.parentId, parentName: this.parentName, description: '社交场合中的礼仪用语' },
        { id: 8, name: '数字时间', parentId: this.parentId, parentName: this.parentName, description: '数字和时间相关的手语' }
      ];
    },
    
    // 模拟热门手语数据
    getMockPopularSigns() {
      return [
        { id: 1, name: '你好', pinyin: 'nǐ hǎo', imageSrc: '/static/signs/hello.png' },
        { id: 2, name: '谢谢', pinyin: 'xiè xiè', imageSrc: '/static/signs/thanks.png' },
        { id: 3, name: '再见', pinyin: 'zài jiàn', imageSrc: '/static/signs/goodbye.png' },
        { id: 4, name: '朋友', pinyin: 'péng yǒu', imageSrc: '/static/signs/friend.png' },
        { id: 5, name: '家人', pinyin: 'jiā rén', imageSrc: '/static/signs/family.png' }
      ];
    }
  }
}
</script>

<style lang="scss">
// Colors
$primary-color: #3C8999;
$primary-light: #55a5b5;
$primary-gradient: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
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
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30rpx); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
  100% { transform: translateY(0); }
}

.subcategory-container {
  min-height: 100vh;
  background-color: $background-color;
  position: relative;
  
  // Enhanced Header
  .subcategory-header {
    height: 260rpx;
    background: $primary-gradient;
    position: relative;
    overflow: hidden;
    
    // Add decorative elements
    &::before,
    &::after {
      content: "";
      position: absolute;
      border-radius: 50%;
      background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
    }
    
    &::before {
      width: 400rpx;
      height: 400rpx;
      top: -200rpx;
      right: -100rpx;
      animation: pulse 10s infinite ease-in-out;
    }
    
    &::after {
      width: 300rpx;
      height: 300rpx;
      bottom: -150rpx;
      left: -100rpx;
      animation: pulse 14s infinite ease-in-out;
    }
    
    .header-content {
      height: 100%;
      padding: 40rpx 30rpx;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      z-index: 1;
      
      .back-button {
        position: absolute;
        left: 30rpx;
        top: 40rpx;
        width: 70rpx;
        height: 70rpx;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10rpx);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all $transition-duration;
        
        &:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.3);
        }
        
        .back-icon {
          font-size: 36rpx;
          color: #fff;
        }
      }
      
      .title-container {
        padding-left: 90rpx;
        
        .header-title {
          font-size: 40rpx;
          font-weight: bold;
          color: #fff;
          margin-bottom: 15rpx;
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
        }
        
        .breadcrumb {
          display: flex;
          align-items: center;
          
          .breadcrumb-text {
            font-size: 26rpx;
            color: rgba(255, 255, 255, 0.9);
          }
          
          .breadcrumb-divider {
            margin: 0 10rpx;
            font-size: 26rpx;
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }
      
      .search-button {
        position: absolute;
        right: 30rpx;
        top: 40rpx;
        width: 70rpx;
        height: 70rpx;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10rpx);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all $transition-duration;
        
        &:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.3);
        }
        
        .search-icon {
          font-size: 36rpx;
          color: #fff;
        }
      }
    }
  }
  
  // Main Content
  .subcategory-content {
    height: calc(100vh - 260rpx);
    width: 100%;
    position: relative;
    z-index: 2;
    
    // Loading State
    .loading-state {
      height: 300rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60rpx 30rpx;
      
      .loader {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        border: 4rpx solid rgba($primary-color, 0.1);
        border-top-color: $primary-color;
        animation: spin 1s infinite linear;
        margin-bottom: 30rpx;
      }
      
      .loading-text {
        font-size: 28rpx;
        color: $text-light;
      }
    }
    
    // Empty State
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80rpx 30rpx;
      animation: fadeIn 0.5s ease-out;
      
      .empty-image {
        width: 240rpx;
        height: 240rpx;
        margin-bottom: 40rpx;
        opacity: 0.7;
      }
      
      .empty-title {
        font-size: 36rpx;
        font-weight: bold;
        color: $text-color;
        margin-bottom: 15rpx;
      }
      
      .empty-desc {
        font-size: 28rpx;
        color: $text-light;
        margin-bottom: 40rpx;
        text-align: center;
      }
      
      .view-all-btn {
        background: $primary-gradient;
        color: #fff;
        font-size: 30rpx;
        font-weight: bold;
        padding: 20rpx 60rpx;
        border-radius: 40rpx;
        box-shadow: 0 8rpx 16rpx rgba($primary-color, 0.3);
        border: none;
        transition: all $transition-duration;
        
        &::after {
          border: none;
        }
        
        &:active {
          transform: scale(0.98);
          box-shadow: 0 4rpx 8rpx rgba($primary-color, 0.3);
        }
      }
    }
    
    // Subcategory List
    .subcategory-list {
      padding: 30rpx;
      position: relative;
      
      // Enhanced section header
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30rpx;
        animation: fadeIn 0.4s ease-out;
        
        .header-info {
          display: flex;
          align-items: center;
          
          .section-title {
            font-size: 34rpx;
            font-weight: bold;
            color: $text-color;
            margin-right: 15rpx;
            position: relative;
            padding-left: 20rpx;
            
            &::before {
              content: "";
              position: absolute;
              left: 0;
              top: 20%;
              height: 60%;
              width: 8rpx;
              background: $primary-gradient;
              border-radius: 4rpx;
            }
          }
          
          .section-count {
            font-size: 26rpx;
            color: $text-light;
            background: #f0f0f0;
            padding: 4rpx 15rpx;
            border-radius: 20rpx;
          }
        }
        
        .view-all-link {
          display: flex;
          align-items: center;
          font-size: 28rpx;
          color: $primary-color;
          padding: 8rpx 20rpx;
          background: rgba($primary-color, 0.1);
          border-radius: 30rpx;
          transition: all $transition-duration;
          
          &:active {
            background: rgba($primary-color, 0.2);
            transform: scale(0.98);
          }
          
          .arrow-icon {
            margin-left: 8rpx;
            font-size: 24rpx;
          }
        }
      }
      
      // Enhanced subcategory grid
      .subcategory-grid {
        .subcategory-card {
          background-color: $card-background;
          border-radius: $border-radius-lg;
          padding: 26rpx 30rpx;
          margin-bottom: 25rpx;
          box-shadow: $box-shadow;
          display: flex;
          align-items: center;
          transition: all $transition-duration;
          animation: slideInRight 0.5s ease-out both;
          position: relative;
          overflow: hidden;
          
          // Staggered animation for cards
          @for $i from 0 through 5 {
            &:nth-child(#{$i + 1}) {
              animation-delay: #{$i * 0.08}s;
            }
          }
          
          // Add subtle shimmer effect
          &::after {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.4) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-25deg);
            transition: left 0.7s ease-out;
          }
          
          &:active {
            transform: translateY(2rpx);
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
            
            &::after {
              left: 200%;
            }
          }
          
          .card-icon {
            width: 80rpx;
            height: 80rpx;
            border-radius: 16rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 25rpx;
            flex-shrink: 0;
            
            .icon-text {
              font-size: 36rpx;
              font-weight: bold;
              color: #fff;
            }
            
            &.color-0 { background: linear-gradient(135deg, #4dabf7, #2b8fda); }
            &.color-1 { background: linear-gradient(135deg, #74c0fc, #4a9cdb); }
            &.color-2 { background: linear-gradient(135deg, #a5d8ff, #76b0da); }
            &.color-3 { background: linear-gradient(135deg, #66d9e8, #36b9ca); }
            &.color-4 { background: linear-gradient(135deg, #3bc9db, #1ba4b6); }
            &.color-5 { background: linear-gradient(135deg, #63e6be, #38d9a9); }
          }
          
          .card-info {
            flex: 1;
            overflow: hidden;
            padding-right: 15rpx;
            
            .card-title {
              font-size: 32rpx;
              color: $text-color;
              font-weight: bold;
              margin-bottom: 10rpx;
              display: block;
            }
            
            .card-desc {
              font-size: 26rpx;
              color: $text-lighter;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
          
          .card-arrow {
            font-size: 40rpx;
            color: #ddd;
            margin-left: 15rpx;
            transition: transform $transition-duration;
          }
          
          &:active .card-arrow {
            transform: translateX(10rpx);
            color: $primary-color;
          }
        }
      }
      
      // Enhanced pagination controls
      .pagination-controls {
        margin: 40rpx 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: fadeIn 0.6s ease-out;
        
        .page-indicator {
          background: rgba($primary-color, 0.1);
          padding: 8rpx 25rpx;
          border-radius: 25rpx;
          margin-bottom: 20rpx;
          
          text {
            font-size: 28rpx;
            color: $primary-color;
            font-weight: bold;
          }
        }
        
        .page-buttons {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 40rpx;
          padding: 10rpx;
          box-shadow: $box-shadow;
          
          .page-btn {
            padding: 10rpx 25rpx;
            background: $primary-color;
            color: #fff;
            border-radius: 25rpx;
            margin: 0 5rpx;
            transition: all $transition-duration;
            
            .btn-text {
              font-size: 26rpx;
            }
            
            &:active:not(.disabled) {
              transform: scale(0.95);
              opacity: 0.9;
            }
            
            &.disabled {
              background: #e0e0e0;
              color: #aaa;
            }
            
            &.first-btn, &.last-btn {
              background: rgba($primary-color, 0.8);
              .btn-text {
                font-size: 24rpx;
              }
            }
          }
          
          .page-numbers {
            display: flex;
            align-items: center;
            margin: 0 10rpx;
            
            .page-number {
              min-width: 60rpx;
              height: 60rpx;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 5rpx;
              font-size: 28rpx;
              color: $text-color;
              border-radius: 30rpx;
              transition: all $transition-duration;
              
              &:active:not(.divider) {
                background: #f0f0f0;
              }
              
              &.active {
                background: rgba($primary-color, 0.15);
                color: $primary-color;
                font-weight: bold;
              }
              
              &.divider {
                color: $text-lighter;
              }
            }
          }
        }
      }
    }
  }
  
  // Floating Action Button
  .floating-action-button {
    position: fixed;
    right: 30rpx;
    bottom: 50rpx;
    height: 90rpx;
    padding: 0 40rpx;
    background: $primary-gradient;
    border-radius: 45rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 8rpx 20rpx rgba($primary-color, 0.35);
    z-index: 99;
    animation: float 4s infinite ease-in-out;
    transition: all $transition-duration;
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.25);
    }
    
    .fab-icon {
      font-size: 36rpx;
      color: #fff;
      margin-right: 15rpx;
    }
    
    .fab-text {
      font-size: 28rpx;
      font-weight: bold;
      color: #fff;
    }
  }
}

/* Responsive Adjustments */
@media screen and (min-width: 768px) {
  .subcategory-container {
    .subcategory-content {
      .subcategory-list {
        .subcategory-grid {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -10rpx;
          
          .subcategory-card {
            width: calc(50% - 20rpx);
            margin: 0 10rpx 20rpx;
          }
        }
      }
    }
  }
}
</style>