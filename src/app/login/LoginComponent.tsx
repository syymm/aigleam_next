'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './LoginComponent.css';
import Button from '@mui/material/Button';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Checkbox from '@mui/material/Checkbox';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// 新增: 导入 Snackbar 和 Alert 组件
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// 新增: 定义通知类型
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const LoginComponent: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // 新增: Snackbar 状态
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/check-auth');
      if (response.ok) {
        router.push('/hello');
      }
    };
    checkAuth();
  }, [router]);

  const theme = createTheme({
    palette: {
      primary: {
        main: '#7E57C2',
      },
    },
  });

  // 新增: 显示通知的辅助函数
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // 新增: 处理 Snackbar 关闭
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      if (response.ok) {
        // 替换: 使用 Snackbar 显示成功消息
        showNotification('登录成功', 'success');
        // 短暂延迟后跳转，让用户能看到成功消息
        setTimeout(() => {
          router.push('/hello');
        }, 1000);
      } else {
        const data = await response.json();
        // 替换: 使用 Snackbar 显示错误消息
        showNotification(data.error || '登录失败', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      // 替换: 使用 Snackbar 显示错误消息
      showNotification('登录过程中发生错误', 'error');
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  return (
    <ThemeProvider theme={theme}>
      <div className="login-component">
        <div className="login-form">
          <h1>Welcome 👋</h1>
          <form onSubmit={handleLogin}>
            <TextField
              sx={{ bgcolor: 'white', marginTop: '0px', borderRadius: '4px' }}
              label="Email"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              variant="outlined"
              fullWidth
              margin="normal"
            />
            <TextField
              sx={{ bgcolor: 'white', marginTop: '15px', borderRadius: '4px' }}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="outlined"
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      style={{ backgroundColor: 'transparent', padding: 0, margin: 'auto 0', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
                    >
                      {showPassword ? <VisibilityOff style={{ fontSize: 24 }} /> : <Visibility style={{ fontSize: 24 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <div className="credentials-actions" style={{ marginTop: '20px' }}>
              <label className="remember-me" htmlFor="rememberMeCheckbox">
                <Checkbox
                  disableRipple
                  id="rememberMeCheckbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                  size="small"
                  style={{ marginLeft: '-10px' }}
                />
                记住密码
              </label>
              <Link href="/forgotpassword" className="forgot-password">忘记密码了？</Link>
            </div>
            <Button type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: '20px' }}>
              立即登录
            </Button>
          </form>
          <p style={{ marginTop: '20px', textAlign: 'center' }}>
            没有账号吗？<Link href="/register">现在注册一个</Link>
          </p>
        </div>
        <div className="login-image">
          {<Image
            src="/image/1.png"
            alt="loginImage"
            fill
          />}
        </div>

        {/* 新增: Snackbar 组件 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}

export default LoginComponent;