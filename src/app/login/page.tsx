"use client"; 

import { AestheticFluidBg } from "./AestheticFluidBg.module.js";
import LoginComponent from './LoginComponent';
import './Login.css';
import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    const colorbg = new AestheticFluidBg({
      dom: "box",
      colors: ["#d16ba5", "#ba83ca", "#9a9ae1", "#79b3f4", "#41dfff", "#5ffbf1"],
      loop: true
    });

    // 清理函数，防止组件卸载后产生的内存泄漏
    return () => colorbg.destroy();
  }, []);

  return (
    <div id="box" className="loginpage">
      <LoginComponent />
    </div>
  );
}
