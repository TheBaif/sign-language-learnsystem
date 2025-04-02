// Fixed utils/request.js
const config = {
  baseUrl: 'http://localhost:8080'
}

const request = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Get token from storage
    const token = uni.getStorageSync('token')
    console.log('Request to:', options.url)
    console.log('Current token:', token)
    
    // Set default headers
    options.header = {
      'Content-Type': options.header?.['Content-Type'] || 'application/json',
      ...options.header
    }
    
    // Add token to request header if available
    if (token) {
      options.header.Authorization = token
      console.log('Added token to request headers')
    }
    
    console.log('Request config:', {
      url: config.baseUrl + options.url,
      method: options.method || 'GET',
      headers: options.header
    })
    
    uni.request({
      url: config.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: options.header,
      success: (res) => {
        console.log('Response:', res)
        
        if (res.statusCode === 200) {
          if (res.data.code === 401) {
            console.error('Token expired or invalid (401 in response body)')
            uni.removeStorageSync('token')
            uni.showToast({
              title: '请重新登录',
              icon: 'none'
            })
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/login/login'
              })
            }, 1500)
            reject(res)
          } else {
            resolve(res)
          }
        } else if (res.statusCode === 401) {
          console.error('Authentication failed (401 status code)')
          uni.removeStorageSync('token')
          uni.showToast({
            title: '请重新登录',
            icon: 'none'
          })
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }, 1500)
          reject(res)
        } else {
          console.error('Request failed with status:', res.statusCode)
          reject(res)
        }
      },
      fail: (err) => {
        console.error('Request error:', err)
        reject(err)
      }
    })
  })
}

export default {
  request,
  get(url, options = {}) {
    // Handle GET request parameters
    if (options.params) {
      const queryString = Object.keys(options.params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(options.params[key])}`)
        .join('&')
      url = `${url}?${queryString}`
      delete options.params
    }
    
    return request({
      url,
      method: 'GET',
      ...options
    })
  },
  post(url, data, options = {}) {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    })
  },
  delete(url,options={}){
	  return request({
		  url,
		  method:'DELETE'
	  })
  }
}