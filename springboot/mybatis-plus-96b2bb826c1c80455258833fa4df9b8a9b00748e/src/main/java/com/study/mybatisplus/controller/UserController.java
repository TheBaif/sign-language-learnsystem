package com.study.mybatisplus.controller;

import ch.qos.logback.core.util.StringUtil;
import com.study.mybatisplus.domain.Result;
import com.study.mybatisplus.domain.User;
import com.study.mybatisplus.service.UserService;
import com.study.mybatisplus.utils.JwtUtil;
import com.study.mybatisplus.utils.Md5Util;
import com.study.mybatisplus.utils.ThreadLocalUtil;
import jakarta.annotation.Resource;
import org.hibernate.validator.constraints.URL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.Pattern;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;


@RestController
@RequestMapping("/user")
@Validated
public class UserController {
    @Resource
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public Result register(@Pattern(regexp = "^\\S{5,16}$") String username, @Pattern(regexp = "^\\S{5,16}$") String password) {
            User u = userService.findByUserName(username);
            if (u == null) {
                //没有占用
                //注册
                userService.register(username, password);
                return Result.success();
            } else {
                return Result.error("用户名已被占用");
            }
        }
    @PostMapping("/login")
    public Result login(@Pattern(regexp = "^\\S{5,16}$") String username, @Pattern(regexp = "^\\S{5,16}$") String password) {
        // Log login attempt for debugging
        System.out.println("Login attempt - Username: " + username);

        // Check if user exists
        User loginUser = userService.findByUserName(username);
        if (loginUser == null) {
            System.out.println("User not found: " + username);
            return Result.error("用户名不存在");
        }

        // Check password
        if (Md5Util.getMD5String(password).equals(loginUser.getPassword())) {
            // Create claims for JWT
            Map<String, Object> claims = new HashMap<>();
            claims.put("username", loginUser.getUsername());
            claims.put("userId", loginUser.getId());

            // Generate token
            String token = JwtUtil.genToken(claims);
            System.out.println("Login successful, token generated: " + token);

            // Store token in Redis with expiration time (12 hours)
            ValueOperations<String, String> operations = stringRedisTemplate.opsForValue();
            operations.set(token, token, 12, TimeUnit.HOURS);
            System.out.println("Token stored in Redis");

            return Result.success(token);
        }

        System.out.println("Password incorrect for user: " + username);
        return Result.error("密码错误");
    }
    @GetMapping ("/userInfo")
    public Result<User> userInfo() {
        Map<String,Object> map= ThreadLocalUtil.get();
        String username=(String) map.get("username");
        User user=userService.findByUserName(username);
        return Result.success(user);
    }

    @PutMapping ("/update")
    public Result update(@RequestBody @Validated User user) {
        userService.update(user);
        return Result.success();
    }

    @PatchMapping("/updateAvatar")
    public Result updateAvatar(@RequestParam @URL String avatarUrl){
        userService.updateAvatar(avatarUrl);
        return Result.success();
    }
    @PatchMapping("/updatePwd")
    public Result updatePwd(@RequestBody Map<String,String> params,@RequestHeader("Authorization") String token){
        //1、校验参数
        String oldPwd=params.get("old_pwd");
        String newPwd=params.get("new_pwd");
        String rePwd=params.get("re_pwd");

        if(!StringUtils.hasLength(oldPwd) || !StringUtils.hasLength(newPwd) || !StringUtils.hasLength(rePwd)){
            return Result.error("缺少必要的参数");
        }
        //原密码是否正确
        //调用userService根据用户名拿到密码，再和old_pwd比对
        Map<String,Object> map=ThreadLocalUtil.get();
        String username=(String) map.get("username");
        User loginUser=userService.findByUserName(username);
        if(!loginUser.getPassword().equals(Md5Util.getMD5String(oldPwd))){
            return Result.error("原密码填写不正确");
        }
        //newPwd和rePwd校验
        if(!newPwd.equals(rePwd)){
            return Result.error("两次输入的密码不一样");
        }
        //2、调用service完成密码更新
        userService.updatePwd(newPwd);
        ValueOperations<String, String> operations = stringRedisTemplate.opsForValue();
        operations.getOperations().delete(token);
        return Result.success();
    }
    @PostMapping("/checkUsername")
    public Result checkUsername(@RequestBody Map<String, String> params) {
        String username = params.get("username");

        if (username == null || username.trim().isEmpty()) {
            return Result.error("用户名不能为空");
        }

        User user = userService.findByUserName(username);
        if (user == null) {
            return Result.error("用户不存在");
        }

        // 返回脱敏的用户信息
        user.setPassword(null);  // 不返回密码
        return Result.success(user);
    }

    /**
     * 更新密码，支持忘记密码模式
     * @param params 包含用户名、新密码和模式的参数
     * @return 操作结果
     */
    @PostMapping("/updatePwd")
    public Result updatePassword(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String newPwd = params.get("new_pwd");
        String resetMode = params.get("reset_mode");

        // 参数验证
        if (username == null || newPwd == null) {
            return Result.error("用户名和新密码不能为空");
        }

        try {
            User user = userService.findByUserName(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 忘记密码模式，直接重置密码
            if ("forgot".equals(resetMode)) {
                userService.resetPasswordDirect(username, newPwd);
                return Result.success();
            }
            // 普通修改密码模式需要验证旧密码
            else {
                String oldPwd = params.get("old_pwd");
                if (oldPwd == null) {
                    return Result.error("原密码不能为空");
                }

                if (!Md5Util.checkPassword(oldPwd, user.getPassword())) {
                    return Result.error("原密码不正确");
                }

                userService.updatePwd(newPwd);
                return Result.success();
            }
        } catch (Exception e) {
            return Result.error("密码更新失败: " + e.getMessage());
        }
    }

}
