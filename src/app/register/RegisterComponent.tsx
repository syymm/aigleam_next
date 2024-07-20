'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './RegisterComponent.css';

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
        {/* 图片将在这里添加 */}
      </div>
      <div className="register-form">
        <h1 className="register-title">Register Now✍️</h1> 
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="verification-code-section">
            <input
              type="text"
              placeholder="验证码"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
            <button type="button" onClick={handleSendVerificationCode}>发送验证码</button>
          </div>
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
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