<template>
  <view class="verification-container">
    <view class="header">
      <view class="back-button" @tap="navigateBack">
        <text class="back-icon">&#xe679;</text>
      </view>
      <text class="page-title">手语练习检验</text>
    </view>
    
    <!-- 练习内容展示 -->
    <view class="practice-content">
      <text class="instruction">请模仿以下手语动作：</text>
      <view class="sign-display">
        <image v-if="currentSign.imageSrc" :src="currentSign.imageSrc" mode="aspectFit" class="sign-image"></image>
        <video v-if="currentSign.wordVideoSrc" :src="currentSign.wordVideoSrc" 
               class="sign-video" autoplay loop muted></video>
        <text class="sign-name">{{ currentSign.name }}</text>
      </view>
    </view>
    
    <!-- 摄像头预览 -->
    <view class="camera-section">
      <camera device-position="front" flash="off" @error="handleCameraError" class="camera" :disable-zoom="true" mode="normal">
        <cover-view class="camera-guide">
          <cover-view class="camera-guide-text">请将双手放在框内</cover-view>
        </cover-view>
        <cover-image v-if="handDetected" src="/static/images/hand-detected.png" class="hand-indicator"></cover-image>
      </camera>
      
      <canvas canvas-id="handCanvas" class="hand-canvas"></canvas>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="action-btn start-btn" @tap="startVerification" v-if="!isVerifying">开始检验</button>
      <button class="action-btn stop-btn" @tap="stopVerification" v-else>停止检验</button>
    </view>
    
    <!-- 评估结果 -->
    <view class="result-section" v-if="hasResult">
      <view class="result-card">
        <text class="result-title">评估结果</text>
        <view class="score-display">
          <text class="score-value">{{ scoreValue }}%</text>
          <text class="score-label">{{ scoreLabel }}</text>
        </view>
        <view class="feedback-detail">
          <text>{{ feedbackMessage }}</text>
        </view>
        <button class="next-btn" @tap="moveToNextSign">继续下一个</button>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      currentSign: {
        id: 1,
        name: '你好',
        pinyin: 'nǐ hǎo',
        imageSrc: '',
        wordVideoSrc: ''
      },
      isVerifying: false,
      handDetected: false,
      hasResult: false,
      scoreValue: 0,
      scoreLabel: '',
      feedbackMessage: '',
      // MediaPipe 相关变量
      hands: null,
      camera: null,
      lastVideoTime: -1,
      results: null,
      // 模型相关变量
      model: null,
      signPredictions: []
    }
  },
  onLoad(options) {
    if (options.id) {
      this.loadSignDetails(options.id);
    } else {
      this.loadRandomSign();
    }
  },
  onReady() {
    this.initializeCamera();
    this.loadHandTrackingModel();
  },
  onUnload() {
    this.cleanupResources();
  },
  methods: {
    navigateBack() {
      uni.navigateBack();
    },
    
    async loadSignDetails(id) {
      try {
        const res = await http.get(`/sign/detail/${id}`);
        if (res.data.code === 0) {
          this.currentSign = res.data.data;
        } else {
          uni.showToast({
            title: '获取手语详情失败',
            icon: 'none'
          });
          // 加载随机手语作为备选
          this.loadRandomSign();
        }
      } catch (error) {
        console.error('加载手语详情失败:', error);
        this.loadRandomSign();
      }
    },
    
    async loadRandomSign() {
      try {
        const res = await http.get('/sign/list', {
          params: {
            pageNum: 1,
            pageSize: 10
          }
        });
        
        if (res.data.code === 0 && res.data.data.records.length > 0) {
          const randomIndex = Math.floor(Math.random() * res.data.data.records.length);
          this.currentSign = res.data.data.records[randomIndex];
        } else {
          // 使用默认值
          this.currentSign = {
            id: 1,
            name: '你好',
            pinyin: 'nǐ hǎo',
            imageSrc: '/static/images/default-sign.png',
            wordVideoSrc: ''
          };
        }
      } catch (error) {
        console.error('加载随机手语失败:', error);
      }
    },
    
    handleCameraError(error) {
      console.error('相机错误:', error);
      uni.showToast({
        title: '相机启动失败，请检查权限',
        icon: 'none'
      });
    },
    
    initializeCamera() {
      // 初始化相机上下文
      this.camera = uni.createCameraContext();
    },
    
    async loadHandTrackingModel() {
      try {
        // 这里可以加载 MediaPipe 或自定义模型
        // 实际实现可能需要根据运行环境调整
        
        // 模拟加载模型
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('手部跟踪模型加载成功');
        
        // 加载手语识别模型
        await this.loadSignRecognitionModel();
      } catch (error) {
        console.error('加载模型失败:', error);
        uni.showToast({
          title: '模型加载失败',
          icon: 'none'
        });
      }
    },
    
    async loadSignRecognitionModel() {
      try {
        // 这里应该加载实际的手语识别模型
        // 可以使用 TensorFlow.js 或其他适合小程序的模型
        
        // 模拟加载模型
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('手语识别模型加载成功');
      } catch (error) {
        console.error('加载手语识别模型失败:', error);
      }
    },
    
    startVerification() {
      if (!this.camera) {
        this.initializeCamera();
      }
      
      this.isVerifying = true;
      this.hasResult = false;
      
      // 开始手部追踪和手语识别
      this.startHandTracking();
    },
    
    stopVerification() {
      this.isVerifying = false;
      
      // 停止手部追踪
      this.stopHandTracking();
      
      // 计算并显示结果
      this.calculateResults();
    },
    
    startHandTracking() {
      // 实际实现中，这里会启动视频帧分析
      // 处理视频帧以检测手部关键点
      
      // 模拟手部检测
      this.simulateHandDetection();
    },
    
    simulateHandDetection() {
      // 这是一个模拟演示，实际实现需要使用 MediaPipe 或自定义模型
      
      // 模拟检测到手部
      setTimeout(() => {
        if (this.isVerifying) {
          this.handDetected = true;
          
          // 模拟收集手语识别数据
          this.collectSignData();
        }
      }, 2000);
    },
    
    collectSignData() {
      // 实际应用中，这里将收集手部关键点数据并进行分析
      
      // 模拟预测过程
      if (this.isVerifying) {
        const prediction = Math.random(); // 0-1之间的随机值
        this.signPredictions.push(prediction);
        
        // 继续模拟收集数据
        setTimeout(() => {
          if (this.isVerifying && this.signPredictions.length < 10) {
            this.collectSignData();
          } else if (this.isVerifying) {
            // 收集了足够的数据，停止验证并显示结果
            this.stopVerification();
          }
        }, 500);
      }
    },
    
    stopHandTracking() {
      // 停止手部追踪
      this.handDetected = false;
    },
    
    calculateResults() {
      // 基于收集的预测数据计算得分
      // 实际应用中，这里应该比较用户手语与目标手语的匹配度
      
      if (this.signPredictions.length === 0) {
        this.scoreValue = 0;
      } else {
        // 简单示例：使用预测值的平均值作为得分
        const avgPrediction = this.signPredictions.reduce((sum, val) => sum + val, 0) / this.signPredictions.length;
        this.scoreValue = Math.round(avgPrediction * 100);
      }
      
      // 根据得分设置评价标签
      if (this.scoreValue >= 90) {
        this.scoreLabel = '优秀';
        this.feedbackMessage = '太棒了！你的手语表达非常准确。';
      } else if (this.scoreValue >= 70) {
        this.scoreLabel = '良好';
        this.feedbackMessage = '做得不错！还有一些小细节可以改进。';
      } else if (this.scoreValue >= 50) {
        this.scoreLabel = '一般';
        this.feedbackMessage = '基本掌握了，多加练习可以更流畅。';
      } else {
        this.scoreLabel = '需要练习';
        this.feedbackMessage = '建议多看视频示范，注意手指姿势和方向。';
      }
      
      // 记录学习结果
      this.saveLearningStat();
      
      // 显示结果
      this.hasResult = true;
      
      // 清空预测数据
      this.signPredictions = [];
    },
    
    async saveLearningStat() {
      try {
        // 记录学习记录到服务器
        await http.post('/learning/record', {
          signId: this.currentSign.id,
          isCorrect: this.scoreValue >= 70 // 大于70分视为正确
        });
        
        console.log('学习记录已保存');
      } catch (error) {
        console.error('保存学习记录失败:', error);
      }
    },
    
    moveToNextSign() {
      // 加载下一个手语进行练习
      this.hasResult = false;
      this.loadRandomSign();
    },
    
    cleanupResources() {
      // 清理资源
      this.isVerifying = false;
      this.handDetected = false;
      
      // 清理手部跟踪相关资源
      // 实际应用中可能需要更多清理工作
    }
  }
}
</script>

<style lang="scss">
.verification-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
  
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    .back-button {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
      color: #333;
    }
    
    .page-title {
      flex: 1;
      text-align: center;
      font-size: 36rpx;
      font-weight: bold;
      margin-right: 60rpx;
    }
  }
  
  .practice-content {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
    
    .instruction {
      font-size: 30rpx;
      color: #333;
      margin-bottom: 20rpx;
      display: block;
    }
    
    .sign-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .sign-image {
        width: 200rpx;
        height: 200rpx;
        object-fit: cover;
        margin-bottom: 20rpx;
      }
      
      .sign-video {
        width: 300rpx;
        height: 300rpx;
        margin-bottom: 20rpx;
      }
      
      .sign-name {
        font-size: 40rpx;
        font-weight: bold;
        color: #333;
      }
    }
  }
  
  .camera-section {
    position: relative;
    margin-bottom: 30rpx;
    
    .camera {
      width: 100%;
      height: 600rpx;
      border-radius: 16rpx;
      overflow: hidden;
    }
    
    .camera-guide {
      position: absolute;
      width: 80%;
      height: 400rpx;
      border: 2px dashed rgba(255, 255, 255, 0.7);
      left: 10%;
      top: 100rpx;
      display: flex;
      justify-content: center;
      
      .camera-guide-text {
        background-color: rgba(0, 0, 0, 0.5);
        color: #fff;
        padding: 10rpx 20rpx;
        border-radius: 30rpx;
        font-size: 24rpx;
        margin-top: 20rpx;
      }
    }
    
    .hand-indicator {
      position: absolute;
      width: 80rpx;
      height: 80rpx;
      top: 20rpx;
      right: 20rpx;
    }
    
    .hand-canvas {
      position: absolute;
      width: 100%;
      height: 600rpx;
      top: 0;
      left: 0;
      pointer-events: none;
    }
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    margin-bottom: 30rpx;
    
    .action-btn {
      width: 80%;
      height: 90rpx;
      line-height: 90rpx;
      border-radius: 45rpx;
      font-size: 32rpx;
      color: #fff;
      
      &.start-btn {
        background: linear-gradient(to right, #3C8999, #55a5b5);
      }
      
      &.stop-btn {
        background-color: #e74c3c;
      }
    }
  }
  
  .result-section {
    margin-top: 30rpx;
    
    .result-card {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 30rpx;
      
      .result-title {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
        display: block;
        text-align: center;
        margin-bottom: 20rpx;
      }
      
      .score-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 30rpx;
        
        .score-value {
          font-size: 60rpx;
          font-weight: bold;
          color: #3C8999;
        }
        
        .score-label {
          font-size: 32rpx;
          color: #666;
          margin-top: 10rpx;
        }
      }
      
      .feedback-detail {
        background-color: #f8f8f8;
        padding: 20rpx;
        border-radius: 10rpx;
        margin-bottom: 30rpx;
        
        text {
          font-size: 28rpx;
          color: #666;
          line-height: 1.5;
        }
      }
      
      .next-btn {
        background-color: #3C8999;
        color: #fff;
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        font-size: 30rpx;
      }
    }
  }
}
</style>