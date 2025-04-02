<template>
  <view class="practice-container">
    <!-- Header with progress bar -->
    <view class="practice-header">
      <view class="header-top">
        <view class="back-button" @tap="navigateBack">
          <text class="iconfont">&#xe679;</text>
        </view>
        <text class="header-title">手语练习</text>
        <view class="score-display">
          <text class="score-text">{{ score }}</text>
        </view>
      </view>
      
      <view class="progress-bar">
        <view class="progress-text">
          <text>{{ currentQuestionIndex + 1 }}/{{ totalQuestions }}</text>
        </view>
        <view class="progress-track">
          <view 
            class="progress-fill"
            :style="{ width: `${(currentQuestionIndex + 1) / totalQuestions * 100}%` }"
          ></view>
        </view>
      </view>
    </view>
    
    <!-- Question Area -->
    <view class="question-area">
      <view class="question-card">
        <image 
          :src="currentQuestion.imageSrc || '/static/placeholder-sign.png'" 
          mode="aspectFit" 
          class="question-image"
        ></image>
        
        <view class="question-prompt">
          <text class="prompt-text">选择正确的手语名称</text>
        </view>
      </view>
    </view>
    
    <!-- Answer Options -->
    <view class="options-area">
      <view 
        v-for="(option, index) in options" 
        :key="index"
        class="option-button"
        :class="getOptionClass(option)"
        @tap="selectOption(option)"
      >
        <text class="option-text">{{ option.name }}</text>
        
        <view class="option-result" v-if="selectedOption">
          <text class="option-result" v-if="selectedOption && option.id === currentQuestion.id">✓</text>
          <text class="option-result" v-else-if="selectedOption && option.id === selectedOption.id && option.id !== currentQuestion.id">✗</text>
        </view>
      </view>
    </view>
    
    <!-- Next Button -->
    <view class="next-area">
      <view 
        class="feedback-message"
        v-if="selectedOption"
      >
      </view>
      
      <button 
        v-if="selectedOption" 
        class="next-button"
        @tap="nextQuestion"
      >
        {{ isLastQuestion ? '查看结果' : '下一题' }}
      </button>
    </view>
    
    <!-- Result Modal -->
    <view class="result-modal" v-if="showResult">
      <view class="result-card">
        <view class="result-header">
          <text class="result-title">练习完成</text>
        </view>
        
        <view class="result-content">
          <view class="result-score">
            <text class="score-number">{{ score }}</text>
            <text class="score-total">/ {{ totalQuestions }}</text>
          </view>
          
          <view class="result-percentage">
            <text class="percentage-text">{{ calculatePercentage() }}%</text>
            <text class="percentage-label">正确率</text>
          </view>
          
          <view class="result-message">
            <text>{{ getResultMessage() }}</text>
          </view>
        </view>
        
        <view class="result-actions">
          <button class="restart-button" @tap="resetPractice">再来一次</button>
          <button class="back-button" @tap="navigateToHome">返回首页</button>
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
      allSigns: [],
      currentQuestion: null,
      options: [],
      selectedOption: null,
      isCorrect: false,
      score: 0,
      totalQuestions: 10,
      currentQuestionIndex: 0,
      loading: true,
      showResult: false
    }
  },
  
  computed: {
    isLastQuestion() {
      return this.currentQuestionIndex === this.totalQuestions - 1
    }
  },
  
  onLoad() {
    this.checkLogin();
  },
  
  methods: {
    // 检查登录状态
    checkLogin() {
      const token = uni.getStorageSync('token');
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
      this.loadData();
    },
    
    // 返回上一页
    navigateBack() {
      uni.navigateBack();
    },
    
    // 跳转到首页
    navigateToHome() {
      uni.reLaunch({
        url: '/pages/index/index'
      });
    },
    
    // 加载所有手语数据
    async loadData() {
      this.loading = true;
      
      try {
        const token = uni.getStorageSync('token');
        // 获取全部手语数据
        const res = await http.get('/sign/list', {
          params: {
            pageNum: 1,
            pageSize: 100
          },
          header: {
            'Authorization': token
          }
        });
        
        // 处理数据
        if (res.statusCode === 200 && res.data.code === 0) {
          if (res.data.data && res.data.data.records) {
            this.allSigns = res.data.data.records.filter(item => item.imageSrc); // 只使用有图片的手语
          } else if (res.data.data && Array.isArray(res.data.data)) {
            this.allSigns = res.data.data.filter(item => item.imageSrc);
          } else {
            // 如果没有获取到数据，使用模拟数据
            this.allSigns = this.getMockData();
          }
          
          // 如果数据太少，使用模拟数据补充
          if (this.allSigns.length < 10) {
            this.allSigns = [...this.allSigns, ...this.getMockData()];
          }
          
          // 打乱数据顺序
          this.allSigns = this.shuffleArray([...this.allSigns]);
          
          // 开始练习
          this.prepareQuestion();
        } else {
          // 如果API失败，使用模拟数据
          this.allSigns = this.getMockData();
          this.prepareQuestion();
        }
      } catch (err) {
        console.error('加载数据失败:', err);
        // 出错时使用模拟数据
        this.allSigns = this.getMockData();
        this.prepareQuestion();
      } finally {
        this.loading = false;
      }
    },
    
    // 准备新题目
    prepareQuestion() {
      // 随机选择一个手语作为当前问题
      if (this.allSigns.length === 0) {
        uni.showToast({
          title: '没有足够的练习数据',
          icon: 'none'
        });
        return;
      }
      
      // 从剩余手语中随机选择一个作为问题
      const randomIndex = Math.floor(Math.random() * this.allSigns.length);
      this.currentQuestion = this.allSigns[randomIndex];
      
      // 移除当前问题，避免重复
      this.allSigns.splice(randomIndex, 1);
      
      // 准备选项
      this.prepareOptions();
      
      // 重置选择状态
      this.selectedOption = null;
      this.isCorrect = false;
    },
    
    // 准备选项
    prepareOptions() {
      // 添加正确选项
      const options = [this.currentQuestion];
      
      // 添加3个错误选项
      const availableSigns = [...this.allSigns];
      
      for (let i = 0; i < 3 && availableSigns.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableSigns.length);
        options.push(availableSigns[randomIndex]);
        availableSigns.splice(randomIndex, 1);
      }
      
      // 如果没有足够的选项，添加模拟数据
      const mockOptions = this.getMockOptions();
      while (options.length < 4) {
        options.push(mockOptions[options.length - 1]);
      }
      
      // 随机排序选项
      this.options = this.shuffleArray(options);
    },
    
    // 数组随机排序
    shuffleArray(array) {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    },
    
    // 选择选项
   selectOption(option) {
     // Already selected an option, don't process again
     if (this.selectedOption || !this.currentQuestion) return;
     
     this.selectedOption = option;
     
     // Determine if the answer is correct
     const isCorrect = option.id === this.currentQuestion.id;
     
     // Record this learning activity to the backend
     
     // Update local score and play sound
     if (isCorrect) {
       this.score++;
       // Play correct sound effect
       const correctAudio = uni.createInnerAudioContext();
       correctAudio.src = '/static/audio/correct.mp3';
       correctAudio.play();
     } else {
       // Play wrong sound effect
       const wrongAudio = uni.createInnerAudioContext();
       wrongAudio.src = '/static/audio/wrong.mp3';
       wrongAudio.play();
     }
	 this.recordLearning(isCorrect);
   },
    
    // 记录学习进度
    async updateLearningRecord(signId, isCorrect) {
      try {
        const token = uni.getStorageSync('token');
        if (!token) return;
        
        await http.post('/learning/record', {
          signId: signId,
          isCorrect: isCorrect
        }, {
          header: {
            'Authorization': token
          }
        });
      } catch (error) {
        console.error('Failed to update learning record:', error);
        // Continue with the practice experience even if the record update fails
      }
    },
	async recordLearning(isCorrect) {
	  try {
	    // 使用表单格式
	    await http.post('/learning/record', {
	      signId: this.currentQuestion.id,
	      isCorrect: isCorrect
	    }, {
	      header: {
	        'Content-Type': 'application/x-www-form-urlencoded'
	      }
	    });
	    
	    console.log('学习记录已保存');
	  } catch (error) {
	    console.error('记录学习行为失败:', error);
	  }
	},

	async recordPracticeCompletion(successPercentage) {
	  // This could be a separate API call or use the regular learning record endpoint
	  // For now, we'll use the existing learning/record endpoint with a special signId (-1)
	  // that indicates this is a practice session completion
	  try {
	    const token = uni.getStorageSync('token');
	    if (!token) return;
	    
	    const avgCorrect = successPercentage >= 70; // Consider 70% or higher as "correct" overall
	    
	    // Use a special signId to indicate this is a practice session summary
	    // Backend can handle this specially if needed
	    const practiceSessionSignId = this.currentQuestion.id || 1;
	    
	    await http.post('/learning/record', {
	      signId: practiceSessionSignId,
	      isCorrect: avgCorrect
	    }, {
	      header: {
	        'Authorization': token,
	        'Content-Type': 'application/x-www-form-urlencoded'
	      }
	    });
	  } catch (error) {
	    console.error('记录练习完成状态失败:', error);
	  }
	},

    
    // 获取选项类名
    getOptionClass(option) {
      if (!this.selectedOption) return '';
      
      if (option.id === this.currentQuestion.id) {
        return 'option-correct';
      } else if (option.id === this.selectedOption.id && !this.isCorrect) {
        return 'option-incorrect';
      } else {
        return 'option-disabled';
      }
    },
    
    // 下一题
    nextQuestion() {
      this.currentQuestionIndex++;
	  this.selectedOption = null; 
	  this.isCorrect = false;
      
      // 检查是否完成所有题目
      if (this.currentQuestionIndex >= this.totalQuestions) {
        this.showResult = true;
        return;
      }
      
      this.prepareQuestion();
    },
    
    // 计算百分比
    calculatePercentage() {
      const percentage = Math.round((this.score / this.totalQuestions) * 100);
        
        // Record the final practice session as a learning activity with overall success rate
        this.recordPracticeCompletion(percentage);
        
        uni.showModal({
          title: '练习完成',
          content: `你的得分：${this.score}/${this.totalQuestions} (${percentage}%)`,
          confirmText: '再来一次',
          cancelText: '返回',
          success: (res) => {
            if (res.confirm) {
              // Restart practice
              this.resetPractice();
            } else {
              // Return to home
              uni.navigateBack();
            }
          }
        });
    },
    
    // 重置练习
    resetPractice() {
      this.score = 0;
      this.currentQuestionIndex = 0;
      this.selectedOption = null;
      this.isCorrect = false;
      this.showResult = false;
      this.loadData(); // 重新加载数据
    },
    
    // 模拟数据
    getMockData() {
      return [
        {
          id: 1,
          name: '握手',
          pinyin: 'wò shǒu',
          gesture: '双手相握，上下晃动',
          imageSrc: '/static/images/handshake.jpg'
        },
        {
          id: 2,
          name: '你好',
          pinyin: 'nǐ hǎo',
          gesture: '右手在胸前挥动',
          imageSrc: '/static/images/hello.jpg'
        },
        {
          id: 3,
          name: '谢谢',
          pinyin: 'xiè xiè',
          gesture: '右手在胸前轻拍',
          imageSrc: '/static/images/thanks.jpg'
        },
        {
          id: 4,
          name: '再见',
          pinyin: 'zài jiàn',
          gesture: '挥手示意',
          imageSrc: '/static/images/goodbye.jpg'
        },
        {
          id: 5,
          name: '吃饭',
          pinyin: 'chī fàn',
          gesture: '手指并拢靠近嘴',
          imageSrc: '/static/images/eat.jpg'
        },
        {
          id: 6,
          name: '喝水',
          pinyin: 'hē shuǐ',
          gesture: '握拳靠近嘴',
          imageSrc: '/static/images/drink.jpg'
        },
        {
          id: 7,
          name: '睡觉',
          pinyin: 'shuì jiào',
          gesture: '手掌放在脸颊',
          imageSrc: '/static/images/sleep.jpg'
        },
        {
          id: 8,
          name: '朋友',
          pinyin: 'péng yǒu',
          gesture: '双手食指交叉',
          imageSrc: '/static/images/friend.jpg'
        },
        {
          id: 9,
          name: '家人',
          pinyin: 'jiā rén',
          gesture: '双手合拢',
          imageSrc: '/static/images/family.jpg'
        },
        {
          id: 10,
          name: '学习',
          pinyin: 'xué xí',
          gesture: '手指敲额头',
          imageSrc: '/static/images/study.jpg'
        },
        {
          id: 11,
          name: '工作',
          pinyin: 'gōng zuò',
          gesture: '双手交替',
          imageSrc: '/static/images/work.jpg'
        },
        {
          id: 12,
          name: '爱',
          pinyin: 'ài',
          gesture: '双手交叉放在胸前',
          imageSrc: '/static/images/love.jpg'
        }
      ];
    },
    
    // 获取模拟选项
    getMockOptions() {
      return [
        { id: 101, name: '搭', pinyin: 'dā' },
        { id: 102, name: '本', pinyin: 'běn' },
        { id: 103, name: '逗', pinyin: 'dòu' },
        { id: 104, name: '笑', pinyin: 'xiào' }
      ];
    }
  }
}
</script>

<style lang="scss">
.practice-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  
  .practice-header {
    background-color: #fff;
    padding: 20rpx 30rpx 30rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20rpx;
      
      .back-button {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .iconfont {
          font-size: 36rpx;
          color: #333;
        }
      }
      
      .header-title {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
      }
      
      .score-display {
        background-color: #3C8999;
        color: #fff;
        border-radius: 30rpx;
        padding: 6rpx 20rpx;
        
        .score-text {
          font-size: 30rpx;
          font-weight: bold;
        }
      }
    }
    
    .progress-bar {
      .progress-text {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 10rpx;
        
        text {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .progress-track {
        height: 10rpx;
        background-color: #f0f0f0;
        border-radius: 5rpx;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background-color: #3C8999;
          border-radius: 5rpx;
          transition: width 0.3s;
        }
      }
    }
  }
  
  .question-area {
    padding: 30rpx;
    
    .question-card {
      background-color: #fff;
      border-radius: 20rpx;
      padding: 30rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
      
      .question-image {
        width: 100%;
        height: 400rpx;
        margin-bottom: 30rpx;
        background-color: #f5f5f5;
        border-radius: 10rpx;
      }
      
      .question-prompt {
        text-align: center;
        margin-bottom: 20rpx;
        
        .prompt-text {
          font-size: 32rpx;
          color: #333;
          font-weight: bold;
        }
      }
    }
  }
  
  .options-area {
    padding: 0 30rpx;
    margin-bottom: 30rpx;
    
    .option-button {
      background-color: #fff;
      border-radius: 15rpx;
      padding: 30rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s;
      
      &:active {
        transform: scale(0.98);
        background-color: #f9f9f9;
      }
      
      .option-text {
        font-size: 32rpx;
        color: #333;
        font-weight: 500;
      }
      
      .option-result {
        .iconfont {
          font-size: 40rpx;
          
          &.correct-icon {
            color: #52c41a;
          }
          
          &.wrong-icon {
            color: #f5222d;
          }
        }
      }
      
      &.option-correct {
        background-color: rgba(82, 196, 26, 0.1);
        border: 2rpx solid #52c41a;
      }
      
      &.option-incorrect {
        background-color: rgba(245, 34, 45, 0.1);
        border: 2rpx solid #f5222d;
      }
      
      &.option-disabled {
        opacity: 0.6;
        
        &:active {
          transform: none;
        }
      }
    }
  }
  
  .next-area {
    padding: 0 30rpx;
    margin-bottom: 50rpx;
    
    .feedback-message {
      text-align: center;
      margin-bottom: 30rpx;
      
      text {
        font-size: 32rpx;
        font-weight: bold;
        
        &.correct-message {
          color: #52c41a;
        }
        
        &.wrong-message {
          color: #f5222d;
        }
      }
    }
    
    .next-button {
      background: linear-gradient(to right, #3C8999, #55a5b5);
      color: #fff;
      font-size: 32rpx;
      font-weight: bold;
      height: 90rpx;
      line-height: 90rpx;
      border-radius: 45rpx;
      box-shadow: 0 6rpx 16rpx rgba(60, 137, 153, 0.3);
      
      &::after {
        border: none;
      }
    }
  }
  
  .result-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    
    .result-card {
      width: 600rpx;
      background-color: #fff;
      border-radius: 20rpx;
      overflow: hidden;
      
      .result-header {
        background: linear-gradient(to right, #3C8999, #55a5b5);
        padding: 30rpx;
        text-align: center;
        
        .result-title {
          font-size: 36rpx;
          color: #fff;
          font-weight: bold;
        }
      }
      
      .result-content {
        padding: 50rpx 30rpx;
        
        .result-score {
          text-align: center;
          margin-bottom: 30rpx;
          
          .score-number {
            font-size: 80rpx;
            color: #3C8999;
            font-weight: bold;
          }
          
          .score-total {
            font-size: 40rpx;
            color: #999;
          }
        }
        
        .result-percentage {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40rpx;
          
          .percentage-text {
            font-size: 60rpx;
            color: #333;
            font-weight: bold;
            margin-bottom: 10rpx;
          }
          
          .percentage-label {
            font-size: 28rpx;
            color: #999;
          }
        }
        
        .result-message {
          text-align: center;
          padding: 0 30rpx;
          
          text {
            font-size: 32rpx;
            color: #333;
            line-height: 1.6;
          }
        }
      }
      
      .result-actions {
        display: flex;
        padding: 30rpx;
        border-top: 1px solid #f0f0f0;
        
        button {
          flex: 1;
          height: 80rpx;
          line-height: 80rpx;
          font-size: 30rpx;
          
          &::after {
            border: none;
          }
        }
        
        .restart-button {
          background-color: #3C8999;
          color: #fff;
          margin-right: 20rpx;
          border-radius: 10rpx;
        }
        
        .back-button {
          background-color: #f5f5f5;
          color: #333;
          border-radius: 10rpx;
        }
      }
    }
  }
}
</style>