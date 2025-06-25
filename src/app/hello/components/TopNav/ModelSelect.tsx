import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/ModelSelect.module.css';

interface ModelSelectProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const ModelSelect: React.FC<ModelSelectProps> = ({ selectedModel, setSelectedModel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = [
    {
      value: 'gpt-3.5-turbo',
      label: 'GPT-3.5-turbo',
      description: '非常适合用于日常任务'
    },
    {
      value: 'gpt-4o-mini',
      label: 'GPT-4o-mini',
      description: '轻量级但强大的AI助手，性能与价格的良好平衡'
    },
    {
      value: 'gpt-4-turbo',
      label: 'GPT-4-turbo',
      description: '强大的GPT-4模型，反应快速，知识更新'
    },
    {
      value: 'gpt-4',
      label: 'GPT-4',
      description: '强大而可靠的AI模型，适合复杂任务'
    },
    {
      value: 'gpt-4o',
      label: 'GPT-4o',
      description: '强大的AI助手，支持多模态交互'
    },
    {
      value: 'gpt-4.1',
      label: 'GPT-4.1',
      description: '最先进的GPT模型，支持100万token上下文，编程能力大幅提升'
    },
    {
      value: 'gpt-4.1-mini',
      label: 'GPT-4.1-mini',
      description: '轻量版GPT-4.1，性能优异且经济实惠'
    },
    {
      value: 'gpt-4.1-nano',
      label: 'GPT-4.1-nano',
      description: '超轻量版GPT-4.1，快速响应，适合简单任务'
    },
    {
      value: 'o1-preview',
      label: 'o1-preview',
      description: '强大的推理模型预览版，专为解决复杂问题设计'
    },
    {
      value: 'o1-mini',
      label: 'o1-mini',
      description: '轻量级推理模型，速度快且经济实惠'
    },
    {
      value: 'o3-mini',
      label: 'o3-mini',
      description: '最新推理模型，擅长逻辑推理和复杂问题解决'
    },
    {
      value: 'gpt-image-1',
      label: 'GPT-image-1',
      description: '最新图像生成模型，支持文本渲染和图像编辑'
    },
    {
      value: 'dall-e-3',
      label: 'DALL-E 3',
      description: '强大的图像生成模型，创造力丰富'
    },
    {
      value: 'whisper-1',
      label: 'Whisper',
      description: '音频转录和翻译模型，支持多种语言'
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleModelSelect = (model: typeof models[0]) => {
    setSelectedModel(model.value);
    setIsOpen(false);
  };

  return (
    <div className={styles.modelSelectWrapper} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.modelSelectButton}
      >
        <span>{models.find(m => m.value === selectedModel)?.label || 'ChatGPT'}</span>
        <svg
          className={`${styles.chevronIcon} ${isOpen ? styles.open : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M4.293 5.293a1 1 0 011.414 0L8 7.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.modelSelectDropdown}>
          {models.map((model) => (
            <div
              key={model.value}
              className={styles.modelOption}
              onClick={() => handleModelSelect(model)}
            >
              <div className={styles.modelTitle}>
                <div className={styles.titleLeft}>
                  <span>{model.label}</span>
                </div>
                <div className={styles.titleRight}>
                  {selectedModel === model.value && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className={styles.modelDescription}>{model.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelect;