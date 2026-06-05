type Task<T = any> = () => Promise<T>

interface QueueItem {
    task: Task
    resolve: (value: any) => void;
    reject: (reason: any) => void;
}

export class AIQueue {
    private queue: QueueItem[] = []
    private activeCount = 0
    private maxConcurrency = 1 // Strict serial model generation for quota conservation
    private spacingDelay = 1000 // 1-second delay spacing

    // Slidings window rate limit logs
    private runHistory: number[] = []
    private maxRequestsPerMinute = 10

    enqueue<T>(task: Task<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // Check sliding window rate limit
            const now = Date.now()
            this.runHistory = this.runHistory.filter(time => now - time < 60000)

            if (this.runHistory.length >= this.maxRequestsPerMinute) {
                reject(new Error("AI generation throttled. Rate limit of 10 requests/min exceeded."))
                return
            }

            this.queue.push({ task, resolve, reject })
            this.process()
        })
    }

    private async process() {
        if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
            return
        }

        const item = this.queue.shift()
        if (!item) return

        this.activeCount++
        this.runHistory.push(Date.now())

        try {
            await new Promise((resolve) => setTimeout(resolve, this.spacingDelay))
            const result = await item.task()
            item.resolve(result)
        } catch (error) {
            item.reject(error)
        } finally {
            this.activeCount--
            this.process()
        }
    }
}

export const aiQueue = new AIQueue()
