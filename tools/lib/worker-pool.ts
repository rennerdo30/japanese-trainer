/**
 * Worker Pool for concurrent task processing
 * Manages a pool of concurrent workers to process tasks in parallel
 * with configurable concurrency limits
 */

export interface WorkerPoolConfig {
  concurrency?: number; // Number of concurrent workers (default: 4)
  timeout?: number; // Task timeout in ms (default: 30000)
}

export interface PoolTask<T, R> {
  id: string;
  execute: () => Promise<R>;
  onProgress?: (progress: { completed: number; total: number; current: string }) => void;
}

export interface PoolResult<R> {
  success: number;
  failed: number;
  results: Map<string, { result?: R; error?: Error }>;
}

/**
 * Generic worker pool for parallel task execution
 */
export class WorkerPool<T, R> {
  private concurrency: number;
  private timeout: number;
  private queue: PoolTask<T, R>[] = [];
  private active = 0;
  private results: Map<string, { result?: R; error?: Error }> = new Map();
  private resolvePromise?: (value: PoolResult<R>) => void;
  private rejectPromise?: (error: Error) => void;

  constructor(config: WorkerPoolConfig = {}) {
    this.concurrency = config.concurrency || 4;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Add tasks to the queue
   */
  addTasks(tasks: PoolTask<T, R>[]): void {
    this.queue.push(...tasks);
  }

  /**
   * Process all queued tasks with concurrent workers
   */
  async process(onProgress?: (progress: { completed: number; total: number; current: string }) => void): Promise<PoolResult<R>> {
    const total = this.queue.length;
    let completed = 0;

    return new Promise<PoolResult<R>>((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      // If no tasks, resolve immediately
      if (total === 0) {
        resolve({
          success: 0,
          failed: 0,
          results: this.results,
        });
        return;
      }

      // Start initial workers (up to concurrency limit)
      const numWorkers = Math.min(this.concurrency, total);
      for (let i = 0; i < numWorkers; i++) {
        this.processNext(() => {
          completed++;
          if (onProgress) {
            const currentTask = this.queue.length > 0 ? this.queue[0].id : 'idle';
            onProgress({ completed, total, current: currentTask });
          }
        });
      }
    });
  }

  /**
   * Process the next task in the queue
   * This runs sequentially within each worker's "thread"
   */
  private processNext(onTaskComplete: () => void): void {
    // Increment active worker count when this worker starts processing
    this.active++;

    const processTask = (): void => {
      const task = this.queue.shift();

      if (!task) {
        // No more tasks in queue - this worker is done
        this.active--;

        // If all workers are done, resolve the promise
        if (this.active === 0) {
          const success = Array.from(this.results.values()).filter(r => !r.error).length;
          const failed = Array.from(this.results.values()).filter(r => r.error).length;

          if (this.resolvePromise) {
            this.resolvePromise({
              success,
              failed,
              results: this.results,
            });
          }
        }
        return;
      }

      // Execute task with timeout
      const timeoutPromise = new Promise<R>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Task timeout after ${this.timeout}ms`));
        }, this.timeout);
      });

      Promise.race([task.execute(), timeoutPromise])
        .then((result: R) => {
          this.results.set(task.id, { result });
        })
        .catch((error: Error) => {
          this.results.set(task.id, { error: error instanceof Error ? error : new Error(String(error)) });
        })
        .finally(() => {
          onTaskComplete();
          // Process the next task after this one completes
          processTask();
        });
    };

    // Start processing tasks
    processTask();
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get current number of active workers
   */
  getActiveWorkers(): number {
    return this.active;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.results.clear();
  }
}

/**
 * Specialized worker pool for audio generation tasks
 */
export class AudioWorkerPool {
  private pool: WorkerPool<any, Buffer>;

  constructor(concurrency: number = 4) {
    this.pool = new WorkerPool<any, Buffer>({
      concurrency,
      timeout: 60000, // 60s for audio generation
    });
  }

  /**
   * Add audio generation tasks
   */
  addTasks(
    tasks: Array<{
      id: string;
      text: string;
      generate: (text: string) => Promise<Buffer>;
    }>
  ): void {
    this.pool.addTasks(
      tasks.map(task => ({
        id: task.id,
        execute: () => task.generate(task.text),
      }))
    );
  }

  /**
   * Process all tasks
   */
  async process(
    onProgress?: (progress: { completed: number; total: number; current: string }) => void)
  : Promise<PoolResult<Buffer>> {
    return this.pool.process(onProgress);
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.pool.getQueueSize();
  }

  /**
   * Get active workers
   */
  getActiveWorkers(): number {
    return this.pool.getActiveWorkers();
  }

  /**
   * Clear tasks
   */
  clear(): void {
    this.pool.clear();
  }
}
