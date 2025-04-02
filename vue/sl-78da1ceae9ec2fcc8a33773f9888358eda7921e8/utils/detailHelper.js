// 在utils文件夹中创建detailHelper.js
export default {
  /**
   * 统一处理详情页数据
   * @param {Object|Array} data - 原始数据，可能是对象或数组
   * @returns {Array} - 标准化后的数据数组
   */
  prepareDetailData(data) {
    // 确保数据是数组形式
    const items = Array.isArray(data) ? data : [data];
    
    // 标准化每一项数据
    return items.map(item => ({
      id: item.id || 0,
      name: item.name || '未命名',
      pinyin: item.pinyin || '',
      gesture: item.gesture || '',
      imageSrc: item.imageSrc,
      wordVideoSrc: item.wordVideoSrc,
      parentId: item.parentId,
      parentName: item.parentName,
      childId: item.childId,
      childName: item.childName
    }));
  }
  }