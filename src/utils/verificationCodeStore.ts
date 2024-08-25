interface VerificationCode {
    code: string;
    expiresAt: Date;
  }
  
  const codeStore: Map<string, VerificationCode> = new Map();
  
  export const saveVerificationCode = (username: string, code: string) => {
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 10 分钟后过期
    codeStore.set(username, { code, expiresAt });
  };
  
  export const verifyCode = (username: string, code: string): boolean => {
    const storedCode = codeStore.get(username);
    if (!storedCode) return false;
    if (storedCode.expiresAt < new Date()) {
      codeStore.delete(username);
      return false;
    }
    return storedCode.code === code;
  };
  
  export const deleteVerificationCode = (username: string) => {
    codeStore.delete(username);
  };