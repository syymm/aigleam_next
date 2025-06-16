"use client";

import { useEffect } from 'react';
import { AestheticFluidBg } from "../component/AestheticFluidBg.module.js";

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
  useEffect(() => {
    const colorbg = new AestheticFluidBg({
      dom: id,
      colors,
      loop,
    });

    return () => colorbg.destroy(); // Cleanup to prevent memory leaks
  }, [id, colors, loop]);

  return <div id={id} className="dynamic-background" />;
};

export default DynamicBackground;
