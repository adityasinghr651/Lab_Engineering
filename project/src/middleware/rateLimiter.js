// src/middleware/rateLimiter.js
// In-memory sliding-window rate limiter for brute-force protection

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 5; // 5 attempts per window
  const message = options.message || 'Too many login attempts. Please try again later.';

  // Map of key -> array of request timestamps
  const hits = new Map();

  function rateLimiter(req, res, next) {
    if (process.env.DISABLE_RATE_LIMITER === 'true') {
      return next();
    }

    const key = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = hits.get(key) || [];
    const activeTimestamps = timestamps.filter((t) => t > windowStart);

    if (activeTimestamps.length >= max) {
      const oldestActive = activeTimestamps[0];
      const retryAfterSec = Math.ceil((oldestActive + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
      return res.status(429).json({ error: message });
    }

    activeTimestamps.push(now);
    hits.set(key, activeTimestamps);

    next();
  }

  rateLimiter.reset = () => {
    hits.clear();
  };

  return rateLimiter;
}

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.',
});

module.exports = {
  createRateLimiter,
  loginLimiter,
};

