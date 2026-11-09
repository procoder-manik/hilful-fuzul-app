/** সার্ভার চালু হলে একবার চলে: দৈনিক বিজ্ঞপ্তির সময়সূচি চালু করে */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/notify/scheduler');
    startScheduler();
  }
}
