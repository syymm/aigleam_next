interface VerificationCode {
  code: string;
  expiresAt: number;
}

class VerificationCodeManager {
  private verificationCodes: { [username: string]: VerificationCode } = {};

  constructor() {
    console.log('VerificationCodeManager initialized');
  }

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeCode(username: string, code: string, expirationMinutes: number = 10): void {
    const expiresAt = Date.now() + expirationMinutes * 60 * 1000;
    this.verificationCodes[username] = { code, expiresAt };
    console.log(`Stored code for ${username}: ${code}, expires at ${new Date(expiresAt)}`);
    console.log(`Current stored codes: ${JSON.stringify(this.verificationCodes)}`);
  }

  verifyCode(username: string, code: string): boolean {
    console.log(`Verifying code for ${username}: ${code}`);
    console.log(`Current stored codes: ${JSON.stringify(this.verificationCodes)}`);
    
    const storedCode = this.verificationCodes[username];
    if (!storedCode) {
      console.log(`No stored code found for ${username}`);
      return false;
    }

    if (Date.now() > storedCode.expiresAt) {
      console.log(`Code for ${username} has expired`);
      delete this.verificationCodes[username];
      return false;
    }

    if (storedCode.code === code) {
      console.log(`Code verified successfully for ${username}`);
      delete this.verificationCodes[username]; // 使用后立即删除验证码
      return true;
    }

    console.log(`Code verification failed for ${username}`);
    return false;
  }

  cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [email, data] of Object.entries(this.verificationCodes)) {
      if (data.expiresAt < now) {
        delete this.verificationCodes[email];
        console.log(`Cleaned up expired code for ${email}`);
      }
    }
    console.log(`After cleanup, stored codes: ${JSON.stringify(this.verificationCodes)}`);
  }

  setupCleanupTask(intervalMinutes: number = 60): NodeJS.Timeout {
    return setInterval(() => this.cleanupExpiredCodes(), intervalMinutes * 60 * 1000);
  }
}

// 使用 Node.js 的 global 对象来确保 verificationCodeManager 是一个真正的单例
declare global {
  var verificationCodeManager: VerificationCodeManager | undefined;
}

if (!global.verificationCodeManager) {
  global.verificationCodeManager = new VerificationCodeManager();
}

export const verificationCodeManager = global.verificationCodeManager;