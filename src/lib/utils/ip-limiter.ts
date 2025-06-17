interface IPRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

class SimpleIPLimiter {
  private records = new Map<string, IPRecord>();
  private readonly WINDOW_MS = 60 * 60 * 1000; // 1小时窗口
  private readonly MAX_ATTEMPTS = 10; // 每小时最多10次
  private readonly BLOCK_DURATION = 60 * 60 * 1000; // 封禁1小时

  isAllowed(ip: string): { allowed: boolean; waitTime?: number } {
    const now = Date.now();
    const record = this.records.get(ip);

    // 首次访问
    if (!record) {
      this.records.set(ip, { count: 1, firstAttempt: now });
      return { allowed: true };
    }

    // 检查是否在封禁期
    if (record.blockedUntil && now < record.blockedUntil) {
      const waitTime = record.blockedUntil - now;
      return { allowed: false, waitTime };
    }

    // 重置窗口（超过1小时）
    if (now - record.firstAttempt > this.WINDOW_MS) {
      this.records.set(ip, { count: 1, firstAttempt: now });
      return { allowed: true };
    }

    // 检查是否超限
    if (record.count >= this.MAX_ATTEMPTS) {
      record.blockedUntil = now + this.BLOCK_DURATION;
      return { allowed: false, waitTime: this.BLOCK_DURATION };
    }

    // 增加计数
    record.count++;
    return { allowed: true };
  }

  // 清理过期记录
  cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.records.entries()) {
      if (record.blockedUntil && now > record.blockedUntil) {
        this.records.delete(ip);
      }
    }
  }
}

export const ipLimiter = new SimpleIPLimiter();

// 每30分钟清理一次
setInterval(() => ipLimiter.cleanup(), 30 * 60 * 1000);