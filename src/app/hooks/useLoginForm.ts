import { useState, useCallback } from 'react';
import { LoginRequest } from '@/lib/types/auth';

interface FormErrors {
  username?: string;
  password?: string;
}

interface UseLoginFormReturn {
  values: LoginRequest;
  errors: FormErrors;
  isValid: boolean;
  updateField: (field: keyof LoginRequest, value: string | boolean) => void;
  validateForm: () => boolean;
  resetForm: () => void;
}

const initialValues: LoginRequest = {
  username: '',
  password: '',
  rememberMe: false,
};

export const useLoginForm = (): UseLoginFormReturn => {
  const [values, setValues] = useState<LoginRequest>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = useCallback((field: keyof LoginRequest, value: string | boolean) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!values.username.trim()) {
      newErrors.username = '请输入邮箱地址';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.username)) {
        newErrors.username = '邮箱格式不正确';
      }
    }

    // Password validation
    if (!values.password.trim()) {
      newErrors.password = '请输入密码';
    } else if (values.password.length < 6) {
      newErrors.password = '密码至少需要6位字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, []);

  const isValid = Object.keys(errors).length === 0 && 
                  values.username.trim() !== '' && 
                  values.password.trim() !== '';

  return {
    values,
    errors,
    isValid,
    updateField,
    validateForm,
    resetForm,
  };
};