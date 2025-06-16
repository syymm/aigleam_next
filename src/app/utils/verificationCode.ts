interface VerificationCode {
  code: string;
  expiresAt: number;
}

interface RateLimit {
  lastRequestTime: number;
  attempts: number;
}

class VerificationCodeManager {
  private verificationCodes: { [username: string]: VerificationCode } = {};
  private rateLimits: { [username: string]: RateLimit } = {};
  
  // 配置参数
  private readonly MAX_ATTEMPTS = 3; // 最大尝试次数
  private readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 速率限制窗口(1小时)
  private readonly MIN_INTERVAL = 60 * 1000; // 两次请求之间的最小间隔(1分钟)

  constructor() {
    console.log('VerificationCodeManager initialized');
  }

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  canRequestCode(username: string): { allowed: boolean; waitTime?: number; message?: string } {
    const now = Date.now();
    const rateLimit = this.rateLimits[username];

    // 如果是首次请求
    if (!rateLimit) {
      this.rateLimits[username] = {
        lastRequestTime: now,
        attempts: 1
      };
      return { allowed: true };
    }

    // 检查是否在最小间隔时间内
    const timeSinceLastRequest = now - rateLimit.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_INTERVAL) {
      const waitTime = this.MIN_INTERVAL - timeSinceLastRequest;
      return {
        allowed: false,
        waitTime,
        message: `请等待 ${Math.ceil(waitTime / 1000)} 秒后再试`
      };
    }

    // 检查是否超过最大尝试次数
    if (rateLimit.attempts >= this.MAX_ATTEMPTS) {
      // 检查是否已经过了限制窗口期
      if (now - rateLimit.lastRequestTime < this.RATE_LIMIT_WINDOW) {
        const waitTime = this.RATE_LIMIT_WINDOW - (now - rateLimit.lastRequestTime);
        return {
          allowed: false,
          waitTime,
          message: `已超过最大尝试次数，请在 ${Math.ceil(waitTime / (60 * 1000))} 分钟后重试`
        };
      } else {
        // 重置尝试次数
        this.rateLimits[username] = {
          lastRequestTime: now,
          attempts: 1
        };
        return { allowed: true };
      }
    }

    // 更新请求记录
    this.rateLimits[username] = {
      lastRequestTime: now,
      attempts: rateLimit.attempts + 1
    };
    return { allowed: true };
  }

  storeCode(username: string, code: string, expirationMinutes: number = 10): void {
    const expiresAt = Date.now() + expirationMinutes * 60 * 1000;
    this.verificationCodes[username] = { code, expiresAt };
    console.log(`Stored code for ${username}: ${code}, expires at ${new Date(expiresAt)}`);
  }

  verifyCode(username: string, code: string): boolean {
    console.log(`Verifying code for ${username}: ${code}`);
    
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
      delete this.verificationCodes[username];
      // 验证成功后重置该用户的尝试次数
      delete this.rateLimits[username];
      return true;
    }

    console.log(`Code verification failed for ${username}`);
    return false;
  }

  cleanupExpiredCodes(): void {
    const now = Date.now();
    // 清理过期的验证码
    for (const [email, data] of Object.entries(this.verificationCodes)) {
      if (data.expiresAt < now) {
        delete this.verificationCodes[email];
        console.log(`Cleaned up expired code for ${email}`);
      }
    }
    
    // 清理过期的速率限制记录
    for (const [email, data] of Object.entries(this.rateLimits)) {
      if (now - data.lastRequestTime > this.RATE_LIMIT_WINDOW) {
        delete this.rateLimits[email];
        console.log(`Cleaned up expired rate limit for ${email}`);
      }
    }
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