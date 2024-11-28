import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/ModelSelect.module.css';

interface ModelSelectProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onUpgrade: () => void;
}

const ModelSelect: React.FC<ModelSelectProps> = ({ selectedModel, setSelectedModel, onUpgrade }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = [
    { 
      value: 'gpt-3.5-turbo', 
      label: 'ChatGPT', 
      description: '非常适合用于日常任务',
      requiresUpgrade: false 
    },
    { 
      value: 'gpt-4', 
      label: 'ChatGPT Plus', 
      description: '我们最智能的模型可以更多内容',
      requiresUpgrade: true 
    },
    { 
      value: 'claude-3.5', 
      label: 'Claude 3.5 Sonnet', 
      description: '更强大的AI助手，支持更多功能',
      requiresUpgrade: true 
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
    if (model.requiresUpgrade) {
      onUpgrade();
      setIsOpen(false);
    } else {
      setSelectedModel(model.value);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
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
                  {model.requiresUpgrade && (
                    <button 
                      className={styles.upgradeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpgrade();
                        setIsOpen(false);
                      }}
                    >
                      升级
                    </button>
                  )}
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