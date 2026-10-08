/* Transient display resolution. Timing never changes simulation or saved data. */
(function (root, factory) {
  'use strict';
  const api = factory();
  root.DeadwallDisplayQuality153 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis, function () {
  'use strict';
  const LIMITS = Object.freeze({
    minDpr: 1, maxDpr: 2, step: .5,
    windowMilliseconds: 1000, minimumFrames: 8,
    slowFrameMilliseconds: 26, fastFrameMilliseconds: 18.5,
    settleMilliseconds: 1500, recoverMilliseconds: 15000,
    longestSampleMilliseconds: 250
  });
  const cap = value => Math.max(LIMITS.minDpr, Math.min(LIMITS.maxDpr, Number(value) || 1));
  class Quality {
    constructor(maxDpr = 2) { this.reset(maxDpr); }
    reset(maxDpr) {
      this.maximum = cap(maxDpr); this.dpr = this.maximum;
      this.elapsed = 0; this.settleUntil = 0; this.goodSince = null;
      this.windowTime = 0; this.windowFrames = 0;
      return this.dpr;
    }
    clearWindow() { this.windowTime = 0; this.windowFrames = 0; }
    observe(frameMilliseconds, { active = true, visible = true } = {}) {
      if (!active || !visible || !Number.isFinite(frameMilliseconds) || frameMilliseconds <= 0 || frameMilliseconds > LIMITS.longestSampleMilliseconds) {
        this.clearWindow(); this.goodSince = null; return this.dpr;
      }
      this.elapsed += frameMilliseconds;
      if (this.elapsed < this.settleUntil) { this.clearWindow(); return this.dpr; }
      this.windowTime += frameMilliseconds; this.windowFrames++;
      if (this.windowTime < LIMITS.windowMilliseconds || this.windowFrames < LIMITS.minimumFrames) return this.dpr;
      const average = this.windowTime / this.windowFrames;
      this.clearWindow();
      if (average > LIMITS.slowFrameMilliseconds) {
        this.goodSince = null;
        const next = Math.max(LIMITS.minDpr, this.dpr - LIMITS.step);
        if (next !== this.dpr) { this.dpr = next; this.settleUntil = this.elapsed + LIMITS.settleMilliseconds; }
      } else if (average <= LIMITS.fastFrameMilliseconds) {
        if (this.goodSince === null) this.goodSince = this.elapsed;
        if (this.elapsed - this.goodSince >= LIMITS.recoverMilliseconds && this.dpr < this.maximum) {
          this.dpr = Math.min(this.maximum, this.dpr + LIMITS.step);
          this.settleUntil = this.elapsed + LIMITS.settleMilliseconds;
          this.goodSince = null;
        }
      } else this.goodSince = null;
      return this.dpr;
    }
    snapshot() { return { dpr: this.dpr, maximum: this.maximum }; }
  }
  return Object.freeze({ LIMITS, create: maxDpr => new Quality(maxDpr) });
});
