const startupRetries = () => Number(process.env.KAFKA_STARTUP_RETRIES ?? 10);
const startupRetryDelayMs = () => Number(process.env.KAFKA_STARTUP_RETRY_DELAY_MS ?? 3000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retryKafkaStartup<T>(label: string, operation: () => Promise<T>): Promise<T> {
  const maxAttempts = startupRetries();
  const delayMs = startupRetryDelayMs();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      console.log(`[kafka-startup] ${label} failed. Retrying ${attempt}/${maxAttempts} in ${delayMs}ms.`);
      await sleep(delayMs);
    }
  }

  return operation();
}

