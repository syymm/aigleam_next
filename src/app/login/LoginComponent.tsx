'use client';  // This is necessary for client-side interactivity in Next.js 13+

import React, { useState } from 'react';
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

const LoginComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const theme = createTheme({
    palette: {
      primary: {
        main: '#7E57C2', // 登录按钮悬停时颜色
      },
    },
  });

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implement your login logic here
    console.log(email, password, rememberMe);
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  return (
    <ThemeProvider theme={theme}>
      <div className="login-component">
        <div className="login-form">
          <h1>Welcome 👋</h1>
          <form onSubmit={handleLogin}>
            <TextField
              sx={{ bgcolor: 'white', marginTop: '0px' }}
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="outlined"
              fullWidth
              margin="normal"
            />
            <TextField
              sx={{ bgcolor: 'white', marginTop: '10px' }}
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
            <Button type="submit" variant="contained" color="primary">立即登录</Button>
          </form>
          <p>
            没有账号吗？<Link href="/register">现在注册一个</Link>
          </p>
        </div>
        <div className="login-image">
          {/* 图片将在这里添加 */}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default LoginComponent;