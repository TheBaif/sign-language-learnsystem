<template>
  <view class="vocabulary-container">
    <!-- Header with Title and Search -->
    <view class="vocabulary-header">
      <view class="header-top">
        <view class="back-button" @tap="navigateBack"><
        </view>
        <text class="header-title">手语词库</text>
        <view class="search-button" @tap="navigateToSearch">
          搜索
        </view>
      </view>
      
      <view class="header-subtitle">
        <text>探索丰富的手语词汇世界</text>
      </view>
    </view>
    
    <!-- Main Content -->
    <scroll-view scroll-y class="vocabulary-content" enable-back-to-top>
      <!-- Top Categories -->
      <view class="featured-categories" v-if="!loading">
        
      </view>
      
      
      
      <!-- Main Categories -->
      <view class="main-categories" v-if="!loading && parentCategories.length > 0">
        <view class="section-header">
          <text class="section-title">全部分类</text>
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
        
        <!-- Pagination -->
        <view class="pagination" v-if="parentCategories.length > parentPageSize">
          <view class="page-controls">
            <view 
              class="page-btn" 
              :class="{ disabled: parentCurrentPage <= 1 }" 
              @tap="goToParentPrevPage"
            >上一页
            </view>
            <view class="page-indicator">
              <text>{{ parentCurrentPage }}/{{ parentTotalPages }}</text>
            </view>
            <view 
              class="page-btn" 
              :class="{ disabled: parentCurrentPage >= parentTotalPages }" 
              @tap="goToParentNextPage"
            >下一页
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
        <text class="empty-text">暂无词库数据</text>
        <view class="retry-button" @tap="fetchParentCategories">
          <text>重新加载</text>
        </view>
      </view>
    </scroll-view>
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
      recommendedSigns: [],
      
      // 分页相关
      parentCurrentPage: 1,
      parentPageSize: 6,
      
      // 特色分类
      featuredCategories: [
        { id: 'daily', name: '日常用语', icon: '&#xe65c;' },
        { id: 'beginner', name: '初学必备', icon: '&#xe665;' },
        { id: 'family', name: '家庭生活', icon: '&#xe66a;' },
        { id: 'work', name: '工作场景', icon: '&#xe667;' }
      ]
    }
  },
  
  onLoad() {
    this.checkLogin();
  },
  
  onShow() {
    this.checkLogin();
    this.getRecommendations();
  },
  
  computed: {
    // 父分类总页数
    parentTotalPages() {
      return Math.ceil(this.parentCategories.length / this.parentPageSize);
    },
    
    // 当前页显示的父分类
    displayedParentCategories() {
      const start = (this.parentCurrentPage - 1) * this.parentPageSize;
      const end = start + this.parentPageSize;
      return this.parentCategories.slice(start, end);
    }
  },
  
  methods: {
    navigateBack() {
      uni.navigateBack();
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
    
    // 获取推荐内容
    async getRecommendations() {
      try {
        const res = await http.get('/learning/recommendations', {
          params: { limit: 10 }
        });
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.recommendedSigns = res.data.data || [];
        } else {
          // 使用模拟数据作为后备
          this.recommendedSigns = this.getMockRecommendations();
        }
      } catch (error) {
        console.error('获取推荐失败:', error);
        // 使用模拟数据作为后备
        this.recommendedSigns = this.getMockRecommendations();
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
    
    // 跳转到推荐页面
    navigateToRecommendation() {
      uni.navigateTo({
        url: '/pages/recommendation/recommendation'
      });
    },
    
    // 父分类分页控制方法
    goToParentPrevPage() {
      if (this.parentCurrentPage <= 1 || this.loading) return;
      this.parentCurrentPage--;
    },
    
    goToParentNextPage() {
      if (this.parentCurrentPage >= this.parentTotalPages || this.loading) return;
      this.parentCurrentPage++;
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
    
    // 模拟推荐数据
    getMockRecommendations() {
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
.vocabulary-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  
  .vocabulary-header {
    background: linear-gradient(to right, #3C8999, #55a5b5);
    padding: 30rpx 30rpx 40rpx;
    color: #fff;
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .back-button, .search-button {
        width: 60rpx;
        height: 60rpx;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 25rpx;
        display: flex;
        align-items: center;
        justify-content: center;
		font-size: 30rpx;
        
        .iconfont {
          font-size: 36rpx;
          color: #fff;
        }
      }
      
      .header-title {
        font-size: 36rpx;
        font-weight: bold;
      }
    }
    
    .header-subtitle {
      text-align: center;
      
      text {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
  
  .vocabulary-content {
    flex: 1;
    padding: 30rpx;
    
    .section-title {
      font-size: 32rpx;
      color: #333;
      font-weight: bold;
      display: block;
      margin-bottom: 20rpx;
    }
    
    .featured-categories {
      margin-bottom: 40rpx;
      
      .category-scroll {
        white-space: nowrap;
        
        .featured-item {
          display: inline-block;
          margin-right: 30rpx;
          text-align: center;
          
          .featured-icon {
            width: 100rpx;
            height: 100rpx;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15rpx;
            
            .iconfont {
              font-size: 50rpx;
              color: #fff;
            }
            
            &.icon-color-0 {
              background-color: #4dabf7;
            }
            
            &.icon-color-1 {
              background-color: #74c0fc;
            }
            
            &.icon-color-2 {
              background-color: #66d9e8;
            }
            
            &.icon-color-3 {
              background-color: #3bc9db;
            }
          }
          
          .featured-name {
            font-size: 26rpx;
            color: #333;
          }
        }
      }
    }
    
    .recommendation-section {
      margin-bottom: 40rpx;
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .view-all {
          font-size: 26rpx;
          color: #3C8999;
        }
      }
      
      .recommendation-scroll {
        white-space: nowrap;
        
        .recommendation-item {
          display: inline-block;
          margin-right: 20rpx;
          width: 180rpx;
          
          .recommendation-image {
            width: 180rpx;
            height: 180rpx;
            border-radius: 16rpx;
            background-color: #f0f0f0;
            margin-bottom: 10rpx;
          }
          
          .recommendation-name {
            font-size: 26rpx;
            color: #333;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
    
    .main-categories {
      .section-header {
        margin-bottom: 20rpx;
      }
      
      .category-grid {
        .category-card {
          background-color: #fff;
          border-radius: 16rpx;
          padding: 30rpx;
          margin-bottom: 20rpx;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          
          .category-icon {
            width: 80rpx;
            height: 80rpx;
            border-radius: 16rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20rpx;
            
            .iconfont {
              font-size: 40rpx;
              color: #fff;
            }
            
            &.bg-color-0 {
              background-color: #4dabf7;
            }
            
            &.bg-color-1 {
              background-color: #74c0fc;
            }
            
            &.bg-color-2 {
              background-color: #a5d8ff;
            }
            
            &.bg-color-3 {
              background-color: #66d9e8;
            }
            
            &.bg-color-4 {
              background-color: #3bc9db;
            }
          }
          
          .category-info {
            flex: 1;
            
            .category-name {
              font-size: 30rpx;
              color: #333;
              font-weight: 500;
              margin-bottom: 6rpx;
              display: block;
            }
            
            .category-desc {
              font-size: 24rpx;
              color: #999;
            }
          }
          
          .category-arrow {
            font-size: 32rpx;
            color: #ccc;
            margin-left: 10rpx;
          }
        }
      }
      
      .pagination {
        display: flex;
        justify-content: center;
        margin: 30rpx 0;
        
        .page-controls {
          display: flex;
          align-items: center;
          
          .page-btn {
            height: 56rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #3C8999;
            color: #fff;
            border-radius: 28rpx;
            font-size: 24rpx;
            min-width: 80rpx;
            padding: 0 15rpx;
            box-shadow: 0 2rpx 6rpx rgba(60, 137, 153, 0.2);
            
            .iconfont {
              font-size: 32rpx;
              color: #fff;
            }
            
            &.disabled {
              background-color: #ccc;
              opacity: 0.6;
            }
          }
          
          .page-indicator {
            min-width: 100rpx;
            text-align: center;
            
            text {
              font-size: 28rpx;
              color: #666;
            }
          }
        }
      }
    }
    
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100rpx 0;
      
      .loader {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        border: 4rpx solid rgba(60, 137, 153, 0.1);
        border-top-color: #3C8999;
        animation: spin 1s infinite linear;
        margin-bottom: 20rpx;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      text {
        font-size: 28rpx;
        color: #999;
      }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100rpx 0;
      
      .empty-image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 30rpx;
        opacity: 0.6;
      }
      
      .empty-text {
        font-size: 30rpx;
        color: #999;
        margin-bottom: 30rpx;
      }
      
      .retry-button {
        background-color: #3C8999;
        color: #fff;
        font-size: 28rpx;
        padding: 15rpx 40rpx;
        border-radius: 30rpx;
      }
    }
  }
}
</style>