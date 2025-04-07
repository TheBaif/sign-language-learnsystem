<template>
  <view class="profile-container">
    <!-- Stylized background elements -->
    <view class="background-elements">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>
    
    <view class="profile-content">
      <!-- Header with back button -->
      <view class="header">
        <text class="page-title">个人中心</text>
        <view class="spacer"></view>
      </view>
      
      <!-- Loading state -->
      <view v-if="loading" class="loading-state">
        <view class="loader"></view>
        <text>加载中...</text>
      </view>
      
      <!-- Profile content -->
      <view v-else class="profile-main">
        <!-- Avatar card -->
        <view class="avatar-card">
          <view class="avatar-wrapper" @tap="showEditAvatar">
            <image 
              :src="userInfo.userPic || '/static/avatar.png'" 
              mode="aspectFill" 
              class="avatar"
            ></image>
            <view class="edit-overlay">
            </view>
          </view>
          <text class="username">{{ userInfo.username || '未设置' }}</text>
          <text class="join-date" v-if="userInfo.createTime">加入时间：{{ formatDate(userInfo.createTime) }}</text>
        </view>
        
        <!-- Info card -->
        <view class="info-card">
          <view class="card-header">
            <text class="section-title">账号信息</text>
          </view>
          
          <view class="info-list">
            <view class="info-item">
              <text class="info-label">用户名</text>
              <view class="info-value">
                <text>{{ userInfo.username || '未设置' }}</text>
              </view>
            </view>
            
            <view class="info-item">
              <text class="info-label">昵称</text>
              <view class="info-value">
                <text>{{ userInfo.nickname || '未设置' }}</text>
                <view class="edit-button" @tap="showEditNickname">
                </view>
              </view>
            </view>
            
            <view class="info-item">
              <text class="info-label">邮箱</text>
              <view class="info-value">
                <text>{{ userInfo.email || '未设置' }}</text>
                <view class="edit-button" @tap="showEditEmail">
                </view>
              </view>
            </view>
          </view>
        </view>
        
        
        
        <!-- Logout button -->
        <view class="action-section">
          <button class="logout-btn" @tap="handleLogout">退出登录</button>
        </view>
        
        <!-- App info footer -->
        <view class="app-info">
          <text class="version-text">手语学习 v1.0.0</text>
          <text class="copyright-text">© 2025 All Rights Reserved</text>
        </view>
      </view>
    </view>
    
    <!-- Avatar edit popup -->
    <uni-popup ref="avatarPopup" type="bottom">
      <view class="popup-content">
        <view class="popup-title">修改头像</view>
        <view class="popup-options">
          <view class="popup-option" @tap="chooseImage('album')">
            <text class="option-text">从相册选择</text>
          </view>
          <view class="popup-option" @tap="chooseImage('camera')">
            <text class="option-text">拍照</text>
          </view>
        </view>
        <view class="popup-cancel" @tap="closePopup">取消</view>
      </view>
    </uni-popup>
    
    <!-- Nickname edit popup -->
    <uni-popup ref="nicknamePopup" type="dialog">
      <uni-popup-dialog
        title="修改昵称"
        mode="input"
        :value="editForm.nickname"
        placeholder="请输入昵称"
        @confirm="handleUpdateNickname"
      ></uni-popup-dialog>
    </uni-popup>
    
    <!-- Email edit popup -->
    <uni-popup ref="emailPopup" type="dialog">
      <uni-popup-dialog
        title="修改邮箱"
        mode="input"
        :value="editForm.email"
        placeholder="请输入邮箱"
        @confirm="handleUpdateEmail"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      userInfo: {},
      loading: true,
      editForm: {
        nickname: '',
        email: ''
      }
    }
  },
  
  onLoad() {
    this.getUserInfo()
  },
  
  methods: {
    // Navigation methods
    navigateBack() {
      uni.navigateBack()
    },
    
    navigateToChangePwd() {
      uni.navigateTo({
        url: '/pages/change-password/change-password'
      })
    },
    
    // Format date method
    formatDate(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      return `${year}-${month}-${day}`
    },
    
    // Get user information
    async getUserInfo() {
      try {
        this.loading = true
        
        const res = await http.get('/user/userInfo')
        console.log('获取到的用户信息:', res)
        
        if (res.data && res.data.code === 0) {
          this.userInfo = res.data.data
          this.editForm.nickname = this.userInfo.nickname
          this.editForm.email = this.userInfo.email
        } else if (res.code === 0) {
          // Direct API result format
          this.userInfo = res.data
          this.editForm.nickname = this.userInfo.nickname
          this.editForm.email = this.userInfo.email
        } else {
          const message = (res.data && res.data.message) || res.message || '获取用户信息失败'
          uni.showToast({
            title: message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
        
        // Might be unauthenticated
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }, 1500)
      } finally {
        this.loading = false
      }
    },
    
    // Avatar related methods
    showEditAvatar() {
      this.$refs.avatarPopup.open()
    },
    
    showEditNickname() {
      this.$refs.nicknamePopup.open()
    },
    
    showEditEmail() {
      this.$refs.emailPopup.open()
    },
    
    closePopup() {
      this.$refs.avatarPopup.close()
      this.$refs.nicknamePopup.close()
      this.$refs.emailPopup.close()
    },
    
    // Image selection
    chooseImage(sourceType) {
      uni.chooseImage({
        count: 1, // Only choose one image
        sourceType: [sourceType], // 'album' or 'camera'
        success: (res) => {
          const tempFilePaths = res.tempFilePaths
          this.uploadAndUpdateAvatar(tempFilePaths[0])
          this.$refs.avatarPopup.close()
        },
        fail: (err) => {
          console.error('选择图片失败:', err)
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      })
    },
    
    // Upload image and update avatar
    async uploadAndUpdateAvatar(filePath) {
      uni.showLoading({
        title: '上传中...'
      })
      
      try {
        // Step 1: Upload image to server with avatar directory
        const imageUrl = await this.uploadImageToServer(filePath)
        
        // Step 2: Update user avatar with the returned URL
        await this.updateAvatarUrl(imageUrl)
        
        // Show success message
        uni.showToast({
          title: '头像更新成功',
          icon: 'success'
        })
        
        // Refresh user info to display the new avatar
        this.getUserInfo()
      } catch (error) {
        console.error('上传头像失败:', error)
        uni.showToast({
          title: error.message || '上传头像失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // Upload image to server
    uploadImageToServer(filePath) {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: 'http://localhost:8080/upload?directory=avatar',
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': uni.getStorageSync('token')
          },
          success: (uploadRes) => {
            console.log('文件上传响应:', uploadRes)
            if (uploadRes.statusCode === 200) {
              try {
                const data = JSON.parse(uploadRes.data)
                if (data.code === 0) {
                  resolve(data.data)
                } else {
                  reject(new Error(data.message || '上传失败'))
                }
              } catch (e) {
                console.error('解析上传响应失败:', e)
                reject(new Error('解析响应失败'))
              }
            } else {
              reject(new Error(`上传失败: ${uploadRes.statusCode}`))
            }
          },
          fail: (err) => {
            console.error('上传请求失败:', err)
            reject(new Error('上传请求失败'))
          }
        })
      })
    },
    
    // Update avatar URL
    updateAvatarUrl(avatarUrl) {
      return new Promise((resolve, reject) => {
        uni.request({
          url: `http://localhost:8080/user/updateAvatar?avatarUrl=${encodeURIComponent(avatarUrl)}`,
          method: 'PATCH',
          header: {
            'Content-Type': 'application/json',
            'Authorization': uni.getStorageSync('token')
          },
          success: (res) => {
            console.log('更新头像响应:', res)
            if (res.statusCode === 200) {
              let data = res.data
              if (data.code === 0) {
                resolve(true)
              } else {
                reject(new Error(data.message || '更新头像失败'))
              }
            } else {
              reject(new Error(`请求失败，状态码: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            console.error('更新头像请求失败:', err)
            reject(new Error('请求失败'))
          }
        })
      })
    },
    
    // Update nickname
    async handleUpdateNickname(value) {
      if (!value || value.trim() === '') {
        uni.showToast({
          title: '昵称不能为空',
          icon: 'none'
        })
        return
      }
      
      // Validate nickname (1-10 non-whitespace characters)
      if (!/^\S{1,10}$/.test(value)) {
        uni.showToast({
          title: '昵称应为1-10位非空白字符',
          icon: 'none'
        })
        return
      }
      
      const updateData = {
        id: this.userInfo.id,
        nickname: value,
        email: this.userInfo.email
      }
      await this.updateUserInfo(updateData, '昵称')
    },
    
    // Update email
    async handleUpdateEmail(value) {
      // Simple email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (value && !emailRegex.test(value)) {
        uni.showToast({
          title: '邮箱格式不正确',
          icon: 'none'
        })
        return
      }
      
      const updateData = {
        id: this.userInfo.id,
        nickname: this.userInfo.nickname,
        email: value
      }
      await this.updateUserInfo(updateData, '邮箱')
    },
    
    // Update user info
    async updateUserInfo(data, fieldName) {
      try {
        uni.showLoading({
          title: '更新中...'
        })
        
        const result = await http.put('/user/update', data)
        
        if (result.statusCode === 200 && result.data.code === 0) {
          uni.showToast({
            title: `${fieldName}更新成功`,
            icon: 'success'
          })
          this.getUserInfo() // Refresh user info
        } else {
          throw new Error(result.data.message || '更新失败')
        }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        uni.showToast({
          title: error.message || '更新失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // Logout method
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // Clear token and other cached data
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.removeStorageSync('searchResults')
            
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            })
            
            // Navigate to login page
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/login/login'
              })
            }, 1500)
          }
        }
      })
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
$text-color: #333;
$text-light: #666;
$text-lighter: #999;
$background-color: #f8f8f8;
$card-background: #ffffff;
$border-radius-sm: 10rpx;
$border-radius-md: 20rpx;
$border-radius-lg: 30rpx;
$box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
$transition-duration: 0.3s;

// Keyframes for animations
@keyframes floating {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
  100% { transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.05); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0.6; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

// Main container styles
.profile-container {
  min-height: 100vh;
  background-color: $background-color;
  position: relative;
  
  // Background decorative elements
  .background-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 30vh;
    background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
    border-bottom-left-radius: 30rpx;
    border-bottom-right-radius: 30rpx;
    overflow: hidden;
    pointer-events: none;
    
    .circle {
      position: absolute;
      border-radius: 50%;
      background: linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
      
      &.circle-1 {
        top: -100rpx;
        right: -100rpx;
        width: 400rpx;
        height: 400rpx;
        animation: pulse 8s infinite ease-in-out;
      }
      
      &.circle-2 {
        bottom: -150rpx;
        left: -150rpx;
        width: 400rpx;
        height: 400rpx;
        animation: pulse 12s infinite ease-in-out;
      }
      
      &.circle-3 {
        top: 20%;
        right: 20%;
        width: 200rpx;
        height: 200rpx;
        animation: pulse 10s infinite ease-in-out;
      }
    }
  }
  
  // Main content container
  .profile-content {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding-bottom: 40rpx;
    
    // Header with back button
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 40rpx 30rpx 20rpx;
      
      .back-button {
        width: 70rpx;
        height: 70rpx;
        border-radius: 35rpx;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color $transition-duration;
        
        &:active {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .back-icon {
          font-family: "iconfont";
          font-size: 36rpx;
          color: #fff;
        }
      }
      
      .page-title {
        font-size: 36rpx;
        font-weight: bold;
        color: #ffffff;
        text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
      }
      
      .spacer {
        width: 70rpx;
      }
    }
    
    // Loading state
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      
      .loader {
        width: 70rpx;
        height: 70rpx;
        border-radius: 50%;
        border: 4rpx solid rgba($primary-color, 0.1);
        border-top-color: $primary-color;
        animation: spin 1s infinite linear;
        margin-bottom: 20rpx;
      }
      
      text {
        font-size: 28rpx;
        color: $text-light;
      }
    }
    
    // Main profile content
    .profile-main {
      padding: 0 30rpx;
      animation: fadeIn 0.5s;
      
      // Avatar card
      .avatar-card {
        background-color: $card-background;
        border-radius: $border-radius-lg;
        padding: 30rpx;
        margin-bottom: 30rpx;
        box-shadow: $box-shadow;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .avatar-wrapper {
          position: relative;
          margin-bottom: 20rpx;
          
          .avatar {
            width: 160rpx;
            height: 160rpx;
            border-radius: 80rpx;
            border: 6rpx solid #fff;
            box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
          }
          
          .edit-overlay {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 50rpx;
            height: 50rpx;
            background: $primary-color;
            border-radius: 25rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2rpx solid #fff;
            box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
            
            .edit-icon {
              font-family: "iconfont";
              font-size: 24rpx;
              color: #fff;
            }
          }
        }
        
        .username {
          font-size: 34rpx;
          font-weight: bold;
          color: $text-color;
          margin-bottom: 10rpx;
        }
        
        .join-date {
          font-size: 24rpx;
          color: $text-lighter;
        }
      }
      
      // Info card
      .info-card {
        background-color: $card-background;
        border-radius: $border-radius-lg;
        padding: 30rpx;
        margin-bottom: 30rpx;
        box-shadow: $box-shadow;
        
        .card-header {
          margin-bottom: 20rpx;
          
          .section-title {
            font-size: 30rpx;
            font-weight: bold;
            color: $text-color;
            position: relative;
            padding-left: 20rpx;
            
            &::before {
              content: "";
              position: absolute;
              left: 0;
              top: 15%;
              height: 70%;
              width: 6rpx;
              background: linear-gradient(to bottom, $primary-color, $primary-light);
              border-radius: 3rpx;
            }
          }
        }
        
        .info-list {
          .info-item {
            display: flex;
            padding: 20rpx 0;
            border-bottom: 1px solid #f5f5f5;
            
            &:last-child {
              border-bottom: none;
            }
            
            .info-label {
              width: 140rpx;
              font-size: 28rpx;
              color: $text-light;
            }
            
            .info-value {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: space-between;
              
              text {
                font-size: 28rpx;
                color: $text-color;
              }
              
              .edit-button {
                width: 50rpx;
                height: 50rpx;
                border-radius: 25rpx;
                background-color: #f5f5f5;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color $transition-duration;
                
                &:active {
                  background-color: #e5e5e5;
                }
                
                .edit-button-icon {
                  font-family: "iconfont";
                  font-size: 24rpx;
                  color: $text-light;
                }
              }
            }
          }
        }
      }
      
      // Security card
      .security-card {
        background-color: $card-background;
        border-radius: $border-radius-lg;
        padding: 30rpx;
        margin-bottom: 30rpx;
        box-shadow: $box-shadow;
        
        .card-header {
          margin-bottom: 20rpx;
          
          .section-title {
            font-size: 30rpx;
            font-weight: bold;
            color: $text-color;
            position: relative;
            padding-left: 20rpx;
            
            &::before {
              content: "";
              position: absolute;
              left: 0;
              top: 15%;
              height: 70%;
              width: 6rpx;
              background: linear-gradient(to bottom, $primary-color, $primary-light);
              border-radius: 3rpx;
            }
          }
        }
        
        .security-list {
          .security-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 25rpx 0;
            border-bottom: 1px solid #f5f5f5;
            transition: background-color $transition-duration;
            
            &:last-child {
              border-bottom: none;
            }
            
            &:active {
              background-color: #f9f9f9;
            }
            
            .security-item-content {
              display: flex;
              align-items: center;
              
              .security-icon {
                font-family: "iconfont";
                font-size: 34rpx;
                color: $primary-color;
                margin-right: 20rpx;
              }
              
              .security-label {
                font-size: 28rpx;
                color: $text-color;
              }
            }
            
            .arrow-icon {
              font-family: "iconfont";
              font-size: 24rpx;
              color: $text-lighter;
            }
          }
        }
      }
      
      // Action buttons section
      .action-section {
        margin: 40rpx 0;
        
        .logout-btn {
          background-color: #ff3b30;
          color: #fff;
          font-size: 30rpx;
          height: 90rpx;
          line-height: 90rpx;
          border-radius: 45rpx;
          box-shadow: 0 4rpx 12rpx rgba(255, 59, 48, 0.2);
          transition: all $transition-duration;
          
          &::after {
            border: none;
          }
          
          &:active {
            transform: scale(0.98);
            opacity: 0.9;
          }
        }
      }
      
      // App info footer
      .app-info {
        text-align: center;
        padding: 20rpx 0 40rpx;
        
        .version-text {
          font-size: 24rpx;
          color: $text-lighter;
          margin-bottom: 10rpx;
          display: block;
        }
        
        .copyright-text {
          font-size: 22rpx;
          color: $text-lighter;
          opacity: 0.8;
        }
      }
    }
  }
  
  // Bottom popup styles
  .popup-content {
    background-color: $card-background;
    border-top-left-radius: $border-radius-lg;
    border-top-right-radius: $border-radius-lg;
    padding-bottom: env(safe-area-inset-bottom);
    
    .popup-title {
      font-size: 32rpx;
      font-weight: bold;
      color: $text-color;
      text-align: center;
      padding: 30rpx 0;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .popup-options {
      .popup-option {
        display: flex;
        align-items: center;
        padding: 30rpx;
        transition: background-color $transition-duration;
        
        &:active {
          background-color: #f9f9f9;
        }
        
        .option-icon {
          font-family: "iconfont";
          font-size: 40rpx;
          color: $primary-color;
          margin-right: 20rpx;
        }
        
        .option-text {
          font-size: 30rpx;
          color: $text-color;
        }
      }
    }
    
    .popup-cancel {
      text-align: center;
      padding: 30rpx 0;
      font-size: 30rpx;
      color: $text-light;
      border-top: 10rpx solid #f5f5f5;
      transition: background-color $transition-duration;
      
      &:active {
        background-color: #f9f9f9;
      }
    }
  }
}
</style>