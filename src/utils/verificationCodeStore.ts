interface VerificationCode {
    code: string;
    expiresAt: Date;
  }
  
  const codeStore: Map<string, VerificationCode> = new Map();
  
  export const saveVerificationCode = (email: string, code: string) => {
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 10 分钟后过期
    codeStore.set(email, { code, expiresAt });
  };
  
  export const verifyCode = (email: string, code: string): boolean => {
    const storedCode = codeStore.get(email);
    if (!storedCode) return false;
    if (storedCode.expiresAt < new Date()) {
      codeStore.delete(email);
      return false;
    }
    return storedCode.code === code;
  };
  
  export const deleteVerificationCode = (email: string) => {
    codeStore.delete(email);
  };