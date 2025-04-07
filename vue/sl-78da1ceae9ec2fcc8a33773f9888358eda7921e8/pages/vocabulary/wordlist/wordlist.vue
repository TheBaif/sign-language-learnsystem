<template>
  <view class="wordlist-container">
    <!-- Enhanced Header with Gradient Background -->
    <view class="wordlist-header">
      <view class="header-content">
        <view class="title-container">
          <text class="header-title">{{ childName || parentName || '词汇列表' }}</text>
          <view class="breadcrumb" v-if="parentName">
            <text class="breadcrumb-parent">{{ parentName }}</text>
            <text class="breadcrumb-divider" v-if="childName">›</text>
            <text class="breadcrumb-current">{{ childName }}</text>
          </view>
        </view>
        <view class="search-button" @tap="navigateToSearch">
          
        </view>
      </view>
    </view>
    
    <!-- Main Content -->
    <view class="wordlist-content">
      <!-- Filter and Sort Controls -->
      <view class="controls-section" v-if="!loading && wordList.length > 0">
        <view class="sort-controls">
          <view class="sort-label">排序方式:</view>
          <picker 
            :value="sortIndex" 
            :range="sortOptions" 
            @change="changeSort"
            class="sort-picker"
          >
            <view class="sort-display">
              <text>{{ sortOptions[sortIndex] }}</text>
              <text class="sort-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="results-count">
          <text>找到 {{ wordList.length }} 个词汇</text>
        </view>
      </view>
      
      <!-- Loading State -->
      <view v-if="loading" class="loading-state">
        <view class="loader"></view>
        <text class="loading-text">正在加载词汇...</text>
      </view>
      
      <!-- Error State -->
      <view v-else-if="errorMessage" class="error-state">
        <image src="/static/images/error.png" mode="aspectFit" class="error-image"></image>
        <text class="error-title">加载失败</text>
        <text class="error-text">{{ errorMessage }}</text>
        <view class="retry-button" @tap="loadWordList">
          <text>重试</text>
        </view>
      </view>
      
      <!-- Empty State -->
      <view v-else-if="wordList.length === 0" class="empty-state">
        <image src="/static/images/empty.png" mode="aspectFit" class="empty-image"></image>
        <text class="empty-title">暂无词汇</text>
        <text class="empty-desc">该分类下暂时没有词汇内容</text>
        <view class="action-buttons">
          <button class="action-btn return-btn" @tap="navigateBack">返回上级</button>
          <button class="action-btn custom-btn" @tap="navigateToCustomSign">添加词汇</button>
        </view>
      </view>
      
      <!-- Word List Grid -->
      <view v-else class="words-grid">
        <view 
          class="word-card" 
          v-for="(item, index) in displayedWords" 
          :key="index"
          @tap="goToDetail(getDisplayedIndex(index))"
          :style="{ animationDelay: (index * 0.05) + 's' }"
        >
          <view class="word-media">
            <image 
              :src="item.imageSrc || '/static/images/placeholder-sign.png'" 
              mode="aspectFill"
              class="word-image"
              @error="handleImageError"
            ></image>
            <view class="word-badge" v-if="item.difficulty">
              <text>{{ getDifficultyText(item.difficulty) }}</text>
            </view>
          </view>
          
          <view class="word-info">
            <text class="word-name">{{ item.name }}</text>
            <text class="word-pinyin">{{ item.pinyin || '无拼音' }}</text>
            <text class="word-category" v-if="item.parentName">
              {{ item.parentName }}{{ item.childName ? ' › ' + item.childName : '' }}
            </text>
          </view>
          
          <view class="word-action">
          </view>
        </view>
      </view>
      
      <!-- Enhanced Pagination -->
      <view class="pagination" v-if="!loading && wordList.length > 0 && totalPages > 1">
        <view class="page-info">
          <text>{{ currentPage }}/{{ totalPages }}</text>
        </view>
        
        <view class="page-controls">
          <view 
            class="page-btn first-btn" 
            :class="{ disabled: currentPage <= 1 }" 
            @tap="goToFirstPage"
          >
            <text>首页</text>
          </view>
          
          <view 
            class="page-btn" 
            :class="{ disabled: currentPage <= 1 }" 
            @tap="goToPrevPage"
          >
            <text>上一页</text>
          </view>
          
          <view class="page-numbers">
            <view 
              v-for="page in getPageNumbers()" 
              :key="page"
              class="page-number"
              :class="{ active: page === currentPage, ellipsis: page === '...' }"
              @tap="goToPage(page)"
            >
              {{ page }}
            </view>
          </view>
          
          <view 
            class="page-btn" 
            :class="{ disabled: currentPage >= totalPages }" 
            @tap="goToNextPage"
          >
            <text>下一页</text>
          </view>
          
          <view 
            class="page-btn last-btn" 
            :class="{ disabled: currentPage >= totalPages }" 
            @tap="goToLastPage"
          >
            <text>尾页</text>
          </view>
        </view>
      </view>
      
      <!-- Scroll-to-top Button -->
      <view 
        class="scroll-top-btn" 
        v-if="showScrollTopBtn"
        @tap="scrollToTop"
        :class="{ visible: showScrollTopBtn }"
      >
        <text class="scroll-icon">▲</text>
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
      parentId: '',
      parentName: '',
      childId: '',
      childName: '',
      loading: true,
      errorMessage: '',
      wordList: [],
      currentPage: 1,
      pageSize: 12,
      sortIndex: 0,
      sortOptions: ['默认排序', '按名称升序', '按名称降序', '按难度排序'],
      showScrollTopBtn: false,
      scrollTop: 0,
      imageErrorCounts: {}
    }
  },
  
  computed: {
    // 计算总页数
    totalPages() {
      return Math.ceil(this.wordList.length / this.pageSize) || 1;
    },
    
    // 当前页显示的词汇
    displayedWords() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = Math.min(start + this.pageSize, this.wordList.length);
      return this.wordList.slice(start, end);
    }
  },
  
  onLoad(options) {
    console.log('词汇列表页接收到的参数:', options);
    
    // 获取路由参数
    if (options.parentId) {
      this.parentId = options.parentId;
    }
    
    if (options.parentName) {
      this.parentName = decodeURIComponent(options.parentName || '');
    }
    
    if (options.childId) {
      this.childId = options.childId;
    }
    
    if (options.childName) {
      this.childName = decodeURIComponent(options.childName || '');
    }
    
    // 先检查登录状态，再加载数据
    this.checkLogin();
    
    // 设置滚动监听
    uni.onPageScroll(e => {
      this.scrollTop = e.scrollTop;
      this.showScrollTopBtn = e.scrollTop > 300;
    });
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
    
    navigateToCustomSign() {
      uni.navigateTo({
        url: '/pages/custom-sign/custom-sign'
      });
    },
    
    // 滚动到顶部
    scrollToTop() {
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
    },
    
    // 获取分页显示的页码数组
    getPageNumbers() {
      const currentPage = this.currentPage;
      const totalPages = this.totalPages;
      const pages = [];
      
      if (totalPages <= 5) {
        // 总页数少于5页，显示所有页码
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 总页数大于5页，显示部分页码
        pages.push(1); // 始终显示第一页
        
        if (currentPage > 3) {
          pages.push('...'); // 前省略号
        }
        
        // 显示当前页附近的页码
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
        
        if (currentPage < totalPages - 2) {
          pages.push('...'); // 后省略号
        }
        
        pages.push(totalPages); // 始终显示最后一页
      }
      
      return pages;
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
      
      // 有token，加载词汇列表
      this.loadWordList();
    },
    
    // 加载词汇列表
    async loadWordList() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        // 确保token存在
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('未登录');
        }
        
        // 构建请求参数
        const queryParams = {};
        
        // 添加条件参数 - 确保转为整数类型
        if (this.parentId) {
          queryParams.parentId = parseInt(this.parentId, 10);
          console.log('父分类ID:', queryParams.parentId, typeof queryParams.parentId);
        }
        
        if (this.childId) {
          queryParams.childId = parseInt(this.childId, 10);
          console.log('子分类ID:', queryParams.childId, typeof queryParams.childId);
        }
        
        // 设置分页参数 - 一次获取较多数据，前端分页显示
        queryParams.pageNum = 1;
        queryParams.pageSize = 100;
        
        console.log('请求参数:', queryParams);
        
        // 发起请求 - 确保传递token
        const res = await http.get('/sign/list', {
          params: queryParams,
          header: {
            'Authorization': token
          }
        });
        
        console.log('API响应状态:', res.statusCode);
        
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          console.log('API响应详情:', res.data);
          
          // 处理数据 - 灵活处理不同结构
          if (res.data.data && res.data.data.records) {
            // 分页结构
            this.wordList = res.data.data.records;
            console.log('找到分页结构数据');
          } else if (res.data.data && Array.isArray(res.data.data)) {
            // 直接数组
            this.wordList = res.data.data;
            console.log('找到数组结构数据');
          } else if (typeof res.data.data === 'object' && res.data.data !== null) {
            // 其他对象结构，尝试提取有用数据
            console.log('未识别的数据结构, 尝试解析:', res.data.data);
            const possibleArrays = Object.values(res.data.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              this.wordList = possibleArrays[0];
              console.log('从对象中提取数组数据');
            } else {
              console.warn('无法提取数组数据');
              this.wordList = [];
            }
          } else {
            console.warn('未找到有效数据结构');
            this.wordList = [];
          }
          
          // 重置分页状态
          this.currentPage = 1;
          
          console.log('处理后的词汇列表:', this.wordList);
          
          // 检查是否找到数据
          if (this.wordList.length === 0) {
            console.log('API返回成功但没有数据, 使用模拟数据');
            this.wordList = this.getMockWords();
          }
          
          // 按当前排序方式排序
          this.sortWordList();
          
          // 记录学习活动 - 浏览分类
          this.recordLearningActivity();
        } else {
          console.error('API错误:', res.data ? res.data.message || '获取失败' : '未获取到响应数据');
          throw new Error(res.data ? res.data.message || '获取失败' : '服务器未返回数据');
        }
      } catch (error) {
        console.error('获取词汇列表失败:', error);
        this.errorMessage = `获取词汇列表失败: ${error.message || '请检查网络'}`;
        
        // 使用模拟数据
        console.log('错误后使用模拟数据');
        this.wordList = this.getMockWords();
        this.errorMessage = '';
      } finally {
        this.loading = false;
      }
    },
    
    // 记录学习活动
    async recordLearningActivity(signId = null) {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          console.error('未登录，无法记录学习活动');
          return;
        }
        
        // 如果提供了signId，记录具体词汇的学习
        // 否则仅记录浏览分类的活动
        const activityData = signId ? { signId } : { activityType: 'browseCategory' };
        
        await http.post('/learning/record', activityData, {
          header: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        console.log('学习活动已记录');
      } catch (error) {
        console.error('记录学习活动失败:', error);
      }
    },
    
    // 获取原始索引（分页后的索引转为原始数组索引）
    getDisplayedIndex(index) {
      return (this.currentPage - 1) * this.pageSize + index;
    },
    
    // 前往详情页
    goToDetail(index) {
      // 格式化数据并存储
      const standardData = detailHelper.prepareDetailData(this.wordList);
      uni.setStorageSync('searchResults', standardData);
      
      // 记录学习行为
      this.recordLearningActivity(this.wordList[index].id);
      
      // 跳转到详情页
      uni.navigateTo({
        url: `/pages/detail/detail?index=${index}`
      });
    },
    
    // 处理图片加载错误
    handleImageError(e) {
      console.warn('图片加载失败:', e);
    },
    
    // 获取难度文本
    getDifficultyText(difficulty) {
      const difficultyMap = {
        'BEGINNER': '初级',
        'INTERMEDIATE': '中级',
        'ADVANCED': '高级'
      };
      return difficultyMap[difficulty] || '未知';
    },
    
    // 分页控制方法
    goToFirstPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage = 1;
      this.scrollToTop();
    },
    
    goToPrevPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage--;
      this.scrollToTop();
    },
    
    goToNextPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage++;
      this.scrollToTop();
    },
    
    goToLastPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage = this.totalPages;
      this.scrollToTop();
    },
    
    goToPage(page) {
      if (page === '...' || this.loading) return;
      this.currentPage = page;
      this.scrollToTop();
    },
    
    // 排序方法
    changeSort(e) {
      this.sortIndex = parseInt(e.detail.value);
      this.sortWordList();
    },
    
    sortWordList() {
      switch(this.sortIndex) {
        case 1: // 按名称升序
          this.wordList.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
          break;
        case 2: // 按名称降序
          this.wordList.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'));
          break;
        case 3: // 按难度排序
          this.wordList.sort((a, b) => {
            const difficultyLevel = {
              'BEGINNER': 1,
              'INTERMEDIATE': 2,
              'ADVANCED': 3
            };
            return (difficultyLevel[a.difficulty] || 0) - (difficultyLevel[b.difficulty] || 0);
          });
          break;
        default: // 默认排序 (id升序)
          this.wordList.sort((a, b) => a.id - b.id);
          break;
      }
      
      // 重置到第一页
      this.currentPage = 1;
      this.scrollToTop();
    },
    
    // 模拟词汇数据
    getMockWords() {
      return [
        {
          id: 1,
          name: '你好', 
          pinyin: 'nǐ hǎo', 
          gesture: '右手五指并拢，手心向内|||置于胸前，轻拍两下|||微笑示意', 
          imageSrc: '/static/images/nihao.jpg', 
          wordVideoSrc: '/static/videos/nihao.mp4',
          difficulty: 'BEGINNER',
          parentName: this.parentName || '日常用语',
          childName: this.childName || '问候语'
        },
        {
          id: 2,
          name: '再见', 
          pinyin: 'zài jiàn', 
          gesture: '五指并拢，手掌向前|||左右摆动手腕，示意告别', 
          imageSrc: '/static/images/zaijian.jpg', 
          wordVideoSrc: '/static/videos/zaijian.mp4',
          difficulty: 'BEGINNER',
          parentName: this.parentName || '日常用语',
          childName: this.childName || '问候语'
        },
        {
          id: 3,
          name: '朋友', 
          pinyin: 'péng yǒu', 
          gesture: '两手食指勾在一起|||轻轻摇晃，表示连接', 
          imageSrc: '/static/images/pengyou.jpg', 
          wordVideoSrc: '/static/videos/pengyou.mp4',
          difficulty: 'INTERMEDIATE',
          parentName: this.parentName || '人际关系',
          childName: this.childName || '社交词汇'
        },
        {
          id: 4,
          name: '谢谢', 
          pinyin: 'xiè xie', 
          gesture: '右手五指并拢，放于胸前|||向前轻推，表示感谢', 
          imageSrc: '/static/images/xiexie.jpg', 
          wordVideoSrc: '/static/videos/xiexie.mp4',
          difficulty: 'BEGINNER',
          parentName: this.parentName || '日常用语',
          childName: this.childName || '礼貌用语'
        },
        {
          id: 5,
          name: '对不起', 
          pinyin: 'duì bù qǐ', 
          gesture: '右手握拳放于胸前|||轻轻画圈，表示歉意', 
          imageSrc: '/static/images/duibuqi.jpg', 
          wordVideoSrc: '/static/videos/duibuqi.mp4',
          difficulty: 'INTERMEDIATE',
          parentName: this.parentName || '日常用语',
          childName: this.childName || '礼貌用语'
        },
        {
          id: 6,
          name: '家人', 
          pinyin: 'jiā rén', 
          gesture: '双手合并形成屋顶形状|||表示家的温暖', 
          imageSrc: '/static/images/jiaren.jpg', 
          wordVideoSrc: '/static/videos/jiaren.mp4',
          difficulty: 'INTERMEDIATE',
          parentName: this.parentName || '人际关系',
          childName: this.childName || '关系词汇'
        }
      ];
    }
  }
}
</script>

<style lang="scss">
// Colors
$primary-color: #3C8999;
$primary-light: #55a5b5;
$primary-dark: #2a6b78;
$accent-color: #FF9B50;
$text-color: #333;
$text-light: #666;
$text-lighter: #999;
$background-color: #f8f8f8;
$card-background: #ffffff;
$success-color: #52c41a;
$warning-color: #faad14;
$error-color: #ff4d4f;
$border-radius-sm: 8rpx;
$border-radius-md: 16rpx;
$border-radius-lg: 24rpx;
$box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
$box-shadow-hover: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
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

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
  100% { transform: translateY(0); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.wordlist-container {
  min-height: 100vh;
  background-color: $background-color;
  position: relative;
  
  // Enhanced Header
  .wordlist-header {
    height: 240rpx;
    background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
    position: relative;
    overflow: hidden;
    
    // Decorative elements
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
      padding: 40rpx 30rpx 30rpx;
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
        box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
        
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
        padding-right: 90rpx;
        
        .header-title {
          font-size: 40rpx;
          font-weight: bold;
          color: #fff;
          margin-bottom: 15rpx;
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .breadcrumb {
          display: flex;
          align-items: center;
          justify-content: center;
          
          .breadcrumb-parent {
            font-size: 26rpx;
            color: rgba(255, 255, 255, 0.8);
          }
          
          .breadcrumb-divider {
            margin: 0 10rpx;
            font-size: 26rpx;
            color: rgba(255, 255, 255, 0.7);
          }
          
          .breadcrumb-current {
            font-size: 26rpx;
            color: #fff;
            font-weight: 500;
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
        box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
        
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
  .wordlist-content {
    position: relative;
    padding: 0 30rpx 40rpx;
    margin-top: -40rpx;
    
    // Filter and Sort Controls
    .controls-section {
      background-color: #fff;
      border-radius: $border-radius-lg;
      padding: 20rpx 25rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25rpx;
      box-shadow: $box-shadow;
      animation: fadeIn 0.3s ease-out;
      
      .sort-controls {
        display: flex;
        align-items: center;
        
        .sort-label {
          font-size: 26rpx;
          color: $text-light;
          margin-right: 15rpx;
        }
        
        .sort-picker {
          .sort-display {
            display: flex;
            align-items: center;
            background-color: rgba($primary-color, 0.1);
            padding: 8rpx 20rpx;
            border-radius: 20rpx;
            
            text {
              font-size: 26rpx;
              color: $primary-color;
            }
            
            .sort-arrow {
              margin-left: 10rpx;
              font-size: 20rpx;
            }
          }
        }
      }
      
      .results-count {
        font-size: 26rpx;
        color: $text-light;
        background: #f5f5f5;
        padding: 8rpx 20rpx;
        border-radius: 20rpx;
      }
    }
    
    // State Views
    .loading-state, .error-state, .empty-state {
      background-color: #fff;
      border-radius: $border-radius-lg;
      padding: 60rpx 30rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: $box-shadow;
      animation: fadeIn 0.5s ease-out;
      margin-top: 30rpx;
    }
    
    // Loading State
    .loading-state {
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
    
    // Error State
    .error-state {
      .error-image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 30rpx;
        opacity: 0.7;
      }
      
      .error-title {
        font-size: 34rpx;
        font-weight: bold;
        color: $text-color;
        margin-bottom: 10rpx;
      }
      
      .error-text {
        font-size: 28rpx;
        color: $text-light;
        text-align: center;
        margin-bottom: 30rpx;
      }
      
      .retry-button {
        background-color: $primary-color;
        color: #fff;
        font-size: 28rpx;
        padding: 15rpx 40rpx;
        border-radius: 30rpx;
        transition: all $transition-duration;
        box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
        
        &:active {
          transform: scale(0.95);
          box-shadow: 0 2rpx 8rpx rgba($primary-color, 0.2);
        }
      }
    }
    
    // Empty State
    .empty-state {
      .empty-image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 30rpx;
        opacity: 0.7;
      }
      
      .empty-title {
        font-size: 34rpx;
        font-weight: bold;
        color: $text-color;
        margin-bottom: 10rpx;
      }
      
      .empty-desc {
        font-size: 28rpx;
        color: $text-light;
        text-align: center;
        margin-bottom: 30rpx;
      }
      
      .action-buttons {
        display: flex;
        gap: 20rpx;
        
        .action-btn {
          font-size: 28rpx;
          padding: 15rpx 30rpx;
          border-radius: 30rpx;
          transition: all $transition-duration;
          border: none;
          
          &::after {
            border: none;
          }
          
          &:active {
            transform: scale(0.95);
          }
          
          &.return-btn {
            background-color: #f0f0f0;
            color: $text-color;
          }
          
          &.custom-btn {
            background: linear-gradient(135deg, $primary-color, $primary-light);
            color: #fff;
            box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
          }
        }
      }
    }
    
    // Word Grid
    .words-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20rpx;
      margin-bottom: 30rpx;
      
      .word-card {
        background-color: #fff;
        border-radius: $border-radius-lg;
        overflow: hidden;
        box-shadow: $box-shadow;
        transition: all $transition-duration;
        animation: fadeIn 0.5s ease-out both;
        
        &:active {
          transform: translateY(2rpx);
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
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
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          z-index: 1;
          opacity: 0;
          transition: left 0.7s ease-out, opacity 0.7s ease-out;
        }
        
        &:active::after {
          left: 200%;
          opacity: 1;
        }
        
        .word-media {
          position: relative;
          height: 180rpx;
          overflow: hidden;
          
          .word-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform $transition-duration;
          }
          
          .word-badge {
            position: absolute;
            top: 10rpx;
            left: 10rpx;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5rpx);
            border-radius: 15rpx;
            padding: 6rpx 12rpx;
            
            text {
              color: #fff;
              font-size: 22rpx;
            }
          }
          
          .video-indicator {
            position: absolute;
            right: 10rpx;
            bottom: 10rpx;
            width: 50rpx;
            height: 50rpx;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5rpx);
            border-radius: 25rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            
            .video-icon {
              color: #fff;
              font-size: 28rpx;
            }
          }
        }
        
        &:active .word-image {
          transform: scale(1.03);
        }
        
        .word-info {
          padding: 15rpx 20rpx;
          
          .word-name {
            font-size: 28rpx;
            color: $text-color;
            font-weight: bold;
            margin-bottom: 5rpx;
            display: block;
          }
          
          .word-pinyin {
            font-size: 22rpx;
            color: $text-light;
            margin-bottom: 5rpx;
            display: block;
          }
          
          .word-category {
            font-size: 20rpx;
            color: $text-lighter;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
          }
        }
        
        .word-action {
          position: absolute;
          right: 15rpx;
          bottom: 15rpx;
          width: 40rpx;
          height: 40rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          
          .action-icon {
            font-size: 24rpx;
            color: $primary-color;
            opacity: 0.7;
            transition: all $transition-duration;
          }
        }
        
        &:active .action-icon {
          opacity: 1;
          transform: translateX(5rpx);
        }
      }
    }
    
    // Enhanced Pagination
    .pagination {
      margin: 40rpx 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: fadeIn 0.6s ease-out;
      
      .page-info {
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
      
      .page-controls {
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
          
          text {
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
            padding: 10rpx 20rpx;
            
            text {
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
            
            &:active:not(.ellipsis) {
              background: #f0f0f0;
            }
            
            &.active {
              background: rgba($primary-color, 0.15);
              color: $primary-color;
              font-weight: bold;
            }
            
            &.ellipsis {
              color: $text-lighter;
            }
          }
        }
      }
    }
    
    // Scroll to top button
    .scroll-top-btn {
      position: fixed;
      right: 30rpx;
      bottom: 50rpx;
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, $primary-color, $primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6rpx 20rpx rgba($primary-color, 0.4);
      z-index: 99;
      opacity: 0;
      transform: translateY(100rpx);
      transition: all 0.4s ease;
      
      &.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      &:active {
        transform: scale(0.95);
        box-shadow: 0 3rpx 10rpx rgba($primary-color, 0.3);
      }
      
      .scroll-icon {
        font-size: 30rpx;
        color: #fff;
      }
    }
  }
}

/* Responsive Adjustments */
@media screen and (min-width: 768px) {
  .wordlist-container {
    .wordlist-content {
      .words-grid {
        grid-template-columns: repeat(3, 1fr);
        
        @media screen and (min-width: 1024px) {
          grid-template-columns: repeat(4, 1fr);
        }
      }
    }
  }
}

/* Small screen adjustments */
@media screen and (max-width: 340px) {
  .wordlist-container {
    .wordlist-content {
      .words-grid {
        grid-template-columns: 1fr;
      }
      
      .controls-section {
        flex-direction: column;
        align-items: flex-start;
        
        .results-count {
          margin-top: 15rpx;
        }
      }
    }
  }
}
</style>