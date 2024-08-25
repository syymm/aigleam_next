// utils/verificationCode.ts

interface VerificationCode {
    code: string;
    expiresAt: number;
  }
  
  class VerificationCodeManager {
    private verificationCodes: { [username: string]: VerificationCode } = {};
  
    generateCode(): string {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  
    storeCode(username: string, code: string, expirationMinutes: number = 10): void {
      const expiresAt = Date.now() + expirationMinutes * 60 * 1000;
      this.verificationCodes[username] = { code, expiresAt };
    }
  
    verifyCode(username: string, code: string): boolean {
      const storedCode = this.verificationCodes[username];
      if (!storedCode) {
        return false;
      }
  
      if (Date.now() > storedCode.expiresAt) {
        delete this.verificationCodes[username];
        return false;
      }
  
      if (storedCode.code === code) {
        delete this.verificationCodes[username]; // 使用后立即删除验证码
        return true;
      }
  
      return false;
    }
  
    cleanupExpiredCodes(): void {
      const now = Date.now();
      for (const [email, data] of Object.entries(this.verificationCodes)) {
        if (data.expiresAt < now) {
          delete this.verificationCodes[email];
        }
      }
    }
  
    setupCleanupTask(intervalMinutes: number = 60): NodeJS.Timeout {
      return setInterval(() => this.cleanupExpiredCodes(), intervalMinutes * 60 * 1000);
    }
  }
  
  export const verificationCodeManager = new VerificationCodeManager();