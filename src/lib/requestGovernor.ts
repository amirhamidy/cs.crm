import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosResponse,
  type GenericAbortSignal,
} from "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * "low" = کارهای پس‌زمینه (مثل sync نوتیفیکیشن). سقف هم‌زمانی جدا و کمتری دارند
     * تا هیچ‌وقت درخواست‌های کاربر را پشت خودشان نگه ندارند. پیش‌فرض: عادی.
     */
    priority?: "low";
  }
}

export interface GovernorOptions {
  /** حداکثر GET هم‌زمان در کل برنامه */
  maxConcurrent?: number;
  /** از آن سقف، حداکثر چند تا می‌تواند «پس‌زمینه» باشد (بقیه برای کاربر رزرو است) */
  maxBackground?: number;
  /** GETهای کاملاً یکسانِ هم‌زمان یک درخواست شبکه‌ای می‌شوند */
  dedupeGet?: boolean;
}

export interface GovernorStats {
  started: number;
  deduped: number;
  canceledInQueue: number;
  active: number;
  queued: number;
  peakActive: number;
  peakQueued: number;
}

interface Job {
  background: boolean;
  start: () => void;
}

const stats: GovernorStats = {
  started: 0,
  deduped: 0,
  canceledInQueue: 0,
  active: 0,
  queued: 0,
  peakActive: 0,
  peakQueued: 0,
};

/** برای dev/عیب‌یابی: چند درخواست واقعاً به شبکه رفت و چند تا حذف (dedupe) شد. */
export const getRequestStats = (): Readonly<GovernorStats> => ({ ...stats });

/**
 * کنترل‌گر سراسری درخواست‌ها، به‌صورت adapter روی axios:
 *  - بعد از request interceptorها اجرا می‌شود (هدر Authorization سالم است)
 *    و قبل از response interceptorها (چرخهٔ ریفرش توکن/۴۰۱ بدون تغییر کار می‌کند).
 *  - فقط GET را صف و dedupe می‌کند؛ POST/PUT/DELETE/آپلود هیچ‌وقت منتظر نمی‌مانند.
 *  - درخواستی که signal دارد dedupe نمی‌شود (لغوِ یکی نباید دیگری را بکشد)،
 *    ولی هنگام انتظار در صف، با abort از صف بیرون می‌رود.
 */
export function installRequestGovernor(
  instance: AxiosInstance,
  { maxConcurrent = 6, maxBackground = 2, dedupeGet = true }: GovernorOptions = {},
): void {
  const base = axios.getAdapter(instance.defaults.adapter);
  const queue: Job[] = [];
  const inflight = new Map<string, Promise<AxiosResponse>>();
  let active = 0;
  let activeBackground = 0;

  const pump = () => {
    let i = 0;
    while (i < queue.length && active < maxConcurrent) {
      const job = queue[i];
      if (job.background && activeBackground >= maxBackground) {
        i += 1;
        continue;
      }
      queue.splice(i, 1);
      active += 1;
      if (job.background) activeBackground += 1;
      stats.active = active;
      stats.peakActive = Math.max(stats.peakActive, active);
      job.start();
    }
    stats.queued = queue.length;
  };

  const schedule = <T>(
    background: boolean,
    signal: GenericAbortSignal | undefined,
    task: () => Promise<T>,
  ): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const job: Job = {
        background,
        start: () => {
          stats.started += 1;
          task()
            .then(resolve, reject)
            .finally(() => {
              active -= 1;
              if (background) activeBackground -= 1;
              stats.active = active;
              pump();
            });
        },
      };

      if (signal) {
        if (signal.aborted) {
          reject(new axios.CanceledError("canceled"));
          return;
        }
        signal.addEventListener?.(
          "abort",
          () => {
            const index = queue.indexOf(job);
            if (index === -1) return; // قبلاً شروع شده؛ خود adapter لغو را مدیریت می‌کند
            queue.splice(index, 1);
            stats.canceledInQueue += 1;
            stats.queued = queue.length;
            reject(new axios.CanceledError("canceled"));
          },
          { once: true },
        );
      }

      queue.push(job);
      stats.peakQueued = Math.max(stats.peakQueued, queue.length);
      pump();
    });

  const governed: AxiosAdapter = (config) => {
    const method = (config.method ?? "get").toLowerCase();

    // فقط GET کنترل می‌شود؛ تغییر داده (POST/PUT/PATCH/DELETE) و آپلود هرگز صف نمی‌شود.
    if (method !== "get") return base(config);

    const background = config.priority === "low";
    const run = () => schedule(background, config.signal, () => base(config));

    const dedupable =
      dedupeGet &&
      !config.signal &&
      (config.responseType === undefined || config.responseType === "json");

    if (!dedupable) return run();

    const key = `${instance.getUri(config)}|${String(config.headers?.Authorization ?? "")}`;
    const existing = inflight.get(key);

    if (existing) {
      stats.deduped += 1;
      // کپی سطحی: هر مصرف‌کننده response خودش را دارد (transformResponse روی شیء مشترک نمی‌نشیند)
      return existing.then((response) => ({ ...response }));
    }

    const promise = run().finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
    inflight.set(key, promise);

    return promise.then((response) => ({ ...response }));
  };

  instance.defaults.adapter = governed;
}
