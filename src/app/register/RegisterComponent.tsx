'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TextField from '@mui/material/TextField';
import InputBase from '@mui/material/InputBase';
import SendIcon from '@mui/icons-material/Send';
import { Divider, Button, Snackbar, Alert } from '@mui/material';
import './RegisterComponent.css';
import { useRouter } from 'next/navigation';

const RegisterComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('两次输入的密码不匹配');
      setOpenSnackbar(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode, password, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('注册成功！');
        setOpenSnackbar(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setMessage(data.message || '注册失败，请重试。');
        setOpenSnackbar(true);
      }
    } catch (error) {
      setMessage('发生错误，请重试。');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!email) {
      setMessage('请输入邮箱地址');
      setOpenSnackbar(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/sendVerificationCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('验证码已发送到您的邮箱。');
      } else {
        setMessage(data.message || '发送验证码失败，请重试。');
      }
      setOpenSnackbar(true);
    } catch (error) {
      setMessage('发生错误，请重试。');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-component">
      <div className="register-image">
        {<Image src="/image/2.png" alt="RegisterImage" fill />}
      </div>
      <div className="register-form">
        <h1 className="register-title">Register Now✍️</h1> 
        <form onSubmit={handleRegister}>
          <TextField
            sx={{ bgcolor: 'white', width: '100%' }}
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            variant="outlined"
            size="small"
          />
          <div className="verification-code-section">
            <InputBase
              sx={{
                bgcolor: 'white',
                marginTop:'20px',
                height: '40px',
                width: '100%',
                border: '1px solid #d1d1d1',
                borderRadius: '4px',
                padding: '0 10px',
              }}
              placeholder="验证码"
              type='text'
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              endAdornment={
                <><Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                  <Button
                    id="customButton"
                    variant="text"
                    size='small'
                    endIcon={<SendIcon sx={{ color: '#6200ea', transform: 'translateY(-1px)'}} />}
                    sx={{
                      height: '30px !important',
                      ml: 1,
                      transform: 'translateY(-10px)',
                      color: '#6200ea',
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        boxShadow: 'none'
                      }
                    }}
                    onClick={handleSendVerificationCode}
                    disabled={isLoading}
                  >
                    发送
                  </Button>
                </>
              }
            />
          </div>
          <TextField
            sx={{ bgcolor: 'white', marginTop:'20px' }}
            type="password"
            label="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant='outlined'
            size='small'
          />
          <TextField
            sx={{ bgcolor: 'white', marginTop:'20px' }}
            type="password"
            label="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            variant='outlined'
            size='small'
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>
        <p>
          已有账号？<Link href="/login">现在登录</Link>
        </p>
      </div>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={message.includes('成功') ? 'success' : 'error'} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default RegisterComponent;