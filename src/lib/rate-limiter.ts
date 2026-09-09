/**
 * Rate Limiter
 * Handles Simpro's strict rate limits with configurable concurrency and delays
 */

interface RateLimitConfig {
  concurrency: number // How many concurrent requests
  delayMs: number // Delay between each batch
}

export class RateLimiter {
  private readonly config: RateLimitConfig

  constructor(config: RateLimitConfig = { concurrency: 10, delayMs: 200 }) {
    this.config = config
  }

  /**
   * Process an array of items with bounded concurrency
   * Never stacks requests - maintains safe API access
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<R[]> {
    const results: R[] = []

    for (let i = 0; i < items.length; i += this.config.concurrency) {
      const chunk = items.slice(i, i + this.config.concurrency)

      // Process up to `concurrency` items in parallel
      const chunkResults = await Promise.all(chunk.map((item) => processor(item)))

      results.push(...chunkResults)

      // Report progress
      if (onProgress) {
        onProgress(results.length, items.length)
      }

      // Wait before next batch (unless this is the last batch)
      if (i + this.config.concurrency < items.length) {
        await new Promise((resolve) => setTimeout(resolve, this.config.delayMs))
      }
    }

    return results
  }
}
