type Task<T = any> = () => Promise<T>;

interface QueueItem {
    task: Task;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
}

export class AIQueue {
    private queue: QueueItem[] = [];
    private activeCount = 0;
    private maxConcurrency = 2; // Strict parallel limit
    private spacingDelay = 200; // 200ms spacing between executions

    /**
     * Enqueues a task and returns a Promise resolving with the task's result
     */
    enqueue<T>(task: Task<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    private async process() {
        if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        const item = this.queue.shift();
        if (!item) return;

        this.activeCount++;

        try {
            // Space out requests by spacingDelay
            await new Promise((resolve) => setTimeout(resolve, this.spacingDelay));
            const result = await item.task();
            item.resolve(result);
        } catch (error) {
            item.reject(error);
        } finally {
            this.activeCount--;
            this.process(); // Process the next item in the queue
        }
    }
}

export const aiQueue = new AIQueue();
