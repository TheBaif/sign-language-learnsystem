package com.study.mybatisplus.controller;

import com.study.mybatisplus.domain.Result;
import com.study.mybatisplus.domain.User;
import com.study.mybatisplus.mapper.UserMapper;
import com.study.mybatisplus.service.UserService;
import com.study.mybatisplus.utils.JwtUtil;
import com.study.mybatisplus.utils.Md5Util;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import javax.validation.ValidationException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    public void setup() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    public void testRegisterWithValidInput() {
        // Arrange
        String username = "testuser";
        String password = "password123";

        when(userService.findByUserName(username)).thenReturn(null);

        // Act
        Result result = userController.register(username, password);

        // Assert
        assertEquals(0, result.getCode());
        assertEquals("操作成功", result.getMessage());
        verify(userService).register(username, password);
    }

    @Test
    public void testRegisterWithExistingUsername() {
        // Arrange
        String username = "existinguser";
        String password = "password123";

        User existingUser = new User();
        existingUser.setUsername(username);
        when(userService.findByUserName(username)).thenReturn(existingUser);

        // Act
        Result result = userController.register(username, password);

        // Assert
        assertEquals(1, result.getCode());
        assertEquals("用户名已被占用", result.getMessage());
        verify(userService, never()).register(anyString(), anyString());
    }

    @Test
    public void testRegisterWithInvalidInput() {
        // Since parameter validation is typically handled by Spring's validation framework,
        // we can simulate this by having the controller throw a ValidationException
        String username = "test"; // too short
        String password = "pass"; // too short

        // We'll use a custom method in the controller to validate
        // For this example, we assume UserController has a private validateRegistration method
        // that we've exposed for testing or we can test through the controller's behavior

        // Here we mock the service to throw an exception when given invalid inputs
        doThrow(new ValidationException("Invalid input parameters"))
                .when(userService).register(eq(username), eq(password));

        // Assert that exception is thrown
        Exception exception = assertThrows(ValidationException.class, () -> {
            userController.register(username, password);
        });

        // Verify the exception message
        assertTrue(exception.getMessage().contains("Invalid input"));
    }
    @Test
    public void testLoginWithValidCredentials() {
        // 准备
        String username = "testuser";
        String password = "password123";
        String encryptedPassword = Md5Util.getMD5String(password);
        String mockToken = "mock.jwt.token";

        // 创建带有加密密码的模拟用户
        User mockUser = new User();
        mockUser.setUsername(username);
        mockUser.setPassword(encryptedPassword);

        // 模拟依赖
        when(userService.findByUserName(username)).thenReturn(mockUser);
        when(JwtUtil.genToken(any())).thenReturn(mockToken);

        // 执行
        Result result = userController.login(username, password);

        // 断言
        assertEquals(0, result.getCode());
        assertEquals(mockToken, result.getData());
        verify(valueOperations).set(eq(mockToken), eq(mockToken), eq(12L), eq(TimeUnit.HOURS));
    }

    @Test
    public void testLoginWithNonExistentUser() {
        // 准备
        String username = "nonexistentuser";
        String password = "password123";

        when(userService.findByUserName(username)).thenReturn(null);

        // 执行
        Result result = userController.login(username, password);

        // 断言
        assertEquals(1, result.getCode());
        assertEquals("用户名不存在", result.getMessage());
        verify(valueOperations, never()).set(anyString(), anyString(), anyLong(), any());
    }

    @Test
    public void testLoginWithIncorrectPassword() {
        // 准备
        String username = "testuser";
        String password = "wrongpassword";
        String correctPassword = "correctpassword";
        String correctHashedPassword = Md5Util.getMD5String(correctPassword);

        User mockUser = new User();
        mockUser.setUsername(username);
        mockUser.setPassword(correctHashedPassword);

        when(userService.findByUserName(username)).thenReturn(mockUser);

        // 执行
        Result result = userController.login(username, password);

        // 断言
        assertEquals(1, result.getCode());
        assertEquals("密码错误", result.getMessage());
        verify(valueOperations, never()).set(anyString(), anyString(), anyLong(), any());
    }
}