<template>
	<view class="search-history">
		<view class="header">
			<text class="title">搜索历史</text>
			<text v-if="historyList.length" class="clear-btn" @tap="clearAllHistory">清空历史</text>
		</view>
		
		<view class="history-list" v-if="historyList.length">
			<view 
				v-for="(item, index) in historyList" 
				:key="index"
				class="history-item"
			>
				<text class="keyword" @tap="handleClick(item)">{{item}}</text>
				<text class="delete-btn" @tap.stop="deleteHistory(item)">×</text>
			</view>
		</view>
		<view v-else class="empty">
			<text>暂无搜索历史</text>
		</view>
	</view>
</template>

<script>
import http from '@/utils/request.js'

export default {
	name: 'search-history',
	data() {
		return {
			historyList: []
		}
	},
	mounted() {
		this.getSearchHistory()
	},
	methods: {
		checkToken() {
			const token = uni.getStorageSync('token')
			console.log('当前token:', token)
			
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none',
					duration: 2000
				})
				
				setTimeout(() => {
					uni.navigateTo({
						url: '/pages/login/login'
					})
				}, 2000)
				
				return false
			}
			return token
		},
		
		async getSearchHistory() {
			try {
				const token = this.checkToken()
				if (!token) return
				
				const res = await http.get('/user/search-history')
				console.log('获取历史响应:', res.data)
				
				if (res.data.code === 0) {
					this.historyList = res.data.data
				} else {
					uni.showToast({
						title: res.data.message,
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('获取搜索历史失败:', error)
				uni.showToast({
					title: '获取搜索历史失败',
					icon: 'none'
				})
			}
		},
		
		async saveHistory(keyword) {
			try {
				const token = this.checkToken()
				if (!token) return
				
				const res = await http.post('/user/search-history', {
					history: [keyword]
				})
				
				console.log('保存历史响应:', res.data)
				
				if (res.data.code === 0) {
					await this.getSearchHistory()
				} else {
					uni.showToast({
						title: res.data.message,
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('保存搜索历史失败:', error)
				uni.showToast({
					title: '保存搜索历史失败',
					icon: 'none'
				})
			}
		},
		
		async deleteHistory(keyword) {
			try {
				const token = this.checkToken()
				if (!token) return
				
				const res = await http.delete(`/user/search-history/${keyword}`)
				
				if (res.data.code === 0) {
					await this.getSearchHistory()
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: res.data.message,
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('删除搜索历史失败:', error)
				uni.showToast({
					title: '删除搜索历史失败',
					icon: 'none'
				})
			}
		},
		
		async clearAllHistory() {
			try {
				const [error, res] = await uni.showModal({
					title: '提示',
					content: '确定要清空所有搜索历史吗？'
				})
				
				if (error || !res.confirm) return
				
				const token = this.checkToken()
				if (!token) return
				
				const result = await http.delete('/user/search-history')
				
				if (result.data.code === 0) {
					this.historyList = []
					uni.showToast({
						title: '清空成功',
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: result.data.message,
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('清空搜索历史失败:', error)
				uni.showToast({
					title: '清空搜索历史失败',
					icon: 'none'
				})
			}
		},
		
		handleClick(keyword) {
			this.$emit('click', keyword)
		}
	}
}
</script>

<style lang="scss" scoped>
.search-history {
	padding: 20rpx;
	background-color: #fff;
	margin-top: 20rpx;
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		
		.title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
		
		.clear-btn {
			font-size: 28rpx;
			color: #999;
		}
	}
	
	.history-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		
		.history-item {
			background-color: #f5f5f5;
			padding: 10rpx 20rpx;
			border-radius: 30rpx;
			display: flex;
			align-items: center;
			
			.keyword {
				font-size: 28rpx;
				color: #333;
				margin-right: 10rpx;
			}
			
			.delete-btn {
				font-size: 32rpx;
				color: #999;
				padding: 0 10rpx;
			}
		}
	}
	
	.empty {
		text-align: center;
		padding: 40rpx 0;
		color: #999;
		font-size: 28rpx;
	}
}
</style>
