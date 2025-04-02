// 引入 TensorFlow.js 和 MediaPipe 手部检测模型
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

// 手语识别类
class SignLanguageRecognizer {
  constructor() {
    this.handposeModel = null;
    this.signModel = null;
    this.initialized = false;
    this.handKeypoints = [];
    this.gestureSequence = [];
    this.maxSequenceLength = 30; // 记录30帧的手势数据
    this.classNames = ['你好', '谢谢', '再见', '请', '对不起']; // 支持的手语词汇
  }
  
  // 初始化模型
  async initialize() {
    try {
      // 加载手部检测模型
      console.log('加载 Handpose 模型...');
      this.handposeModel = await handpose.load();
      
      // 加载手语识别模型（这里使用TensorFlow.js保存的自定义模型）
      console.log('加载手语识别模型...');
      this.signModel = await tf.loadLayersModel('https://your-model-url/model.json');
      
      this.initialized = true;
      console.log('模型加载完成');
      return true;
    } catch (error) {
      console.error('初始化失败:', error);
      return false;
    }
  }
  
  // 检测单帧图像中的手
  async detectHands(imageElement) {
    if (!this.initialized) {
      throw new Error('模型尚未初始化');
    }
    
    try {
      // 使用 Handpose 检测手部关键点
      const predictions = await this.handposeModel.estimateHands(imageElement);
      
      if (predictions.length > 0) {
        // 保存手部关键点数据
        this.handKeypoints = predictions[0].landmarks;
        
        // 将关键点数据添加到序列中
        this.addToGestureSequence(this.handKeypoints);
        
        return {
          detected: true,
          keypoints: this.handKeypoints
        };
      } else {
        return {
          detected: false,
          keypoints: []
        };
      }
    } catch (error) {
      console.error('手部检测失败:', error);
      return {
        detected: false,
        keypoints: [],
        error: error.message
      };
    }
  }
  
  // 添加关键点数据到手势序列
  addToGestureSequence(keypoints) {
    // 对关键点进行预处理（归一化等）
    const processedKeypoints = this.preprocessKeypoints(keypoints);
    
    // 将处理后的关键点添加到序列
    this.gestureSequence.push(processedKeypoints);
    
    // 如果序列过长，移除最旧的帧
    if (this.gestureSequence.length > this.maxSequenceLength) {
      this.gestureSequence.shift();
    }
  }
  
  // 预处理关键点数据
  preprocessKeypoints(keypoints) {
    // 提取x, y坐标，忽略z坐标（简化为2D问题）
    const flatKeypoints = keypoints.flatMap(point => [point[0], point[1]]);
    
    // 归一化处理
    // 1. 找出边界框
    const xs = keypoints.map(p => p[0]);
    const ys = keypoints.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // 2. 计算边界框宽度和高度
    const width = maxX - minX;
    const height = maxY - minY;
    
    // 3. 将所有点相对于边界框中心归一化到[-1, 1]范围
    const normalizedKeypoints = flatKeypoints.map((val, idx) => {
      if (idx % 2 === 0) { // X坐标
        return (val - minX) / width * 2 - 1;
      } else { // Y坐标
        return (val - minY) / height * 2 - 1;
      }
    });
    
    return normalizedKeypoints;
  }
  
  // 识别手语
  async recognizeSign() {
    if (!this.initialized) {
      throw new Error('模型尚未初始化');
    }
    
    if (this.gestureSequence.length < 5) {
      return {
        recognized: false,
        message: '需要更多的手势数据'
      };
    }
    
    try {
      // 准备输入数据
      // 根据模型的输入要求可能需要调整
      let inputData;
      
      // 处理静态手势：使用最新的帧
      if (this.signModel.inputs[0].shape[1] === 42) { // 21个关键点，每个点2个坐标
        inputData = tf.tensor([this.gestureSequence[this.gestureSequence.length - 1]]);
      } 
      // 处理动态手势：使用整个序列
      else {
        // 确保序列长度一致
        let sequence = [...this.gestureSequence];
        while (sequence.length < this.maxSequenceLength) {
          sequence.push(sequence[sequence.length - 1]); // 填充
        }
        inputData = tf.tensor([sequence]);
      }
      
      // 进行预测
      const prediction = this.signModel.predict(inputData);
      const probabilities = await prediction.data();
      
      // 获取最高概率及其索引
      let maxProbIndex = 0;
      let maxProb = probabilities[0];
      
      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i];
          maxProbIndex = i;
        }
      }
      
      // 清理 tensor
      inputData.dispose();
      prediction.dispose();
      
      // 如果最高概率低于阈值，视为未识别
      if (maxProb < 0.7) {
        return {
          recognized: false,
          message: '手势不明确',
          confidence: maxProb
        };
      }
      
      // 返回识别结果
      return {
        recognized: true,
        signName: this.classNames[maxProbIndex],
        confidence: maxProb,
        allProbabilities: Array.from(probabilities)
      };
    } catch (error) {
      console.error('手语识别失败:', error);
      return {
        recognized: false,
        message: '识别过程出错',
        error: error.message
      };
    }
  }
  
  // 重置手势序列
  resetGestureSequence() {
    this.gestureSequence = [];
  }
  
  // 清理资源
  dispose() {
    if (this.signModel) {
      this.signModel.dispose();
    }
    this.handKeypoints = [];
    this.gestureSequence = [];
  }
  
  // 绘制手部关键点
  drawHand(ctx, keypoints, color = '#FF0000') {
    // 绘制关节点
    for (let i = 0; i < keypoints.length; i++) {
      const [x, y] = keypoints[i];
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      
      // 为关节点标号
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(i.toString(), x + 8, y + 8);
    }
    
    // 绘制手部连接线
    
    // 手掌基础连接
    this.drawConnector(ctx, keypoints, 0, 1);
    this.drawConnector(ctx, keypoints, 0, 5);
    this.drawConnector(ctx, keypoints, 0, 9);
    this.drawConnector(ctx, keypoints, 0, 13);
    this.drawConnector(ctx, keypoints, 0, 17);
    
    // 拇指连接
    this.drawConnector(ctx, keypoints, 1, 2);
    this.drawConnector(ctx, keypoints, 2, 3);
    this.drawConnector(ctx, keypoints, 3, 4);
    
    // 食指连接
    this.drawConnector(ctx, keypoints, 5, 6);
    this.drawConnector(ctx, keypoints, 6, 7);
    this.drawConnector(ctx, keypoints, 7, 8);
    
    // 中指连接
    this.drawConnector(ctx, keypoints, 9, 10);
    this.drawConnector(ctx, keypoints, 10, 11);
    this.drawConnector(ctx, keypoints, 11, 12);
    
    // 无名指连接
    this.drawConnector(ctx, keypoints, 13, 14);
    this.drawConnector(ctx, keypoints, 14, 15);
    this.drawConnector(ctx, keypoints, 15, 16);
    
    // 小指连接
    this.drawConnector(ctx, keypoints, 17, 18);
    this.drawConnector(ctx, keypoints, 18, 19);
    this.drawConnector(ctx, keypoints, 19, 20);
  }
  
  // 绘制连接线
  drawConnector(ctx, keypoints, i1, i2, color = '#00FF00') {
    const [x1, y1] = keypoints[i1];
    const [x2, y2] = keypoints[i2];
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

export default SignLanguageRecognizer;