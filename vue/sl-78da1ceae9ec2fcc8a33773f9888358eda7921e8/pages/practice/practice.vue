<template>
  <view class="practice-container">
    <!-- Header with progress bar -->
    <view class="practice-header">
      <view class="header-top">
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
// Define variables for consistent theming
$primary-color: #3C8999;
$primary-light: #55a5b5;
$primary-dark: #2a6b78;
$accent-color: #FF9B50;
$success-color: #52c41a;
$error-color: #ff4d4f;
$neutral-color: #f0f0f0;
$text-color: #333;
$text-light: #666;
$text-lighter: #999;
$background-color: #f5f5f5;
$card-background: #ffffff;
$border-radius-sm: 12rpx;
$border-radius-md: 20rpx;
$border-radius-lg: 30rpx;
$box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
$transition-duration: 0.3s;

// Animations
@keyframes floating {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
  100% { transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 0.6; }
  100% { transform: scale(1); opacity: 0.8; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInBottom {
  from { opacity: 0; transform: translateY(60rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes correctAnswer {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes wrongAnswer {
  0% { transform: translateX(0); }
  25% { transform: translateX(-10rpx); }
  50% { transform: translateX(10rpx); }
  75% { transform: translateX(-10rpx); }
  100% { transform: translateX(0); }
}

.practice-container {
  min-height: 100vh;
  background-color: $background-color;
  position: relative;
  
  // Background elements for visual interest
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40vh;
    background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
    border-bottom-left-radius: 40rpx;
    border-bottom-right-radius: 40rpx;
    z-index: 0;
  }
  
  // Header with progress bar
  .practice-header {
    position: relative;
    padding: 40rpx 30rpx 30rpx;
    z-index: 1;
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25rpx;
      
      .header-title {
        font-size: 38rpx;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
      }
      
      .score-display {
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(5rpx);
        border-radius: 30rpx;
        padding: 12rpx 25rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
        
        .score-text {
          font-size: 32rpx;
          font-weight: bold;
          color: #fff;
        }
      }
    }
    
    .progress-bar {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(5rpx);
      border-radius: 16rpx;
      padding: 15rpx 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
      
      .progress-text {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 10rpx;
        
        text {
          font-size: 26rpx;
          color: rgba(255, 255, 255, 0.9);
        }
      }
      
      .progress-track {
        height: 12rpx;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 6rpx;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background: #fff;
          border-radius: 6rpx;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      }
    }
  }
  
  // Question Area
  .question-area {
    padding: 20rpx 30rpx;
    position: relative;
    z-index: 1;
    animation: fadeIn 0.5s ease-out;
    
    .question-card {
      background-color: $card-background;
      border-radius: $border-radius-lg;
      padding: 30rpx;
      box-shadow: $box-shadow;
      overflow: hidden;
      
      .question-image {
        width: 100%;
        height: 400rpx;
        border-radius: $border-radius-md;
        object-fit: contain;
        background-color: #f8f8f8;
        margin-bottom: 30rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
        transition: transform $transition-duration;
        
        &:active {
          transform: scale(0.98);
        }
      }
      
      .question-prompt {
        background: linear-gradient(135deg, $primary-color, $primary-light);
        border-radius: $border-radius-md;
        padding: 20rpx;
        text-align: center;
        box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.2);
        
        .prompt-text {
          font-size: 30rpx;
          color: #fff;
          font-weight: bold;
        }
      }
    }
  }
  
  // Options Area
  .options-area {
    padding: 20rpx 30rpx;
    position: relative;
    z-index: 1;
    
    .option-button {
      background-color: $card-background;
      border-radius: $border-radius-lg;
      padding: 25rpx 30rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all $transition-duration;
      position: relative;
      overflow: hidden;
      animation: slideInBottom 0.3s ease-out both;
      
      // Staggered animation for options
      @for $i from 0 through 3 {
        &:nth-child(#{$i + 1}) {
          animation-delay: #{$i * 0.1 + 0.2}s;
        }
      }
      
      // Subtle hover effect
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg, 
          rgba(255, 255, 255, 0),
          rgba(255, 255, 255, 0.2),
          rgba(255, 255, 255, 0)
        );
        transition: all 0.8s;
      }
      
      &:active {
        transform: scale(0.98);
        
        &::after {
          left: 100%;
        }
      }
      
      .option-text {
        font-size: 32rpx;
        color: $text-color;
        font-weight: 500;
      }
      
      .option-result {
        font-size: 36rpx;
        font-weight: bold;
      }
      
      &.option-correct {
        background-color: rgba($success-color, 0.1);
        border: 2rpx solid $success-color;
        animation: correctAnswer 0.5s;
        
        .option-result {
          color: $success-color;
        }
      }
      
      &.option-incorrect {
        background-color: rgba($error-color, 0.1);
        border: 2rpx solid $error-color;
        animation: wrongAnswer 0.5s;
        
        .option-result {
          color: $error-color;
        }
      }
      
      &.option-disabled {
        opacity: 0.7;
        
        &:active {
          transform: none;
        }
      }
    }
  }
  
  // Next Button Area
  .next-area {
    padding: 20rpx 30rpx 50rpx;
    position: relative;
    z-index: 1;
    
    .feedback-message {
      text-align: center;
      margin-bottom: 30rpx;
      
      text {
        font-size: 32rpx;
        font-weight: bold;
        
        &.correct-message {
          color: $success-color;
        }
        
        &.wrong-message {
          color: $error-color;
        }
      }
    }
    
    .next-button {
      background: linear-gradient(135deg, $primary-color, $primary-light);
      color: #fff;
      font-size: 32rpx;
      font-weight: bold;
      height: 90rpx;
      line-height: 90rpx;
      border-radius: 45rpx;
      box-shadow: 0 8rpx 20rpx rgba($primary-color, 0.3);
      position: relative;
      overflow: hidden;
      transition: all $transition-duration;
      animation: fadeIn 0.5s;
      
      &::after {
        border: none;
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg, 
          rgba(255, 255, 255, 0),
          rgba(255, 255, 255, 0.3),
          rgba(255, 255, 255, 0)
        );
        transition: all 0.8s;
      }
      
      &:active {
        transform: scale(0.98);
        box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.2);
        
        &::after {
          left: 100%;
        }
      }
    }
  }
  
  // Result Modal
  .result-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10rpx);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s;
    
    .result-card {
      width: 85%;
      max-width: 600rpx;
      background-color: $card-background;
      border-radius: $border-radius-lg;
      overflow: hidden;
      box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.3);
      animation: slideInBottom 0.4s ease-out;
      
      .result-header {
        padding: 30rpx;
        background: linear-gradient(135deg, $primary-color, $primary-light);
        text-align: center;
        
        .result-title {
          font-size: 36rpx;
          color: #fff;
          font-weight: bold;
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
        }
      }
      
      .result-content {
        padding: 40rpx 30rpx;
        text-align: center;
        
        .result-score {
          margin-bottom: 30rpx;
          
          .score-number {
            font-size: 80rpx;
            font-weight: bold;
            color: $primary-color;
          }
          
          .score-total {
            font-size: 40rpx;
            color: $text-light;
          }
        }
        
        .result-percentage {
          background: linear-gradient(to right, $primary-color, $primary-light);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          margin-bottom: 30rpx;
          
          .percentage-text {
            font-size: 60rpx;
            font-weight: bold;
          }
          
          .percentage-label {
            font-size: 28rpx;
            display: block;
            margin-top: 5rpx;
          }
        }
        
        .result-message {
          padding: 20rpx;
          border-radius: $border-radius-md;
          background-color: #f8f8f8;
          margin-bottom: 30rpx;
          
          text {
            font-size: 30rpx;
            color: $text-color;
            line-height: 1.6;
          }
        }
      }
      
      .result-actions {
        display: flex;
        padding: 30rpx;
        border-top: 1rpx solid #f0f0f0;
        
        button {
          flex: 1;
          height: 80rpx;
          line-height: 80rpx;
          font-size: 30rpx;
          font-weight: 500;
          border-radius: $border-radius-md;
          
          &::after {
            border: none;
          }
          
          &:active {
            transform: scale(0.98);
          }
        }
        
        .restart-button {
          background: linear-gradient(135deg, $primary-color, $primary-light);
          color: #fff;
          margin-right: 20rpx;
          box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.2);
        }
        
        .back-button {
          background-color: #f5f5f5;
          color: $text-color;
        }
      }
    }
  }
}

// Responsive Adjustments
@media screen and (min-width: 768px) {
  .practice-container {
    .question-area {
      .question-card {
        .question-image {
          height: 500rpx;
        }
      }
    }
    
    .result-modal {
      .result-card {
        width: 70%;
      }
    }
  }
}

@media screen and (max-width: 375px) {
  .practice-container {
    .practice-header {
      .header-top {
        .header-title {
          font-size: 34rpx;
        }
        
        .score-display {
          padding: 10rpx 20rpx;
          
          .score-text {
            font-size: 28rpx;
          }
        }
      }
    }
    
    .options-area {
      .option-button {
        padding: 20rpx 25rpx;
        
        .option-text {
          font-size: 28rpx;
        }
      }
    }
  }
}
</style>