<template>
  <view class="vocabulary-container">
    <!-- Stylized background elements -->
    <view class="background-elements">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>
    
    <view class="vocabulary-content">
      <!-- Enhanced header with search button -->
      <view class="vocabulary-header">
        <view class="header-top">
          <view class="logo-area">
            <image src="/static/logo.png" mode="aspectFit" class="mini-logo"></image>
            <text class="header-title">手语词库</text>
          </view>
          <view class="search-button" @tap="navigateToSearch">
			  搜索
          </view>
        </view>
        
        <view class="header-subtitle">
          <text>探索丰富的手语词汇世界</text>
        </view>
      </view>
      
      
      
      
      <!-- Main Categories Section -->
      <view class="main-categories" v-if="!loading && parentCategories.length > 0">
        <view class="section-header">
          <text class="section-title">全部分类</text>
          <view class="filter-dropdown" v-if="parentCategories.length > 10">
            <picker 
              mode="selector" 
              :range="filterOptions" 
              @change="onFilterChange"
            >
              <view class="filter-button">
                <text>{{ filterOptions[filterIndex] }}</text>
              </view>
            </picker>
          </view>
        </view>
        
        <view class="category-grid">
          <view
            class="category-card"
            v-for="(category, index) in displayedParentCategories"
            :key="index"
            @tap="navigateToSubcategory(category)"
          >
            <view class="category-info">
              <text class="category-name">{{ category.name }}</text>
              <text class="category-desc">{{ getCategoryDesc(category) }}</text>
            </view>
            <text class="category-arrow">›</text>
          </view>
        </view>
        
        <!-- Pagination Controls -->
        <view class="pagination" v-if="parentCategories.length > parentPageSize">
          <view class="page-controls">
            <view 
              class="page-btn first-btn" 
              :class="{ disabled: parentCurrentPage <= 1 }" 
              @tap="goToFirstPage"
            >
              <text>首页</text>
            </view>
            <view 
              class="page-btn" 
              :class="{ disabled: parentCurrentPage <= 1 }" 
              @tap="goToParentPrevPage"
            >
              <text>上一页</text>
            </view>
            <view class="page-indicator">
              <text>{{ parentCurrentPage }}/{{ parentTotalPages }}</text>
            </view>
            <view 
              class="page-btn" 
              :class="{ disabled: parentCurrentPage >= parentTotalPages }" 
              @tap="goToParentNextPage"
            >
              <text>下一页</text>
            </view>
            <view 
              class="page-btn last-btn" 
              :class="{ disabled: parentCurrentPage >= parentTotalPages }" 
              @tap="goToLastPage"
            >
              <text>尾页</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- Loading State -->
      <view v-if="loading" class="loading-state">
        <view class="loader"></view>
        <text>加载词库中...</text>
      </view>
      
      <!-- Empty State -->
      <view v-if="!loading && parentCategories.length === 0" class="empty-state">
        <image src="/static/empty.png" mode="aspectFit" class="empty-image"></image>
        <text class="empty-title">暂无词库数据</text>
        <text class="empty-subtitle">词库加载失败，请稍后重试</text>
        <view class="retry-button" @tap="fetchParentCategories">
          <text>重新加载</text>
        </view>
      </view>
    </view>
    
    <!-- Fixed Action Buttons -->
    <view class="fixed-actions">
      <view class="action-button search-action" @tap="navigateToSearch">
      </view>
      <view class="action-button add-action" @tap="navigateToCustomSign">
        <text class="iconfont icon-add">+</text>
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
      parentCategories: [], 
      allChildCategories: [],
      signDataByParentId: {},
      recentSigns: [],
      
      // 分页相关
      parentCurrentPage: 1,
      parentPageSize: 6,
      filterIndex: 0,
      filterOptions: ['默认排序', '按名称排序', '按学习进度排序'],
      
      // 特色分类
      featuredCategories: [
        { id: 'daily', name: '日常用语', icon: '&#xe65c;' },
        { id: 'beginner', name: '初学必备', icon: '&#xe665;' },
        { id: 'family', name: '家庭生活', icon: '&#xe66a;' },
        { id: 'work', name: '工作场景', icon: '&#xe667;' }
      ]
    }
  },
  
  computed: {
    // 父分类总页数
    parentTotalPages() {
      return Math.ceil(this.parentCategories.length / this.parentPageSize) || 1;
    },
    
    // 当前页显示的父分类
    displayedParentCategories() {
      const start = (this.parentCurrentPage - 1) * this.parentPageSize;
      const end = start + this.parentPageSize;
      return this.parentCategories.slice(start, end);
    }
  },
  
  onLoad() {
    this.checkLogin();
  },
  
  onShow() {
    this.checkLogin();
    this.getRecentLearning();
  },
  
  methods: {
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
      this.fetchParentCategories();
      this.fetchAllChildCategories();
    },
    
    // 获取主分类列表
    async fetchParentCategories() {
      this.loading = true;
      try {
        const res = await http.get('/parentSign/list');
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 处理主分类数据，为每个分类添加必要的字段
          this.parentCategories = res.data.data.map(item => {
            return {
              ...item,
              type: 'parent',
              pinyin: '', 
              gesture: '', 
              imageSrc: '', 
              wordVideoSrc: '' 
            }
          });
        } else {
          this.handleRequestError('获取分类列表失败');
        }
      } catch (err) {
        this.handleRequestError('请求失败: ' + (err.message || err));
        // 使用模拟数据作为后备
        this.parentCategories = this.getMockParentCategories();
      } finally {
        this.loading = false;
      }
    },
    
    // 获取所有子分类
    async fetchAllChildCategories() {
      try {
        const res = await http.get('/childSign/list');
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 处理子分类数据
          this.allChildCategories = res.data.data.map(item => {
            return {
              ...item,
              type: 'child',
              pinyin: '', 
              gesture: '', 
              imageSrc: '', 
              wordVideoSrc: '' 
            }
          });
          
          // 根据parentId对子分类进行分组
          this.groupChildCategoriesByParent();
        } else {
          this.handleRequestError('获取子分类列表失败');
        }
      } catch (err) {
        this.handleRequestError('请求失败: ' + (err.message || err));
      }
    },
    
    // 获取最近学习数据
    async getRecentLearning() {
      try {
        const res = await http.get('/learning/recent', {
          params: { limit: 5 }
        });
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.recentSigns = res.data.data || [];
        } else {
          // 使用模拟数据作为后备
          this.recentSigns = this.getMockRecentLearning();
        }
      } catch (error) {
        console.error('获取最近学习失败:', error);
        // 使用模拟数据作为后备
        this.recentSigns = this.getMockRecentLearning();
      }
    },
    
    // 处理请求错误
    handleRequestError(message, err = null) {
      console.error(message, err);
      uni.showToast({
        title: message,
        icon: 'none'
      });
    },
    
    // 根据父分类ID分组子分类
    groupChildCategoriesByParent() {
      // 创建一个对象，键为父分类ID，值为该父分类下的所有子分类
      this.signDataByParentId = {};
      
      this.allChildCategories.forEach(item => {
        if (!this.signDataByParentId[item.parentId]) {
          this.signDataByParentId[item.parentId] = [];
        }
        
        // 为子分类添加父分类名称
        const parentCategory = this.parentCategories.find(p => p.id === item.parentId);
        if (parentCategory) {
          item.parentName = parentCategory.name;
        }
        
        this.signDataByParentId[item.parentId].push(item);
      });
    },
    
    // 导航到子分类页面
    navigateToSubcategory(item) {
      let parentId = item.id;
      let parentName = item.name;
      
      // 处理特色分类
      if (item.id === 'daily' || item.id === 'beginner' || item.id === 'family' || item.id === 'work') {
        // 这里可以根据特色分类ID映射到实际的父分类ID
        // 或者直接跳转到相关内容页面
        uni.showToast({
          title: '该功能正在开发中',
          icon: 'none'
        });
        return;
      }
      
      uni.navigateTo({
        url: `/pages/vocabulary/subcategory/subcategory?parentId=${parentId}&parentName=${encodeURIComponent(parentName)}`
      });
    },
    
    // 导航到特色分类
    navigateToCategory(item) {
      uni.navigateTo({
        url: `/pages/vocabulary/category/category?type=${item.id}&name=${encodeURIComponent(item.name)}`
      });
    },
    
    // 查看手语详情
    viewSignDetail(item) {
      const results = [item];
      uni.setStorageSync('searchResults', results);
      uni.navigateTo({
        url: `/pages/detail/detail?index=0`
      });
    },
    
    // 跳转到搜索页面
    navigateToSearch() {
      uni.navigateTo({
        url: '/pages/search/search'
      });
    },
    
    // 跳转到自定义手语页面
    navigateToCustomSign() {
      uni.navigateTo({
        url: '/pages/custom-sign/custom-sign'
      });
    },
    
    // 跳转到学习进度页面
    navigateToLearningProgress() {
      uni.navigateTo({
        url: '/pages/learning-progress/learning-progress'
      });
    },
    
    // 父分类分页控制方法
    goToFirstPage() {
      if (this.parentCurrentPage <= 1 || this.loading) return;
      this.parentCurrentPage = 1;
    },
    
    goToParentPrevPage() {
      if (this.parentCurrentPage <= 1 || this.loading) return;
      this.parentCurrentPage--;
    },
    
    goToParentNextPage() {
      if (this.parentCurrentPage >= this.parentTotalPages || this.loading) return;
      this.parentCurrentPage++;
    },
    
    goToLastPage() {
      if (this.parentCurrentPage >= this.parentTotalPages || this.loading) return;
      this.parentCurrentPage = this.parentTotalPages;
    },
    
    // 筛选器变更
    onFilterChange(e) {
      this.filterIndex = e.detail.value;
      // 根据筛选器值排序分类
      this.sortCategories(parseInt(this.filterIndex));
    },
    
    // 排序分类
    sortCategories(filterType) {
      switch(filterType) {
        case 1: // 按名称排序
          this.parentCategories.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
          break;
        case 2: // 按学习进度排序 (模拟)
          // 实际应用中，需要根据用户学习进度数据进行排序
          this.parentCategories.sort((a, b) => 
            (this.signDataByParentId[b.id]?.length || 0) - (this.signDataByParentId[a.id]?.length || 0)
          );
          break;
        default: // 默认排序
          this.parentCategories.sort((a, b) => a.id - b.id);
          break;
      }
      
      // 重置到第一页
      this.parentCurrentPage = 1;
    },
    
    // 根据索引获取分类图标
    getCategoryIcon(index) {
      const icons = [
        '&#xe65c;', // 日常
        '&#xe665;', // 学习
        '&#xe66a;', // 家庭
        '&#xe667;', // 工作
        '&#xe669;', // 娱乐
        '&#xe66b;'  // 情感
      ];
      return icons[index % icons.length];
    },
    
    // 获取分类描述
    getCategoryDesc(category) {
      // 如果分类有子分类，返回子分类数量
      const childCount = this.signDataByParentId[category.id] ? this.signDataByParentId[category.id].length : 0;
      return `包含 ${childCount} 个子类`;
    },
    
    // 模拟父分类数据
    getMockParentCategories() {
      return [
        { id: 1, name: '日常用语', type: 'parent' },
        { id: 2, name: '基础手语', type: 'parent' },
        { id: 3, name: '家庭生活', type: 'parent' },
        { id: 4, name: '工作场景', type: 'parent' },
        { id: 5, name: '社交礼仪', type: 'parent' },
        { id: 6, name: '情感表达', type: 'parent' },
        { id: 7, name: '数字时间', type: 'parent' },
        { id: 8, name: '旅行交通', type: 'parent' }
      ];
    },
    
    // 模拟最近学习数据
    getMockRecentLearning() {
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
// Enhanced color palette with semantic variable names
$primary-color: #3C8999;
$primary-light: #55a5b5;
$primary-dark: #2a6b78;
$accent-color: #FF9B50;
$accent-light: #FFB176;
$accent-dark: #E97F30;
$text-color: #333333;
$text-light: #666666;
$text-lighter: #999999;
$background-color: #f5f5f5;
$card-background: #ffffff;
$success-color: #52c41a;
$warning-color: #faad14;
$error-color: #ff4d4f;

// Enhanced border radius variables for consistent roundness
$border-radius-xs: 6rpx;
$border-radius-sm: 10rpx;
$border-radius-md: 20rpx;
$border-radius-lg: 30rpx;
$border-radius-xl: 40rpx;
$border-radius-circle: 50%;

// Enhanced shadows with depth variables
$shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
$shadow-md: 0 4rpx 15rpx rgba(0, 0, 0, 0.08);
$shadow-lg: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
$shadow-inner: inset 0 2rpx 5rpx rgba(0, 0, 0, 0.05);
$shadow-primary: 0 6rpx 16rpx rgba($primary-color, 0.2);
$shadow-accent: 0 6rpx 16rpx rgba($accent-color, 0.2);

// Transition variables
$transition-fast: 0.2s;
$transition-base: 0.3s;
$transition-slow: 0.5s;

// Enhanced animations
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

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { transform: translateX(30rpx); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Main container styles
.vocabulary-container {
  min-height: 100vh;
  background-color: $background-color;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: env(safe-area-inset-bottom);
  
  // Enhanced background with soft gradient
  .background-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40vh;
    background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
    border-bottom-left-radius: $border-radius-lg;
    border-bottom-right-radius: $border-radius-lg;
    overflow: hidden;
    pointer-events: none;
    
    // Add subtle texture overlay
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIiBvcGFjaXR5PSIwLjA1Ij48Y2lyY2xlIGN4PSIzIiBjeT0iMyIgcj0iMi41Ij48L2NpcmNsZT48L3N2Zz4=');
      opacity: 0.07;
    }
    
    .circle {
      position: absolute;
      border-radius: $border-radius-circle;
      background: linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
      
      &.circle-1 {
        top: -100rpx;
        right: -100rpx;
        width: 400rpx;
        height: 400rpx;
        animation: pulse 8s infinite ease-in-out;
      }
      
      &.circle-2 {
        bottom: -150rpx;
        left: -150rpx;
        width: 450rpx;
        height: 450rpx;
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
  
  .vocabulary-content {
    flex: 1;
    padding: 0 30rpx;
    position: relative;
    z-index: 1;
    
    // Enhanced header with modern design
    .vocabulary-header {
      padding: 40rpx 0 50rpx;
      color: #fff;
      position: relative;
      z-index: 1;
      
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25rpx;
        
        .logo-area {
          display: flex;
          align-items: center;
          
          .mini-logo {
            width: 60rpx;
            height: 60rpx;
            border-radius: $border-radius-circle;
            margin-right: 15rpx;
            box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
          }
          
          .header-title {
            font-size: 40rpx;
            font-weight: 700;
            text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
            letter-spacing: 1rpx;
          }
        }
        
        .search-button {
          width: 70rpx;
          height: 70rpx;
          background-color: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10rpx);
          border-radius: $border-radius-circle;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: $shadow-sm;
          transition: transform $transition-base, background-color $transition-base;
          
          &:active {
            transform: scale(0.95);
            background-color: rgba(255, 255, 255, 0.3);
          }
          
          .icon-search {
            font-size: 36rpx;
            color: #fff;
          }
        }
      }
      
      .header-subtitle {
        text-align: center;
        margin-top: 10rpx;
        
        text {
          font-size: 28rpx;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10rpx);
          padding: 8rpx 25rpx;
          border-radius: $border-radius-xl;
          box-shadow: $shadow-sm;
        }
      }
    }
    
    // Enhanced section titles
    .section-title {
      font-size: 34rpx;
      color: $text-color;
      font-weight: 700;
      display: block;
      margin-bottom: 25rpx;
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
        border-radius: $border-radius-xs;
      }
    }
    
    // Enhanced featured categories section
    .featured-categories {
      margin-bottom: 45rpx;
      animation: fadeIn $transition-base;
      
      .category-scroll {
        padding: 10rpx 0;
        white-space: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        
        &::-webkit-scrollbar {
          display: none;
        }
        
        .featured-item {
          display: inline-block;
          margin-right: 35rpx;
          text-align: center;
          transition: transform $transition-base;
          
          &:active {
            transform: scale(0.95);
          }
          
          .featured-icon {
            width: 120rpx;
            height: 120rpx;
            border-radius: $border-radius-circle;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15rpx;
            box-shadow: $shadow-md;
            position: relative;
            overflow: hidden;
            
            // Add subtle shimmer effect
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
                rgba(255,255,255,0.3) 50%,
                rgba(255,255,255,0) 100%
              );
              background-size: 200% 100%;
              animation: shimmer 3s infinite;
            }
            
            .iconfont {
              font-size: 54rpx;
              color: #fff;
              position: relative;
              z-index: 1;
            }
            
            &.icon-color-0 { background: linear-gradient(135deg, #4dabf7, #2b8fda); }
            &.icon-color-1 { background: linear-gradient(135deg, #74c0fc, #4a9cdb); }
            &.icon-color-2 { background: linear-gradient(135deg, #66d9e8, #36b9ca); }
            &.icon-color-3 { background: linear-gradient(135deg, #3bc9db, #1ba4b6); }
          }
          
          .featured-name {
            font-size: 28rpx;
            color: $text-color;
            font-weight: 500;
            white-space: nowrap;
          }
        }
      }
    }
    
    // Recent Learning section
    .recent-learning {
      margin-bottom: 45rpx;
      animation: fadeIn calc($transition-base + 0.1s);
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .view-all {
          font-size: 26rpx;
          color: $primary-color;
          background-color: rgba($primary-color, 0.1);
          padding: 8rpx 20rpx;
          border-radius: $border-radius-xl;
          transition: background-color $transition-base;
          
          &:active {
            background-color: rgba($primary-color, 0.2);
          }
        }
      }
      
      .recent-scroll {
        padding: 10rpx 0;
        white-space: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        
        &::-webkit-scrollbar {
          display: none;
        }
        
        .recent-item {
          display: inline-block;
          margin-right: 25rpx;
          width: 200rpx;
          background-color: $card-background;
          border-radius: $border-radius-lg;
          overflow: hidden;
          box-shadow: $shadow-md;
          transition: transform $transition-base;
          
          &:active {
            transform: scale(0.97);
          }
          
          .recent-image {
            width: 200rpx;
            height: 150rpx;
            background-color: #f0f0f0;
            object-fit: cover;
          }
          
          .recent-info {
            padding: 15rpx;
            
            .recent-name {
              font-size: 28rpx;
              color: $text-color;
              font-weight: 600;
              margin-bottom: 5rpx;
              display: block;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .recent-pinyin {
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
    
    // Enhanced main categories grid
    .main-categories {
      margin-bottom: 45rpx;
      animation: fadeIn calc($transition-base + 0.2s);
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25rpx;
        
        .filter-dropdown {
          .filter-button {
            display: flex;
            align-items: center;
            background-color: rgba($primary-color, 0.1);
            padding: 8rpx 20rpx;
            border-radius: $border-radius-xl;
            
            text {
              font-size: 26rpx;
              color: $primary-color;
              
              &.icon-down {
                margin-left: 8rpx;
                font-size: 24rpx;
              }
            }
          }
        }
      }
      
      .category-grid {
        .category-card {
          background-color: $card-background;
          border-radius: $border-radius-lg;
          padding: 25rpx;
          margin-bottom: 25rpx;
          box-shadow: $shadow-md;
          display: flex;
          align-items: center;
          transition: transform $transition-base, box-shadow $transition-base;
          animation: slideInRight $transition-base;
          animation-fill-mode: both;
          
          // Staggered animation for cards
          @for $i from 0 through 5 {
            &:nth-child(#{$i + 1}) {
              animation-delay: #{$i * 0.05}s;
            }
          }
          
          &:active {
            transform: translateY(3rpx);
            box-shadow: $shadow-sm;
          }
          
          .category-icon {
            width: 90rpx;
            height: 90rpx;
            border-radius: $border-radius-md;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 25rpx;
            flex-shrink: 0;
            
            .iconfont {
              font-size: 44rpx;
              color: #fff;
              text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.2);
            }
            
            &.bg-color-0 { background: linear-gradient(135deg, #4dabf7, #2b8fda); }
            &.bg-color-1 { background: linear-gradient(135deg, #74c0fc, #4a9cdb); }
            &.bg-color-2 { background: linear-gradient(135deg, #a5d8ff, #76b0da); }
            &.bg-color-3 { background: linear-gradient(135deg, #66d9e8, #36b9ca); }
            &.bg-color-4 { background: linear-gradient(135deg, #3bc9db, #1ba4b6); }
          }
          
          .category-info {
            flex: 1;
            overflow: hidden;
            
            .category-name {
              font-size: 32rpx;
              color: $text-color;
              font-weight: 600;
              margin-bottom: 8rpx;
              display: block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            .category-desc {
              font-size: 26rpx;
              color: $text-lighter;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
          
          .category-arrow {
            font-size: 36rpx;
            color: #ddd;
            margin-left: 15rpx;
            transition: transform $transition-base;
          }
          
          &:active .category-arrow {
            transform: translateX(5rpx);
          }
        }
      }
      
      // Enhanced pagination controls
      .pagination {
        display: flex;
        justify-content: center;
        margin: 40rpx 0 20rpx;
        
        .page-controls {
          display: flex;
          align-items: center;
          background-color: $card-background;
          border-radius: $border-radius-xl;
          padding: 8rpx;
          box-shadow: $shadow-sm;
          
          .page-btn {
            height: 60rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: $primary-color;
            color: #fff;
            border-radius: $border-radius-xl;
            font-size: 26rpx;
            min-width: 90rpx;
            padding: 0 20rpx;
            box-shadow: $shadow-primary;
            margin: 0 5rpx;
            transition: transform $transition-base, box-shadow $transition-base;
            
            &.first-btn, &.last-btn {
              font-size: 24rpx;
              background-color: rgba($primary-color, 0.9);
            }
            
            &:active:not(.disabled) {
              transform: scale(0.95);
              box-shadow: $shadow-sm;
            }
            
            &.disabled {
              background-color: #eee;
              color: $text-lighter;
              box-shadow: none;
            }
          }
          
          .page-indicator {
            min-width: 100rpx;
            text-align: center;
            padding: 0 15rpx;
            
            text {
              font-size: 28rpx;
              color: $text-light;
            }
          }
        }
      }
    }
    
    // Enhanced loading and empty states
    .loading-state, .empty-state {
      height: 300rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60rpx 0;
      animation: fadeIn $transition-base;
      margin-top: 60rpx;
      
      .loader {
        width: 70rpx;
        height: 70rpx;
        border-radius: $border-radius-circle;
        border: 4rpx solid rgba($primary-color, 0.1);
        border-top-color: $primary-color;
        animation: spin 1s infinite linear;
        margin-bottom: 30rpx;
      }
      
      .empty-image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 30rpx;
        opacity: 0.7;
      }
      
      .empty-title {
        font-size: 32rpx;
        color: $text-color;
        font-weight: 600;
        margin-bottom: 15rpx;
      }
      
      .empty-subtitle {
        font-size: 28rpx;
        color: $text-lighter;
        text-align: center;
        max-width: 80%;
        margin-bottom: 25rpx;
      }
      
      .retry-button {
        margin-top: 10rpx;
        background-color: $primary-color;
        color: #fff;
        font-size: 28rpx;
        padding: 15rpx 40rpx;
        border-radius: $border-radius-lg;
        box-shadow: $shadow-primary;
        transition: transform $transition-base, box-shadow $transition-base;
        
        &:active {
          transform: scale(0.95);
          box-shadow: $shadow-sm;
        }
      }
    }
  }
  
  // Fixed action buttons
  .fixed-actions {
    position: fixed;
    right: 30rpx;
    bottom: calc(30rpx + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 100;
    
    .action-button {
      width: 100rpx;
      height: 100rpx;
      border-radius: $border-radius-circle;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: $shadow-lg;
      margin-top: 20rpx;
      transition: transform $transition-base, box-shadow $transition-base;
      
      &:active {
        transform: scale(0.95);
        box-shadow: $shadow-md;
      }
      
      .iconfont {
        font-size: 45rpx;
        color: #fff;
      }
      
      &.search-action {
        background: linear-gradient(135deg, $primary-light, $primary-color);
        display: none; // Hide on larger screens as header search is visible
      }
      
      &.add-action {
        background: linear-gradient(135deg, $accent-color, $accent-dark);
      }
    }
  }
}

// Responsive adjustments
@media screen and (max-width: 375px) {
  // Small phone adjustments
  .vocabulary-container {
    .fixed-actions {
      .action-button.search-action {
        display: flex; // Show on small screens where header might be cramped
      }
    }
    
    .vocabulary-content {
      .featured-categories {
        .category-scroll {
          .featured-item {
            .featured-icon {
              width: 100rpx;
              height: 100rpx;
              
              .iconfont {
                font-size: 48rpx;
              }
            }
            
            .featured-name {
              font-size: 26rpx;
            }
          }
        }
      }
    }
  }
}

// For mobile landscape and tablets
@media screen and (min-width: 768px) {
  .vocabulary-container {
    .vocabulary-content {
      .main-categories {
        .category-grid {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -10rpx;
          
          .category-card {
            width: calc(50% - 20rpx);
            margin: 0 10rpx 20rpx;
          }
        }
      }
    }
  }
}
</style>