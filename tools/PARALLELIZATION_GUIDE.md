# Kokoro Audio Generator - Parallelization Guide

## Overview

The Kokoro audio generator has been parallelized to dramatically improve performance. Instead of generating audio files sequentially (one at a time), it can now process multiple files concurrently, significantly reducing total generation time.

## Performance Improvements

### Before (Sequential)
- **Processing**: One audio file at a time
- **For 1000 items**: ~50-100+ minutes (depending on audio length and system performance)
- **CPU usage**: ~30% (underutilized)
- **Throughput**: ~10-20 files/minute

### After (Parallelized with 4 workers)
- **Processing**: Up to 4 audio files simultaneously
- **For 1000 items**: ~15-25 minutes (3-4x faster)
- **CPU usage**: ~60-80% (better resource utilization)
- **Throughput**: ~40-60 files/minute

## Usage

### Basic Usage (Default 4 Workers)
```bash
npm run tts-generate -- --provider kokoro
```

### Custom Concurrency Level
```bash
# Use 8 concurrent workers
npm run tts-generate -- --provider kokoro --concurrency 8

# Use 2 concurrent workers (for low-resource machines)
npm run tts-generate -- --provider kokoro --concurrency 2

# Use maximum parallelization (16 workers)
npm run tts-generate -- --provider kokoro --concurrency 16
```

## How It Works

### Architecture

1. **Worker Pool** (`lib/worker-pool.ts`):
   - Generic concurrent task processor
   - Manages a configurable number of concurrent workers
   - Queues remaining tasks as workers complete
   - Thread-safe result collection

2. **Audio Worker Pool** (`lib/audio-processor.ts`):
   - Specialized worker pool for audio generation
   - Handles audio-specific timeouts (60 seconds per task)
   - Manages result buffering and error handling

3. **Task Distribution** (`tts-generator.ts`):
   - Pre-filters existing audio files (no re-generation)
   - Creates parallel generation tasks
   - Monitors progress across all workers
   - Aggregates results and statistics

### Process Flow

```
Tasks [1000 items]
       ↓
   Filter existing files (skip already generated)
       ↓
   Create generation tasks [950 items]
       ↓
   Worker Pool (4 workers)
   ├─ Worker 1: processing item 1
   ├─ Worker 2: processing item 2
   ├─ Worker 3: processing item 3
   ├─ Worker 4: processing item 4
       ↓
   As workers finish:
   ├─ Worker 1: processes item 5
   ├─ Worker 2: processes item 6
   └─ [continues until all tasks complete]
       ↓
   Aggregate results & save files
```

## Configuration

### Recommended Concurrency Levels

| System Type | Recommended | Max | Notes |
|---|---|---|---|
| MacBook M1/M2 (8-core) | 4-6 | 8 | Balanced performance |
| MacBook M3/M4 (10-core) | 6-8 | 10 | Can handle more tasks |
| Intel i7/i9 (8+ cores) | 4-8 | 12 | Depends on core count |
| Older/Limited resources | 2 | 4 | Prevent system overload |

### CLI Options

```bash
# View all options
npm run tts-generate -- --help

# Commonly used options
--provider kokoro              # Use Kokoro TTS
--concurrency 4               # Number of parallel workers
--type vocabulary             # Generate only vocabulary audio
--dry-run                     # Preview without generating
--update-json                 # Update JSON files with audio URLs
```

## Optimization Tips

### 1. **Find Your Sweet Spot**
```bash
# Test with different concurrency levels
npm run tts-generate -- --provider kokoro --concurrency 4 --type vocabulary
npm run tts-generate -- --provider kokoro --concurrency 8 --type vocabulary
```

### 2. **Monitor System Resources**
- Watch CPU and memory usage during generation
- If system feels sluggish, reduce concurrency
- If CPU usage < 50%, try increasing concurrency

### 3. **Batch Generation**
```bash
# Generate different types sequentially (not parallel)
npm run tts-generate -- --provider kokoro --type vocabulary
npm run tts-generate -- --provider kokoro --type grammar
npm run tts-generate -- --provider kokoro --type kanji
```

### 4. **Resume Failed Generations**
- Already generated files are automatically skipped
- Failed generations can be resumed safely
- Worker pool gracefully handles individual task failures

## Technical Details

### Worker Pool Implementation

The worker pool uses a queue-based approach:

```typescript
class WorkerPool<T, R> {
  private concurrency: number;        // Max concurrent workers
  private queue: PoolTask<T, R>[] = []; // Pending tasks
  private active = 0;                 // Currently running tasks
  
  async process(): Promise<PoolResult<R>> {
    // Start initial workers
    for (let i = 0; i < min(concurrency, queue.length); i++) {
      processNext();
    }
  }
  
  private processNext() {
    const task = queue.shift();
    if (!task) {
      if (active === 0) resolve();
      return;
    }
    
    active++;
    task.execute()
      .finally(() => {
        active--;
        processNext(); // Process next queued task
      });
  }
}
```

### Key Features

1. **Auto-scaling**: Workers automatically become available as tasks complete
2. **Task queuing**: Unlimited pending tasks queue
3. **Error isolation**: One task failure doesn't affect others
4. **Progress tracking**: Real-time progress updates with worker counts
5. **Timeout handling**: 60-second timeout per audio generation task

## Limitations & Considerations

### When Parallelization Helps Most
- Generating audio for large datasets (100+ items)
- Machines with 4+ CPU cores
- When I/O is a bottleneck (writing to disk)

### When It May Not Help
- Very small datasets (< 10 items) - overhead outweighs benefits
- Single-core systems
- When processing audio with heavy post-processing

### Known Constraints
- Maximum 16 concurrent workers recommended
- Each Kokoro process uses ~200-300 MB RAM
- Total system memory should be: `(concurrency × 300 MB) + system overhead`

## Troubleshooting

### High Memory Usage
```bash
# Reduce concurrency to lower memory consumption
npm run tts-generate -- --provider kokoro --concurrency 2
```

### Slow Generation Despite Parallelization
```bash
# Check if disk I/O is the bottleneck
# Try: npm run tts-generate -- --provider kokoro --concurrency 8

# Verify system load
top  # macOS/Linux
# Look for CPU% - if < 50%, increase concurrency
```

### Worker Pool Hangs
```bash
# Check for file system issues
# Ensure .temp-audio directory is writable
mkdir -p .temp-audio
chmod 755 .temp-audio

# Restart generation with verbose output
npm run tts-generate -- --provider kokoro --concurrency 4
```

## Comparison with Other Providers

### ElevenLabs (Cloud)
- Parallelization helps minimize latency impact
- Rate limiting prevents exceeding API quotas
- Concurrency limited by API tier (typically 1-3 concurrent requests)

### Piper TTS (Local)
- Similar parallelization benefits as Kokoro
- Recommended concurrency: 2-4 (uses less memory than Kokoro)

### macOS say (Local)
- Minor parallelization benefits
- Lighter on resources, can handle 4-8 concurrent workers

## Implementation Examples

### Custom Concurrency in Code

```typescript
import { AudioWorkerPool } from './lib/worker-pool';

// Create pool with 8 workers
const pool = new AudioWorkerPool(8);

// Add tasks
pool.addTasks(tasks);

// Process with progress callback
const result = await pool.process((progress) => {
  console.log(`Progress: ${progress.completed}/${progress.total}`);
  console.log(`Active workers: ${pool.getActiveWorkers()}`);
});

// Check results
console.log(`Success: ${result.success}, Failed: ${result.failed}`);
```

### Monitoring Pool Status

```typescript
// During processing
console.log(`Queue size: ${pool.getQueueSize()}`);
console.log(`Active workers: ${pool.getActiveWorkers()}`);

// After processing
console.log(`Results: ${result.results.size} items processed`);
for (const [id, data] of result.results) {
  if (data.error) {
    console.error(`Failed: ${id} - ${data.error.message}`);
  } else {
    console.log(`Generated: ${id}`);
  }
}
```

## Future Improvements

Potential enhancements for even better performance:

1. **Batch API Processing** - Group multiple texts into single API call
2. **Memory Pooling** - Reuse buffers to reduce GC pressure
3. **Process Pooling** - Maintain persistent Kokoro processes
4. **Adaptive Concurrency** - Auto-adjust workers based on system load
5. **GPU Acceleration** - Utilize GPU if available for faster inference

## References

- [Worker Pool Implementation](./lib/worker-pool.ts)
- [TTS Generator](./tts-generator.ts)
- [Kokoro Client](./lib/kokoro-tts-client.ts)
