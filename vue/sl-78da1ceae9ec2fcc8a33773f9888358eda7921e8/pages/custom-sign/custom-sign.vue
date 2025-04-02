<template>
  <view class="custom-sign-container">
    <view class="form-card">
      <text class="page-title">添加自定义词汇</text>
      
      <!-- 基本信息表单 -->
      <view class="form-group">
        <view class="form-item">
          <text class="label">词汇名称 <text class="required">*</text></text>
          <input 
            v-model="formData.name"
            class="input"
            placeholder="请输入词汇名称"
          />
        </view>
        
        <view class="form-item">
          <text class="label">拼音 <text class="required">*</text></text>
          <input 
            v-model="formData.pinyin"
            class="input"
            placeholder="请输入拼音，如: nǐ hǎo"
          />
        </view>
        
        <view class="form-item">
          <text class="label">手势描述</text>
          <textarea 
            v-model="formData.gesture"
            class="textarea"
            placeholder="请输入手势描述，使用|||分隔每个步骤"
          />
          <text class="description">例如: 右手五指并拢|||手心向内置于胸前|||轻拍两下</text>
        </view>
      </view>
      
      <!-- 图片上传 -->
      <view class="form-item">
        <text class="label">手语图片 <text class="required">*</text></text>
        <view class="upload-container">
          <view v-if="!formData.imageSrc" class="upload-btn" @tap="uploadImage">
            <uni-icons type="camera-filled" size="24" color="#999"></uni-icons>
            <text>上传图片</text>
          </view>
          <view v-else class="image-preview">
            <image :src="formData.imageSrc" mode="aspectFill" @tap="previewImage"></image>
            <text class="delete-btn" @tap.stop="removeImage">×</text>
          </view>
        </view>
      </view>
      
      <!-- 视频上传 -->
      <view class="form-item">
        <text class="label">手语视频</text>
        <view class="upload-container">
          <view v-if="!formData.wordVideoSrc" class="upload-btn" @tap="uploadVideo">
            <uni-icons type="videocam-filled" size="24" color="#999"></uni-icons>
            <text>上传视频</text>
          </view>
          <view v-else class="video-preview">
            <video 
              :src="formData.wordVideoSrc"
              controls
              object-fit="cover"
            ></video>
            <text class="delete-btn" @tap="removeVideo">×</text>
          </view>
        </view>
      </view>
      
      <!-- 分类选择 -->
      <view class="form-item">
        <text class="label">所属分类</text>
        <picker 
          mode="selector" 
          :range="categoryOptions" 
          range-key="name"
          @change="onCategoryChange"
        >
          <view class="picker">
            <text v-if="selectedCategory">{{ selectedCategory.name }}</text>
            <text v-else class="placeholder">请选择分类</text>
            <uni-icons type="right" size="16" color="#999"></uni-icons>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">子分类</text>
        <picker 
          mode="selector" 
          :range="subcategoryOptions" 
          range-key="name"
          :disabled="!selectedCategory"
          @change="onSubcategoryChange"
        >
          <view class="picker" :class="{'disabled': !selectedCategory}">
            <text v-if="selectedSubcategory">{{ selectedSubcategory.name }}</text>
            <text v-else class="placeholder">{{ selectedCategory ? '请选择子分类' : '请先选择分类' }}</text>
            <uni-icons type="right" size="16" color="#999"></uni-icons>
          </view>
        </picker>
      </view>
      
      <!-- 提交按钮 -->
      <button 
        class="submit-btn" 
        :disabled="!isFormValid" 
        :loading="submitting"
        @tap="submitForm"
      >
        {{ submitting ? '提交中...' : '添加词汇' }}
      </button>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      formData: {
        name: '',
        pinyin: '',
        gesture: '',
        imageSrc: '',
        wordVideoSrc: '',
        parentId: null,
        parentName: '',
        childId: null,
        childName: ''
      },
      submitting: false,
      categoryOptions: [],
      subcategoryOptions: [],
      selectedCategory: null,
      selectedSubcategory: null
    }
  },
  
  computed: {
    isFormValid() {
      return this.formData.name.trim() && 
             this.formData.pinyin.trim() && 
             this.formData.imageSrc
    }
  },
  
  onLoad() {
    this.checkLogin()
    this.loadCategories()
  },
  
  methods: {
    checkLogin() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }, 1500)
      }
    },
    
    async loadCategories() {
      try {
        const res = await http.get('/parentSign/list')
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.categoryOptions = res.data.data || []
        } else {
          throw new Error(res.data.message || '获取分类失败')
        }
      } catch (error) {
        console.error('获取分类列表失败:', error)
        uni.showToast({
          title: '获取分类列表失败',
          icon: 'none'
        })
      }
    },
    
    async loadSubcategories(parentId) {
      try {
        const res = await http.get('/childSign/list')
        
        if (res.statusCode === 200 && res.data.code === 0) {
          const allSubcategories = res.data.data || []
          // 筛选当前父分类的子分类
          this.subcategoryOptions = allSubcategories.filter(
            item => item.parentId === parentId
          )
        } else {
          throw new Error(res.data.message || '获取子分类失败')
        }
      } catch (error) {
        console.error('获取子分类列表失败:', error)
        uni.showToast({
          title: '获取子分类列表失败',
          icon: 'none'
        })
      }
    },
    
    onCategoryChange(e) {
      const index = e.detail.value
      this.selectedCategory = this.categoryOptions[index]
      this.formData.parentId = this.selectedCategory.id
      this.formData.parentName = this.selectedCategory.name
      
      // 重置子分类选择
      this.selectedSubcategory = null
      this.formData.childId = null
      this.formData.childName = ''
      
      // 加载子分类
      this.loadSubcategories(this.selectedCategory.id)
    },
    
    onSubcategoryChange(e) {
      const index = e.detail.value
      this.selectedSubcategory = this.subcategoryOptions[index]
      this.formData.childId = this.selectedSubcategory.id
      this.formData.childName = this.selectedSubcategory.name
    },
    
    uploadImage() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.uploadFile(tempFilePath, 'image')
        }
      })
    },
    
    uploadVideo() {
      uni.chooseVideo({
        count: 1,
        success: (res) => {
          const tempFilePath = res.tempFilePath
          this.uploadFile(tempFilePath, 'video')
        }
      })
    },
    
    async uploadFile(filePath, fileType) {
      uni.showLoading({
        title: '上传中...'
      })
      
      try {
        const uploadTask = uni.uploadFile({
          url: 'http://localhost:8080/upload',
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': uni.getStorageSync('token')
          },
          success: (uploadRes) => {
            try {
              const result = JSON.parse(uploadRes.data)
              if (result.code === 0) {
                const fileUrl = result.data
                if (fileType === 'image') {
                  this.formData.imageSrc = fileUrl
                } else {
                  this.formData.wordVideoSrc = fileUrl
                }
                
                uni.showToast({
                  title: '上传成功',
                  icon: 'success'
                })
              } else {
                throw new Error(result.message || '上传失败')
              }
            } catch (e) {
              console.error('解析上传响应失败:', e)
              uni.showToast({
                title: '上传失败',
                icon: 'none'
              })
            }
          },
          fail: (err) => {
            console.error('上传请求失败:', err)
            uni.showToast({
              title: '上传失败',
              icon: 'none'
            })
          },
          complete: () => {
            uni.hideLoading()
          }
        })
        
        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('上传进度', res.progress)
        })
      } catch (error) {
        console.error('上传文件失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        })
      }
    },
    
    removeImage() {
      uni.showModal({
        title: '提示',
        content: '确定要删除已上传的图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.formData.imageSrc = ''
          }
        }
      })
    },
    
    removeVideo() {
      uni.showModal({
        title: '提示',
        content: '确定要删除已上传的视频吗？',
        success: (res) => {
          if (res.confirm) {
            this.formData.wordVideoSrc = ''
          }
        }
      })
    },
    
    previewImage() {
      uni.previewImage({
        urls: [this.formData.imageSrc],
        current: this.formData.imageSrc
      })
    },
    
    async submitForm() {
      if (!this.isFormValid) {
        uni.showToast({
          title: '请填写必填字段',
          icon: 'none'
        })
        return
      }
      
      this.submitting = true
      
      try {
        const res = await http.post('/sign/add', this.formData)
        
        if (res.statusCode === 200 && res.data.code === 0) {
          uni.showToast({
            title: '添加成功',
            icon: 'success'
          })
          
          // 清空表单
          setTimeout(() => {
            this.resetForm()
            
            // 可选：添加成功后返回上一页
            // uni.navigateBack()
          }, 1500)
        } else {
          throw new Error(res.data.message || '添加失败')
        }
      } catch (error) {
        console.error('添加词汇失败:', error)
        uni.showToast({
          title: error.message || '添加失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    },
    
    resetForm() {
      this.formData = {
        name: '',
        pinyin: '',
        gesture: '',
        imageSrc: '',
        wordVideoSrc: '',
        parentId: null,
        parentName: '',
        childId: null,
        childName: ''
      }
      this.selectedCategory = null
      this.selectedSubcategory = null
    }
  }
}
</script>

<style lang="scss">
.custom-sign-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  
  .form-card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 40rpx 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .page-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 40rpx;
      text-align: center;
    }
    
    .form-group {
      margin-bottom: 20rpx;
    }
    
    .form-item {
      margin-bottom: 30rpx;
      
      .label {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 10rpx;
        display: block;
        
        .required {
          color: #ff4d4f;
        }
      }
      
      .input, .textarea, .picker {
        width: 100%;
        background-color: #f5f5f5;
        border-radius: 8rpx;
        padding: 20rpx;
        font-size: 28rpx;
        color: #333;
      }
      
      .textarea {
        height: 160rpx;
        width: 100%;
      }
      
      .description {
        font-size: 24rpx;
        color: #999;
        margin-top: 10rpx;
        display: block;
      }
      
      .picker {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .placeholder {
          color: #999;
        }
        
        &.disabled {
          opacity: 0.7;
        }
      }
    }
    
    .upload-container {
      .upload-btn {
        width: 100%;
        height: 200rpx;
        background-color: #f5f5f5;
        border-radius: 8rpx;
        border: 1px dashed #ccc;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        
        text {
          color: #999;
          font-size: 26rpx;
          margin-top: 10rpx;
        }
      }
      
      .image-preview, .video-preview {
        position: relative;
        width: 100%;
        height: 300rpx;
        border-radius: 8rpx;
        overflow: hidden;
        
        image, video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .delete-btn {
          position: absolute;
          top: 10rpx;
          right: 10rpx;
          width: 50rpx;
          height: 50rpx;
          background-color: rgba(0, 0, 0, 0.5);
          color: #fff;
          border-radius: 25rpx;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 40rpx;
        }
      }
    }
    
    .submit-btn {
      width: 100%;
      height: 80rpx;
      line-height: 80rpx;
      background: linear-gradient(to right, #3C8999, #55a5b5);
      color: #fff;
      font-size: 30rpx;
      border-radius: 40rpx;
      margin-top: 30rpx;
      
      &:disabled {
        opacity: 0.6;
      }
    }
  }
}
</style>