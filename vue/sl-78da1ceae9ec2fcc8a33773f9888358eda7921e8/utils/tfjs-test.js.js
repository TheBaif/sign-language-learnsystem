/**
 * TensorFlow.js 验证工具
 * 用于测试TensorFlow.js的安装和功能是否正常
 */

/**
 * 测试TensorFlow.js是否正确加载
 * @returns {Promise<Object>} 测试结果对象
 */
export async function testTensorflowImport() {
  try {
    // 动态导入TensorFlow.js
    const tf = await import('@tensorflow/tfjs');
    
    // 执行基本的张量操作验证功能正常
    const a = tf.tensor2d([[1, 2], [3, 4]]);
    const b = tf.tensor2d([[5, 6], [7, 8]]);
    const result = a.add(b);
    
    // 获取结果数据
    const resultArray = await result.array();
    
    // 获取后端信息
    const backend = tf.getBackend();
    const availableBackends = tf.engine().registryFactory.getKeys();
    
    // 清理张量资源
    tf.dispose([a, b, result]);
    
    return {
      success: true,
      version: tf.version.tfjs,
      backend: backend,
      availableBackends: availableBackends,
      computation: resultArray,
      message: 'TensorFlow.js加载成功'
    };
  } catch (error) {
    console.error('TensorFlow.js测试失败:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      message: '加载失败: ' + error.message
    };
  }
}

/**
 * 测试手部姿势检测模型是否可用
 * @returns {Promise<Object>} 测试结果对象
 */
export async function testHandPoseDetection() {
  try {
    // 动态导入依赖
    const handPoseDetection = await import('@tensorflow-models/hand-pose-detection');
    
    // 检查支持的模型
    const supportedModels = handPoseDetection.SupportedModels;
    
    return {
      success: true,
      supportedModels: Object.keys(supportedModels),
      message: '手部检测模块加载成功'
    };
  } catch (error) {
    console.error('手部检测模块测试失败:', error);
    return {
      success: false,
      error: error.message,
      message: '手部检测模块加载失败: ' + error.message
    };
  }
}

/**
 * 检测WebGL支持情况
 * @returns {Object} WebGL支持情况
 */
export function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || 
               canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return {
        supported: false,
        message: 'WebGL不受支持，手部检测性能可能受限'
      };
    }
    
    // 获取WebGL信息
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let vendor = 'unknown';
    let renderer = 'unknown';
    
    if (debugInfo) {
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    
    return {
      supported: true,
      vendor: vendor,
      renderer: renderer,
      message: 'WebGL支持正常'
    };
  } catch (error) {
    return {
      supported: false,
      error: error.message,
      message: 'WebGL检测失败: ' + error.message
    };
  }
}