<template>
  <view class="recognition-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <view class="back-button" @tap="navigateBack">
        <text class="back-icon">&#xe679;</text>
      </view>
      <view class="page-title">TensorFlow.js 测试</view>
    </view>
    
    <!-- 摄像头视图 -->
    <view class="camera-section">
      <camera 
        device-position="front" 
        flash="off" 
        @error="handleCameraError"
        @ready="handleCameraReady"
        class="camera"
      ></camera>
      
      <view class="controls">
        <view class="control-btn" @tap="switchCamera">
          <text class="btn-text">切换摄像头</text>
        </view>
      </view>
    </view>
    
    <!-- 状态信息展示 -->
    <view class="status-section">
      <view class="status-card">
        <view class="status-header">
          <text class="status-title">环境检测结果</text>
        </view>
        
        <view class="status-content">
          <view class="status-item">
            <text class="item-label">摄像头状态:</text>
            <text class="item-value" :class="{'status-success': cameraReady, 'status-error': !cameraReady}">
              {{ cameraReady ? '已就绪' : '未就绪' }}
            </text>
          </view>
          
          <view class="status-item">
            <text class="item-label">TensorFlow.js:</text>
            <text class="item-value" :class="{'status-success': tfStatus.success, 'status-error': !tfStatus.success}">
              {{ tfStatus.message }}
            </text>
          </view>
          
          <view class="status-item" v-if="tfStatus.version">
            <text class="item-label">TensorFlow 版本:</text>
            <text class="item-value">{{ tfStatus.version }}</text>
          </view>
          
          <view class="status-item" v-if="tfStatus.supportedModels">
            <text class="item-label">支持的模型:</text>
            <text class="item-value">{{ tfStatus.supportedModels.join(', ') }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 测试按钮 -->
    <view class="action-section">
      <button class="action-btn" @tap="testTensorflow">测试 TensorFlow</button>
      <button class="action-btn" @tap="testHandDetection" :disabled="!tfStatus.success">测试手部检测</button>
    </view>
    
    <!-- 调试信息 -->
    <view class="debug-section" v-if="debugInfo">
      <view class="debug-card">
        <view class="debug-header">
          <text class="debug-title">调试信息</text>
        </view>
        <view class="debug-content">
          <text class="debug-text">{{ JSON.stringify(debugInfo, null, 2) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
// 注意：确保以下依赖已通过 npm 安装
// npm install @tensorflow/tfjs @tensorflow-models/hand-pose-detection @mediapipe/hands

export default {
  data() {
    return {
      cameraPosition: 'front',
      cameraReady: false,
      cameraContext: null,
      tfStatus: {
        success: false,
        message: '未测试',
        version: null,
        supportedModels: null
      },
      debugInfo: null
    }
  },
  onLoad() {
    // 页面加载时执行
    this.initCamera();
  },
  methods: {
    // 导航返回
    navigateBack() {
      uni.navigateBack();
    },
    
    // 初始化摄像头
    initCamera() {
      // 创建摄像头上下文
      this.cameraContext = uni.createCameraContext();
      
      // 请求摄像头权限
      uni.authorize({
        scope: 'scope.camera',
        success: () => {
          console.log('摄像头权限获取成功');
        },
        fail: (err) => {
          console.error('摄像头权限获取失败:', err);
          uni.showModal({
            title: '权限错误',
            content: '无法获取摄像头权限，请在设置中允许应用使用摄像头',
            showCancel: false
          });
        }
      });
    },
    
    // 处理摄像头就绪事件
    handleCameraReady() {
      console.log('摄像头已就绪');
      this.cameraReady = true;
    },
    
    // 处理摄像头错误
    handleCameraError(error) {
      console.error('摄像头错误:', error);
      this.cameraReady = false;
      uni.showModal({
        title: '摄像头错误',
        content: '无法访问摄像头，请检查权限设置',
        showCancel: false
      });
    },
    
    // 切换摄像头
    switchCamera() {
      this.cameraPosition = this.cameraPosition === 'front' ? 'back' : 'front';
    },
    
    // 测试 TensorFlow.js
    async testTensorflow() {
      try {
        uni.showLoading({
          title: '测试中...'
        });
        
        // 动态导入 TensorFlow.js 以处理可能的导入错误
        const tf = await import('@tensorflow/tfjs');
        
        // 执行基本测试
        const a = tf.tensor2d([[1, 2], [3, 4]]);
        const b = tf.tensor2d([[5, 6], [7, 8]]);
        const result = a.add(b);
        const resultArray = await result.array();
        
        // 更新状态
        this.tfStatus = {
          success: true,
          message: '加载成功',
          version: tf.version.tfjs,
          supportedModels: ['基础模块已加载']
        };
        
        // 设置调试信息
        this.debugInfo = {
          tensorflowVersion: tf.version.tfjs,
          testCalculation: resultArray,
          backend: tf.getBackend()
        };
        
        // 清理张量
        tf.dispose([a, b, result]);
        
        uni.showToast({
          title: 'TensorFlow 测试成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('TensorFlow 测试失败:', error);
        
        this.tfStatus = {
          success: false,
          message: '加载失败: ' + error.message,
          version: null,
          supportedModels: null
        };
        
        this.debugInfo = {
          error: error.message,
          stack: error.stack
        };
        
        uni.showToast({
          title: 'TensorFlow 测试失败',
          icon: 'error'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 测试手部检测
    async testHandDetection() {
      try {
        uni.showLoading({
          title: '测试手部检测...'
        });
        
        // 动态导入依赖
        const tf = await import('@tensorflow/tfjs');
        const handPoseDetection = await import('@tensorflow-models/hand-pose-detection');
        
        // 检查支持的模型
        const supportedModels = handPoseDetection.SupportedModels;
        
        this.debugInfo = {
          supportedModels: Object.keys(supportedModels),
          modelInfo: 'MediaPipe Hands model supported'
        };
        
        uni.showToast({
          title: '手部检测模块加载成功',
          icon: 'success'
        });
        
        // 更新模型信息
        this.tfStatus.supportedModels = Object.keys(supportedModels);
      } catch (error) {
        console.error('手部检测测试失败:', error);
        
        this.debugInfo = {
          error: error.message,
          stack: error.stack
        };
        
        uni.showToast({
          title: '手部检测测试失败',
          icon: 'error'
        });
      } finally {
        uni.hideLoading();
      }
    }
  }
}
</script>

<style lang="scss">
.recognition-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
  
  .page-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .back-button {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
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
  
  .camera-section {
    position: relative;
    margin-bottom: 20rpx;
    
    .camera {
      width: 100%;
      height: 600rpx;
      border-radius: 16rpx;
      overflow: hidden;
    }
    
    .controls {
      position: absolute;
      bottom: 20rpx;
      right: 20rpx;
      
      .control-btn {
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10rpx 20rpx;
        border-radius: 10rpx;
        
        .btn-text {
          color: #fff;
          font-size: 24rpx;
        }
      }
    }
  }
  
  .status-section {
    margin-bottom: 20rpx;
    
    .status-card {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 20rpx;
      box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
      
      .status-header {
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 20rpx;
        margin-bottom: 20rpx;
        
        .status-title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
      }
      
      .status-content {
        .status-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16rpx;
          
          .item-label {
            font-size: 28rpx;
            color: #666;
          }
          
          .item-value {
            font-size: 28rpx;
            color: #333;
            font-weight: bold;
            
            &.status-success {
              color: #4CAF50;
            }
            
            &.status-error {
              color: #F44336;
            }
          }
        }
      }
    }
  }
  
  .action-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20rpx;
    
    .action-btn {
      flex: 1;
      margin: 0 10rpx;
      height: 80rpx;
      line-height: 80rpx;
      font-size: 28rpx;
      background-color: #3C8999;
      color: #fff;
      border-radius: 40rpx;
      
      &:disabled {
        background-color: #ccc;
        color: #999;
      }
    }
  }
  
  .debug-section {
    margin-top: 20rpx;
    
    .debug-card {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 20rpx;
      box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
      
      .debug-header {
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 20rpx;
        margin-bottom: 20rpx;
        
        .debug-title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
      }
      
      .debug-content {
        .debug-text {
          font-size: 24rpx;
          color: #666;
          word-break: break-all;
          white-space: pre-wrap;
          font-family: monospace;
        }
      }
    }
  }
}
</style>