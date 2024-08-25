'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TextField from '@mui/material/TextField';
import InputBase from '@mui/material/InputBase';
import SendIcon from '@mui/icons-material/Send';
import './RegisterComponent.css';
import { Divider, Button } from '@mui/material';

const RegisterComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implement your register logic here
    console.log(email, verificationCode, password, confirmPassword);
  };

  const handleSendVerificationCode = () => {
    // Implement your logic to send verification code
    console.log('Sending verification code to', email);
  };

  return (
    <div className="register-component">
      <div className="register-image">
      {<Image
            src="/image/2.png"
            alt="RegisterImage"
            fill
          />}
      </div>
      <div className="register-form">
        <h1 className="register-title">Register Now✍️</h1> 
        <form onSubmit={handleRegister}>
           <TextField
              sx={{ bgcolor: 'white',  width: '100%'}}
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
              sx={{ bgcolor: 'white',
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
                  >
                    send
                  </Button></>
              }
            />
            {/* <button type="button" onClick={handleSendVerificationCode}>发送验证码</button> */}
          </div>
          <TextField
            sx={{ bgcolor: 'white'}}
            type="password"
            label="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant='outlined'
            size='small'
          />
          <TextField
            sx={{ bgcolor: 'white',marginTop:'20px'}}
            type="password"
            label="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            variant='outlined'
            size='small'
          />
          <button type="submit">注册</button>
        </form>
        <p>
          已有账号？<Link href="/login">现在登录</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterComponent;