<template>
  <view class="subcategory-container">
    <!-- Header with Title -->
    <view class="subcategory-header">
      <view class="header-top">
        <view class="back-button" @tap="navigateBack"><
        </view>
        <text class="header-title">{{ parentName || '未命名词库' }}</text>
        <view class="search-button" @tap="navigateToSearch">搜索
        </view>
      </view>
    </view>
    
    <!-- Main Content -->
    <scroll-view scroll-y class="subcategory-content" enable-back-to-top>
      <!-- Loading State -->
      <view v-if="loading" class="loading-state">
        <view class="loader"></view>
        <text>加载分类中...</text>
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
        <view v-else>
          <!-- Header with Info -->
          <view class="section-header">
            <view class="header-info">
              <text class="section-title">子分类</text>
              <text class="section-count">共 {{ subcategories.length }} 项</text>
            </view>
            <view class="view-all-link" @tap="navigateToAllWords">
              <text>查看全部词汇</text>
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
              <view class="card-info">
                <text class="card-title">{{ item.name || '未命名子分类' }}</text>
                <text class="card-desc">{{ getSubcategoryDesc(item) }}</text>
              </view>
              <text class="card-arrow">›</text>
            </view>
          </view>
          
          <!-- Pagination Controls -->
          <view class="pagination-controls" v-if="totalPages > 1">
            <view 
              class="page-btn prev-btn" 
              :class="{ disabled: currentPage <= 1 }"
              @tap="goToPrevPage"
            >上一页
            </view>
            
            <view class="page-numbers">
              <view 
                v-for="page in displayedPageNumbers" 
                :key="page"
                class="page-number"
                :class="{ active: page === currentPage }"
                @tap="goToPage(page)"
              >
                {{ page }}
              </view>
            </view>
            
            <view 
              class="page-btn next-btn" 
              :class="{ disabled: currentPage >= totalPages }"
              @tap="goToNextPage"
            >下一页
            </view>
          </view>
        </view>
        
       
      </block>
    </scroll-view>
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
    
    // 查看手语详情
    viewSignDetail(item) {
      const results = [item];
      uni.setStorageSync('searchResults', results);
      uni.navigateTo({
        url: `/pages/detail/detail?index=0`
      });
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
.subcategory-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  
  .subcategory-header {
    background: linear-gradient(to right, #3C8999, #55a5b5);
    padding: 20rpx 30rpx;
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 80rpx;
      
      .back-button, .search-button {
        width: 60rpx;
        height: 60rpx;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 30rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .iconfont {
          font-size: 36rpx;
          color: #fff;
        }
      }
      
      .header-title {
        font-size: 36rpx;
        color: #fff;
        font-weight: bold;
      }
    }
  }
  
  .subcategory-content {
    flex: 1;
    padding: 30rpx;
    
    .loading-state, .empty-state {
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
      
      .empty-image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 30rpx;
        opacity: 0.6;
      }
      
      .empty-title {
        font-size: 32rpx;
        color: #333;
        font-weight: bold;
        margin-bottom: 10rpx;
      }
      
      .empty-desc {
        font-size: 28rpx;
        color: #999;
        margin-bottom: 40rpx;
      }
      
      .view-all-btn {
        background: linear-gradient(to right, #3C8999, #55a5b5);
        color: #fff;
        font-size: 28rpx;
        padding: 20rpx 40rpx;
        border-radius: 40rpx;
        box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.2);
        
        &::after {
          border: none;
        }
      }
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;
      
      .header-info {
        .section-title {
          font-size: 32rpx;
          color: #333;
          font-weight: bold;
          margin-right: 15rpx;
        }
        
        .section-count {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .view-all-link {
        font-size: 26rpx;
        color: #3C8999;
      }
    }
    
    .subcategory-grid {
      .subcategory-card {
        background-color: #fff;
        border-radius: 16rpx;
        padding: 30rpx;
        margin-bottom: 20rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        
        &:active {
          transform: scale(0.98);
        }
        
        .card-icon {
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
          
          &.color-0 {
            background-color: #4dabf7;
          }
          
          &.color-1 {
            background-color: #74c0fc;
          }
          
          &.color-2 {
            background-color: #66d9e8;
          }
          
          &.color-3 {
            background-color: #3bc9db;
          }
          
          &.color-4 {
            background-color: #63e6be;
          }
          
          &.color-5 {
            background-color: #38d9a9;
          }
        }
        
        .card-info {
          flex: 1;
          
          .card-title {
            font-size: 30rpx;
            color: #333;
            font-weight: 500;
            margin-bottom: 6rpx;
            display: block;
          }
          
          .card-desc {
            font-size: 24rpx;
            color: #999;
          }
        }
        
        .card-arrow {
          font-size: 32rpx;
          color: #ccc;
          margin-left: 10rpx;
        }
      }
    }
    
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 40rpx 0;
      
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
      
      .page-numbers {
        display: flex;
        align-items: center;
        margin: 0 20rpx;
        
        .page-number {
          min-width: 60rpx;
          height: 60rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28rpx;
          color: #666;
          margin: 0 10rpx;
          
          &.active {
            background-color: #f0f0f0;
            border-radius: 30rpx;
            color: #3C8999;
            font-weight: bold;
          }
        }
      }
    }
    
    .popular-section {
      margin-top: 40rpx;
      
      .popular-scroll {
        white-space: nowrap;
        margin: 0 -30rpx;
        padding: 0 30rpx;
        
        .popular-item {
          display: inline-block;
          margin-right: 20rpx;
          width: 180rpx;
          
          .popular-image {
            width: 180rpx;
            height: 180rpx;
            border-radius: 16rpx;
            background-color: #f0f0f0;
            margin-bottom: 10rpx;
          }
          
          .popular-name {
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
  }
}
</style>