<template>
  <view class="user-container">
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else class="user-card">
      <view class="avatar-section">
        <image 
          :src="userInfo.userPic || '/static/avatar.png'" 
          mode="aspectFill" 
          class="avatar"
          @tap="showEditAvatar"
        ></image>
        <view class="camera-icon">
          <uni-icons type="camera-filled" size="24" color="#fff"></uni-icons>
        </view>
      </view>
      
      <view class="info-section">
        <view class="info-item">
          <text class="label">用户名</text>
          <view class="value-container">
            <text class="value">{{ userInfo.username || '未设置' }}</text>
          </view>
        </view>
        
        <view class="info-item">
          <text class="label">昵称</text>
          <view class="value-container">
            <text class="value">{{ userInfo.nickname || '未设置' }}</text>
            <uni-icons type="right" size="18" color="#999" @click="showEditNickname"></uni-icons>
          </view>
        </view>
        
        <view class="info-item">
          <text class="label">邮箱</text>
          <view class="value-container">
            <text class="value">{{ userInfo.email || '未设置' }}</text>
            <uni-icons type="right" size="18" color="#999" @click="showEditEmail"></uni-icons>
          </view>
        </view>
      </view>
      
      
      <view class="action-buttons">
        <button class="logout-btn" @tap="handleLogout">退出登录</button>
      </view>
    </view>
    
    <!-- 编辑头像弹窗 -->
    <uni-popup ref="avatarPopup" type="bottom">
      <view class="popup-content">
        <view class="popup-title">修改头像</view>
        <view class="popup-options">
          <view class="popup-option" @tap="chooseImage('album')">从相册选择</view>
          <view class="popup-option" @tap="chooseImage('camera')">拍照</view>
        </view>
        <view class="popup-cancel" @tap="closePopup">取消</view>
      </view>
    </uni-popup>
    
    <!-- 编辑昵称弹窗 -->
    <uni-popup ref="nicknamePopup" type="dialog">
      <uni-popup-dialog
        title="修改昵称"
        mode="input"
        :value="editForm.nickname"
        placeholder="请输入昵称"
        @confirm="handleUpdateNickname"
      ></uni-popup-dialog>
    </uni-popup>
    
    <!-- 编辑邮箱弹窗 -->
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
      userInfo: {
        id: '',
        username: '',
        nickname: '',
        email: '',
        userPic: '',
        createTime: '',
        updateTime: ''
      },
      loading: true,
      editForm: {
        nickname: '',
        email: ''
      }
    }
  },
  
  onShow() {
    this.getUserInfo();
  },
  
  methods: {
    // Get user info from API
    async getUserInfo() {
      try {
        this.loading = true;
        
        // Try http utility first
        let res;
        try {
          res = await http.get('/user/userInfo');
        } catch (err) {
          // Fall back to direct request if http utility fails
          res = await this.requestGet('/user/userInfo');
        }
        
        console.log('获取到的用户信息:', res);
        
        if (res.data && res.data.code === 0) {
          this.userInfo = res.data.data;
          this.editForm.nickname = this.userInfo.nickname;
          this.editForm.email = this.userInfo.email;
        } else if (res.code === 0) {
          // Direct API result format
          this.userInfo = res.data;
          this.editForm.nickname = this.userInfo.nickname;
          this.editForm.email = this.userInfo.email;
        } else {
          const message = (res.data && res.data.message) || res.message || '获取用户信息失败';
          uni.showToast({
            title: message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        
        // Might be unauthenticated
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }, 1500);
      } finally {
        this.loading = false;
      }
    },
    
    // Generic GET request method
    requestGet(url) {
      return new Promise((resolve, reject) => {
        uni.request({
          url: `http://localhost:8080${url}`,
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
            'Authorization': uni.getStorageSync('token')
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res);
            } else {
              reject(new Error(`请求失败，状态码: ${res.statusCode}`));
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },
    
    // Popup related methods
    showEditAvatar() {
      this.$refs.avatarPopup.open();
    },
    
    showEditNickname() {
      this.$refs.nicknamePopup.open();
    },
    
    showEditEmail() {
      this.$refs.emailPopup.open();
    },
    
    closePopup() {
      this.$refs.avatarPopup.close();
      this.$refs.nicknamePopup.close();
      this.$refs.emailPopup.close();
    },
    
    // Choose and upload image
    chooseImage(sourceType) {
      uni.chooseImage({
        count: 1, // Only choose one image
        sourceType: [sourceType], // 'album' or 'camera'
        success: (res) => {
          const tempFilePaths = res.tempFilePaths;
          // Process selected image
          this.uploadAndUpdateAvatar(tempFilePaths[0]);
          // Close the popup
          this.$refs.avatarPopup.close();
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },
    
    // Upload image and update avatar
    async uploadAndUpdateAvatar(filePath) {
      uni.showLoading({
        title: '上传中...'
      });
      
      try {
        // Step 1: Upload image to server with avatar directory
        const imageUrl = await this.uploadImageToServer(filePath);
        
        // Step 2: Update user avatar with the returned URL
        await this.updateAvatarUrl(imageUrl);
        
        // Show success message
        uni.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
        
        // Refresh user info to display the new avatar
        this.getUserInfo();
      } catch (error) {
        console.error('上传头像失败:', error);
        uni.showToast({
          title: error.message || '上传头像失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // Upload image to server with avatar directory
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
            console.log('文件上传响应:', uploadRes);
            if (uploadRes.statusCode === 200) {
              try {
                const data = JSON.parse(uploadRes.data);
                if (data.code === 0) {
                  // The returned url will be like https://sign-dic.oss-cn-beijing.aliyuncs.com/avatar/filename
                  resolve(data.data);
                } else {
                  reject(new Error(data.message || '上传失败'));
                }
              } catch (e) {
                console.error('解析上传响应失败:', e);
                reject(new Error('解析响应失败'));
              }
            } else {
              reject(new Error(`上传失败: ${uploadRes.statusCode}`));
            }
          },
          fail: (err) => {
            console.error('上传请求失败:', err);
            reject(new Error('上传请求失败'));
          }
        });
      });
    },
    
    // Update avatar URL in user profile
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
            console.log('更新头像响应:', res);
            if (res.statusCode === 200) {
              let data = res.data;
              if (data.code === 0) {
                resolve(true);
              } else {
                reject(new Error(data.message || '更新头像失败'));
              }
            } else {
              reject(new Error(`请求失败，状态码: ${res.statusCode}`));
            }
          },
          fail: (err) => {
            console.error('更新头像请求失败:', err);
            reject(new Error('请求失败'));
          }
        });
      });
    },
    
    // Update nickname
    async handleUpdateNickname(value) {
      const updateData = {
        id: this.userInfo.id,
        nickname: value,
        email: this.userInfo.email
      };
      await this.updateUserInfo(updateData, '昵称');
    },
    
    // Update email
    async handleUpdateEmail(value) {
      // Simple email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        uni.showToast({
          title: '邮箱格式不正确',
          icon: 'none'
        });
        return;
      }
      
      const updateData = {
        id: this.userInfo.id,
        nickname: this.userInfo.nickname,
        email: value
      };
      await this.updateUserInfo(updateData, '邮箱');
    },
    
    // Update user info
    async updateUserInfo(data, fieldName) {
      try {
        uni.showLoading({
          title: '更新中...'
        });
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: 'http://localhost:8080/user/update',
            method: 'PUT',
            data: data,
            header: {
              'Content-Type': 'application/json',
              'Authorization': uni.getStorageSync('token')
            },
            success: (res) => {
              console.log('更新用户信息响应:', res);
              if (res.statusCode === 200) {
                resolve(res);
              } else {
                reject(new Error(`请求失败，状态码: ${res.statusCode}`));
              }
            },
            fail: (err) => {
              console.error('更新用户信息请求失败:', err);
              reject(new Error('请求失败'));
            }
          });
        });
        
        const res = result;
        
        if ((res.data && res.data.code === 0) || res.code === 0) {
          uni.showToast({
            title: `${fieldName}更新成功`,
            icon: 'success'
          });
          this.getUserInfo(); // Refresh user info
        } else {
          const message = (res.data && res.data.message) || res.message || '更新失败';
          throw new Error(message);
        }
      } catch (error) {
        console.error('更新用户信息失败:', error);
        uni.showToast({
          title: error.message || '更新失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
   
    
    // Logout
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token');
            
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            });
            
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/login/login'
              });
            }, 1500);
          }
        }
      });
    }
  }
}
</script>

<style lang="scss">
.user-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300rpx;
    color: #999;
    font-size: 28rpx;
  }
  
  .user-card {
    background-color: #fff;
    border-radius: 15rpx;
    padding: 40rpx 30rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .avatar-section {
      display: flex;
      justify-content: center;
      margin-bottom: 40rpx;
      position: relative;
      
      .avatar {
        width: 180rpx;
        height: 180rpx;
        border-radius: 50%;
        border: 4rpx solid #f0f0f0;
      }
      
      .camera-icon {
        position: absolute;
        bottom: 0;
        right: 50%;
        transform: translateX(60rpx);
        width: 50rpx;
        height: 50rpx;
        background-color: rgba(0, 122, 255, 0.8);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
    
    .info-section {
      margin-bottom: 50rpx;
      
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1px solid #f5f5f5;
        
        .label {
          color: #999;
          font-size: 28rpx;
        }
        
        .value-container {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          
          .value {
            color: #333;
            font-size: 28rpx;
            margin-right: 10rpx;
          }
        }
      }
    }
    
    .action-buttons {
      margin-top: 50rpx;
      
      .logout-btn {
        background-color: #FF3B30;
        color: #fff;
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        font-size: 28rpx;
      }
    }
  }
  
  .popup-content {
    background-color: #fff;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    overflow: hidden;
    
    .popup-title {
      text-align: center;
      font-size: 32rpx;
      color: #333;
      padding: 30rpx 0;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .popup-options {
      .popup-option {
        padding: 30rpx 0;
        text-align: center;
        font-size: 30rpx;
        color: #333;
        border-bottom: 1px solid #f5f5f5;
        
        &:active {
          background-color: #f5f5f5;
        }
      }
    }
    
    .popup-cancel {
      padding: 30rpx 0;
      text-align: center;
      font-size: 30rpx;
      color: #999;
      margin-top: 20rpx;
      
      &:active {
        background-color: #f5f5f5;
      }
    }
  }
}
</style>