"use client";

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    AestheticFluidBg: any;
  }
}

interface DynamicBackgroundProps {
  id?: string;
  colors?: string[];
  loop?: boolean;
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  id = "background",
  colors = ["#d16ba5", "#ba83ca", "#9a9ae1", "#79b3f4", "#41dfff", "#5ffbf1"],
  loop = true,
}) => {
  const backgroundRef = useRef<any>(null);

  useEffect(() => {
    // 动态加载脚本
    const script = document.createElement('script');
    script.src = '/AestheticFluidBg.js';
    script.async = true;
    
    script.onload = () => {
      // 脚本加载完成后初始化背景
      if (window.AestheticFluidBg) {
        try {
          backgroundRef.current = new window.AestheticFluidBg({
            dom: id,
            colors,
            loop,
          });
        } catch (error) {
          console.warn('AestheticFluidBg initialization failed:', error);
        }
      }
    };

    script.onerror = () => {
      console.warn('Failed to load AestheticFluidBg script');
    };

    document.head.appendChild(script);

    return () => {
      // 清理
      if (backgroundRef.current && backgroundRef.current.destroy) {
        try {
          backgroundRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying AestheticFluidBg:', error);
        }
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [id, colors, loop]);

  return <div id={id} className="dynamic-background" />;
};

export default DynamicBackground;
