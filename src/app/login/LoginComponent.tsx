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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@/app/hooks/useAuth';
import { useLoginForm } from '@/app/hooks/useLoginForm';

const LoginComponent: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  // Custom hooks for auth and form management
  const { isLoading, error, login, clearError } = useAuth();
  const { values, errors, isValid, updateField, validateForm } = useLoginForm();

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await login(values);
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
              value={values.username}
              onChange={(e) => updateField('username', e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
              error={!!errors.username}
              helperText={errors.username}
              disabled={isLoading}
            />
            <TextField
              sx={{ bgcolor: 'white', marginTop: '15px', borderRadius: '4px' }}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(e) => updateField('password', e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      disabled={isLoading}
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
                  checked={values.rememberMe}
                  onChange={(e) => updateField('rememberMe', e.target.checked)}
                  color="primary"
                  size="small"
                  disabled={isLoading}
                  style={{ marginLeft: '-10px' }}
                />
                记住密码
              </label>
              <Link href="/forgotpassword" className="forgot-password">忘记密码了？</Link>
            </div>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              disabled={isLoading || !isValid}
              style={{ marginTop: '20px', minHeight: '42px' }}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? '登录中...' : '立即登录'}
            </Button>
          </form>
          <p style={{ marginTop: '20px', textAlign: 'center' }}>
            没有账号吗？<Link href="/register">现在注册一个</Link>
          </p>
        </div>
        <div className="login-image">
          {<Image
            src="/image/31.png"
            alt="loginImage"
            fill
          />}
        </div>

        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={clearError}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={clearError}
            severity="error"
            sx={{ width: '100%' }}
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}

export default LoginComponent;