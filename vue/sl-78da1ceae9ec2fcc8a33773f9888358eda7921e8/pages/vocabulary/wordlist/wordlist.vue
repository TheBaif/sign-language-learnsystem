<template>
  <view class="wordlist-container">
    <!-- Header with Title -->
    <view class="wordlist-header">
      <view class="header-top">
        <view class="back-button" @tap="navigateBack">
          <text class="iconfont">&#xe679;</text>
        </view>
        <text class="header-title">{{ childName || parentName || '词汇列表' }}</text>
        <view class="search-button" @tap="navigateToSearch">
          <text class="iconfont">&#xe61c;</text>
        </view>
      </view>
      
      <view class="header-subtitle" v-if="childName && parentName">
        {{ parentName }} > {{ childName }}
      </view>
    </view>
    
    <!-- Main Content -->
    <view class="wordlist-content">
      <!-- Loading State -->
      <view v-if="loading" class="loading-state">
        <view class="loader"></view>
        <text>加载词汇中...</text>
      </view>
      
      <!-- Error Message -->
      <view v-else-if="errorMessage" class="error-state">
        <image src="/static/error.png" mode="aspectFit" class="error-image"></image>
        <text class="error-text">{{ errorMessage }}</text>
        <view class="retry-button" @tap="loadWordList">
          <text>重试</text>
        </view>
      </view>
      
      <!-- Content Area -->
      <block v-else>
        <!-- Empty State -->
        <view v-if="wordList.length === 0" class="empty-state">
          <image src="/static/empty.png" mode="aspectFit" class="empty-image"></image>
          <text class="empty-title">暂无词汇</text>
          <text class="empty-desc">该分类下暂时没有词汇</text>
        </view>
        
        <!-- Word List -->
        <view v-else class="words-list-container">
          <view class="list-header">
            <view class="list-info">
              <text class="list-title">词汇列表</text>
              <text class="list-count">共 {{ wordList.length }} 个</text>
            </view>
            
            <view class="sort-filter">
              <picker :value="sortIndex" :range="sortOptions" @change="changeSort">
                <view class="sort-selector">
                  <text>{{ sortOptions[sortIndex] }}</text>
                  <text class="iconfont">&#xe64b;</text>
                </view>
              </picker>
            </view>
          </view>
          
          <!-- Words Grid -->
          <view class="words-grid">
            <view 
              class="word-card" 
              v-for="(item, index) in displayedWords" 
              :key="index"
              @tap="goToDetail(getDisplayedIndex(index))"
            >
              <view class="word-media">
                <image 
                  :src="item.imageSrc || '/static/placeholder-sign.png'" 
                  mode="aspectFill"
                  class="word-image"
                ></image>
                <view class="word-video-badge" v-if="item.wordVideoSrc">
                  <text class="iconfont">&#xe666;</text>
                </view>
              </view>
              <view class="word-info">
                <text class="word-name">{{ item.name }}</text>
                <text class="word-pinyin">{{ item.pinyin || '无拼音' }}</text>
              </view>
            </view>
          </view>
          
          <!-- Pagination -->
          <view class="pagination" v-if="totalPages > 1">
            <view class="page-controls">
              <view 
                class="page-btn first-last-btn" 
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
              <view class="page-info">
                <text>{{ currentPage }}/{{ totalPages }}</text>
              </view>
              <view 
                class="page-btn" 
                :class="{ disabled: currentPage >= totalPages }" 
                @tap="goToNextPage"
              >
                <text>下一页</text>
              </view>
              <view 
                class="page-btn first-last-btn" 
                :class="{ disabled: currentPage >= totalPages }" 
                @tap="goToLastPage"
              >
                <text>尾页</text>
              </view>
            </view>
          </view>
        </view>
      </block>
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
      sortOptions: ['默认排序', '按名称升序', '按名称降序']
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
	async recordLearningActivity(signId) {
	  try {
	    const token = uni.getStorageSync('token');
	    if (!token) {
	      console.error('未登录，无法记录学习活动');
	      return;
	    }
	    
	    console.log(`记录学习活动: 查看手语ID ${signId}`);
	    
	    const res = await http.post('/learning/record', {
	      signId: signId,
	      // No isCorrect parameter since this is just viewing content
	    }, {
	      header: {
	        'Authorization': token,
	        'Content-Type': 'application/x-www-form-urlencoded'
	      }
	    });
	    
	    if (res.statusCode === 200 && res.data.code === 0) {
	      console.log('学习记录已保存');
	    } else {
	      console.error('保存学习记录失败:', res.data.message);
	    }
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
      
      uni.navigateTo({
        url: `/pages/detail/detail?index=${index}`
      });
    },
    // 分页控制方法
    goToFirstPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage = 1;
    },
    
    goToPrevPage() {
      if (this.currentPage <= 1 || this.loading) return;
      this.currentPage--;
    },
    
    goToNextPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage++;
    },
    
    goToLastPage() {
      if (this.currentPage >= this.totalPages || this.loading) return;
      this.currentPage = this.totalPages;
    },
    
    // 排序方法
    changeSort(e) {
      this.sortIndex = e.detail.value;
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
        default: // 默认排序 (id升序)
          this.wordList.sort((a, b) => a.id - b.id);
          break;
      }
      
      // 重置到第一页
      this.currentPage = 1;
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
          wordVideoSrc: '/static/videos/nihao.mp4'
        },
        {
          id: 2,
          name: '再见', 
          pinyin: 'zài jiàn', 
          gesture: '五指并拢，手掌向前|||左右摆动手腕，示意告别', 
          imageSrc: '/static/images/zaijian.jpg', 
          wordVideoSrc: '/static/videos/zaijian.mp4'
        },
        {
          id: 3,
          name: '朋友', 
          pinyin: 'péng yǒu', 
          gesture: '两手食指勾在一起|||轻轻摇晃，表示连接', 
          imageSrc: '/static/images/pengyou.jpg', 
          wordVideoSrc: '/static/videos/pengyou.mp4'
        },
        {
          id: 4,
          name: '谢谢', 
          pinyin: 'xiè xie', 
          gesture: '右手五指并拢，放于胸前|||向前轻推，表示感谢', 
          imageSrc: '/static/images/xiexie.jpg', 
          wordVideoSrc: '/static/videos/xiexie.mp4'
        },
        {
          id: 5,
          name: '对不起', 
          pinyin: 'duì bù qǐ', 
          gesture: '右手握拳放于胸前|||轻轻画圈，表示歉意', 
          imageSrc: '/static/images/duibuqi.jpg', 
          wordVideoSrc: '/static/videos/duibuqi.mp4'
        },
        {
          id: 6,
          name: '家人', 
          pinyin: 'jiā rén', 
          gesture: '双手合并形成屋顶形状|||表示家的温暖', 
          imageSrc: '/static/images/jiaren.jpg', 
          wordVideoSrc: '/static/videos/jiaren.mp4'
        }
      ];
    }
  }
}
</script>

<style lang="scss">
.wordlist-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  
  .wordlist-header {
    background: linear-gradient(to right, #3C8999, #55a5b5);
    padding: 20rpx 30rpx 30rpx;
    
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
    
    .header-subtitle {
      text-align: center;
      margin-top: 10rpx;
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  .wordlist-content {
    flex: 1;
    padding: 30rpx;
    
    .loading-state, .error-state, .empty-state {
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
      
      .error-image, .empty-image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 30rpx;
        opacity: 0.6;
      }
      
      .error-text, .empty-title {
        font-size: 32rpx;
        color: #333;
        margin-bottom: 10rpx;
      }
      
      .empty-desc {
        font-size: 28rpx;
        color: #999;
        margin-bottom: 10rpx;
      }
      
      .retry-button {
        margin-top: 30rpx;
        background-color: #3C8999;
        color: #fff;
        font-size: 28rpx;
        padding: 15rpx 40rpx;
        border-radius: 30rpx;
      }
    }
    
    .words-list-container {
      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30rpx;
        
        .list-info {
          .list-title {
            font-size: 32rpx;
            color: #333;
            font-weight: bold;
            margin-right: 15rpx;
          }
          
          .list-count {
            font-size: 24rpx;
            color: #999;
          }
        }
        
        .sort-filter {
          .sort-selector {
            display: flex;
            align-items: center;
            background-color: #fff;
            padding: 8rpx 20rpx;
            border-radius: 30rpx;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
            
            text {
              font-size: 24rpx;
              color: #666;
            }
            
            .iconfont {
              font-size: 24rpx;
              color: #999;
              margin-left: 10rpx;
            }
          }
        }
      }
      
      .words-grid {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -10rpx;
        
        .word-card {
          width: calc(50% - 20rpx);
          margin: 10rpx;
          background-color: #fff;
          border-radius: 16rpx;
          overflow: hidden;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
          
          &:active {
            transform: scale(0.98);
          }
          
          .word-media {
            position: relative;
            
            .word-image {
              width: 100%;
              height: 200rpx;
              background-color: #f0f0f0;
            }
            
            .word-video-badge {
              position: absolute;
              right: 10rpx;
              bottom: 10rpx;
              width: 40rpx;
              height: 40rpx;
              background-color: rgba(60, 137, 153, 0.8);
              border-radius: 20rpx;
              display: flex;
              align-items: center;
              justify-content: center;
              
              .iconfont {
                font-size: 24rpx;
                color: #fff;
              }
            }
          }
          
          .word-info {
            padding: 15rpx;
            
            .word-name {
              font-size: 28rpx;
              color: #333;
              font-weight: 500;
              margin-bottom: 6rpx;
              display: block;
            }
            
            .word-pinyin {
              font-size: 22rpx;
              color: #999;
            }
          }
        }
      }
      
      .pagination {
        margin: 40rpx 0;
        
        .page-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10rpx;
          
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
            
            &.first-last-btn {
              min-width: 70rpx;
              font-size: 22rpx;
            }
            
            &:active {
              transform: scale(0.95);
            }
            
            &.disabled {
              background-color: #ddd;
              color: #999;
              box-shadow: none;
            }
          }
          
          .page-info {
            margin: 0 10rpx;
            min-width: 70rpx;
            text-align: center;
            
            text {
              font-size: 26rpx;
              color: #666;
            }
          }
        }
      }
    }
  }
}
</style>