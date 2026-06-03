"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ClipboardCheck, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardChecklistTask = {
  title: string;
  checked: boolean;
};

type DashboardChecklistCardProps = {
  nowIso: string;
  tasks: DashboardChecklistTask[];
};

type StoredDashboardChecklist = {
  resetAt: number;
  taskTitles: string[];
  checked: boolean[];
};

const CHECKLIST_STORAGE_KEY = "pegadaian:admin-dashboard-checklist:v1";
const CHECKLIST_RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

const checklistDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Makassar"
});

const checklistTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Makassar"
});

function formatChecklistDate(value: Date) {
  const label = checklistDateFormatter.format(value);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatChecklistTime(value: Date) {
  return checklistTimeFormatter.format(value);
}

function getChecklistTaskTitles(tasks: DashboardChecklistTask[]) {
  return tasks.map((task) => task.title);
}

function matchesChecklistTasks(stored: StoredDashboardChecklist, tasks: DashboardChecklistTask[]) {
  const taskTitles = getChecklistTaskTitles(tasks);

  return stored.taskTitles.length === taskTitles.length && stored.taskTitles.every((title, index) => title === taskTitles[index]);
}

function createStoredChecklist(tasks: DashboardChecklistTask[], resetAt = Date.now() + CHECKLIST_RESET_INTERVAL_MS): StoredDashboardChecklist {
  return {
    resetAt,
    taskTitles: getChecklistTaskTitles(tasks),
    checked: tasks.map((task) => task.checked)
  };
}

function writeStoredChecklist(tasks: DashboardChecklistTask[], resetAt: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(createStoredChecklist(tasks, resetAt)));
}

function loadStoredChecklist(tasks: DashboardChecklistTask[]) {
  const resetAt = Date.now() + CHECKLIST_RESET_INTERVAL_MS;

  if (typeof window === "undefined") {
    return { tasks, resetAt };
  }

  const rawValue = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
  if (!rawValue) {
    writeStoredChecklist(tasks, resetAt);
    return { tasks, resetAt };
  }

  try {
    const stored = JSON.parse(rawValue) as StoredDashboardChecklist;
    if (
      typeof stored.resetAt !== "number" ||
      stored.resetAt <= Date.now() ||
      !Array.isArray(stored.checked) ||
      !matchesChecklistTasks(stored, tasks)
    ) {
      writeStoredChecklist(tasks, resetAt);
      return { tasks, resetAt };
    }

    return {
      resetAt: stored.resetAt,
      tasks: tasks.map((task, index) => ({
        ...task,
        checked: Boolean(stored.checked[index])
      }))
    };
  } catch {
    writeStoredChecklist(tasks, resetAt);
    return { tasks, resetAt };
  }
}

export function AdminDashboardChecklistCard({ nowIso, tasks }: DashboardChecklistCardProps) {
  const [interactiveTasks, setInteractiveTasks] = useState(tasks);
  const [now, setNow] = useState(() => new Date(nowIso));
  const [resetAt, setResetAt] = useState<number | null>(null);
  const taskSignature = useMemo(() => getChecklistTaskTitles(tasks).join("\u001f"), [tasks]);

  useEffect(() => {
    setNow(new Date(nowIso));
  }, [nowIso]);

  useEffect(() => {
    const restored = loadStoredChecklist(tasks);
    setInteractiveTasks(restored.tasks);
    setResetAt(restored.resetAt);
  }, [taskSignature]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (!resetAt) {
      return;
    }

    const resetDelay = Math.max(resetAt - Date.now(), 0);
    const resetTimerId = window.setTimeout(() => {
      const nextResetAt = Date.now() + CHECKLIST_RESET_INTERVAL_MS;
      setInteractiveTasks(tasks);
      setResetAt(nextResetAt);
      writeStoredChecklist(tasks, nextResetAt);
    }, resetDelay);

    return () => {
      window.clearTimeout(resetTimerId);
    };
  }, [resetAt, taskSignature]);

  const completedCount = useMemo(
    () => interactiveTasks.filter((task) => task.checked).length,
    [interactiveTasks]
  );

  const toggleTask = (index: number) => {
    const nextResetAt = resetAt && resetAt > Date.now() ? resetAt : Date.now() + CHECKLIST_RESET_INTERVAL_MS;
    setResetAt(nextResetAt);
    setInteractiveTasks((currentTasks) => {
      const nextTasks = currentTasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, checked: !task.checked } : task
      );

      writeStoredChecklist(nextTasks, nextResetAt);
      return nextTasks;
    });
  };

  return (
    <section className="admin-checklist-card relative overflow-hidden rounded-[1.95rem] border border-[#e7ede7] bg-white px-4 pb-4 pt-5 shadow-[0_22px_54px_-42px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-emerald-300/[0.09] dark:bg-[#0c1713] dark:shadow-[0_24px_60px_-38px_rgba(0,0,0,0.72)] sm:px-6 sm:pb-5">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[28rem] lg:block">
        <div className="admin-checklist-illustration absolute inset-y-3 right-3 w-[25rem]">
          <div className="admin-checklist-glow absolute right-20 top-8 h-36 w-36 rounded-full" />
          <div className="admin-checklist-stack admin-checklist-stack-back absolute right-20 top-10 h-[13.5rem] w-[10rem] rounded-[2rem]" />
          <div className="admin-checklist-stack admin-checklist-stack-mid absolute right-28 top-16 h-[16.5rem] w-[12rem] rounded-[2.2rem]" />
          <div className="admin-checklist-sheet absolute bottom-9 right-9 h-[12rem] w-[10.25rem] rotate-[-16deg] rounded-[1.9rem]">
            <span className="admin-checklist-sheet-check absolute left-5 top-5" />
            <span className="admin-checklist-sheet-line absolute left-16 top-8 w-20" />
            <span className="admin-checklist-sheet-line absolute left-16 top-[4.1rem] w-16" />
            <span className="admin-checklist-sheet-line absolute left-16 top-[5.4rem] w-[5.6rem]" />
            <span className="admin-checklist-sheet-line absolute left-16 top-[6.7rem] w-[6.1rem]" />
          </div>
          <div className="admin-checklist-board absolute right-[7.6rem] top-[4.7rem] h-[13rem] w-[10.6rem] rounded-[1.95rem]">
            <span className="admin-checklist-board-slot absolute left-1/2 top-5 h-3 w-[5.6rem] -translate-x-1/2 rounded-full" />
            <span className="admin-checklist-board-paper absolute bottom-5 left-1/2 h-[3.8rem] w-[7.6rem] -translate-x-1/2 rounded-[1rem]" />
          </div>
          <div className="admin-checklist-pencil absolute right-3 top-[6.7rem] h-[11.8rem] w-10 rotate-[22deg] rounded-full" />
          <div className="admin-checklist-chip absolute left-5 top-28 size-11 rotate-[-10deg] rounded-[1rem]" />
          <div className="admin-checklist-chip absolute bottom-11 right-0 size-10 rotate-[8deg] rounded-[1rem]" />
        </div>
      </div>

      <div className="relative">
        <div className="admin-checklist-header relative flex min-h-[5.8rem] flex-col gap-4 pr-0 sm:pr-[23.5rem]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[1rem] border border-[#deebe3] bg-[linear-gradient(180deg,#f9fcfa,#eef8f1)] text-[#0e6a44] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-emerald-300/12 dark:bg-[linear-gradient(180deg,rgba(32,120,83,0.24),rgba(14,73,52,0.2))] dark:text-emerald-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <ClipboardCheck className="size-5" strokeWidth={1.8} />
            </span>
            <h2 className="font-headline text-[0.95rem] font-black uppercase tracking-[0.22em] text-[#20322a] dark:text-slate-100">
              Checklist Harian
            </h2>
          </div>

          <div className="admin-checklist-stamp relative inline-flex w-full flex-wrap items-center gap-3 self-start rounded-[1.35rem] border border-[#e6ece7] bg-white/92 px-4 py-3 text-[0.88rem] font-semibold text-[#53645d] shadow-[0_16px_34px_-30px_rgba(15,23,42,0.22)] dark:border-emerald-300/[0.1] dark:bg-[linear-gradient(180deg,rgba(18,31,25,0.92),rgba(13,23,19,0.86))] dark:text-[#d8e7df] sm:absolute sm:right-0 sm:top-0 sm:w-auto sm:flex-nowrap">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <CalendarDays className="size-4 text-[#5f7168] dark:text-emerald-200/78" strokeWidth={1.8} />
              {formatChecklistDate(now)}
            </span>
            <span className="hidden h-5 w-px bg-[#e2e8e2] dark:bg-white/10 sm:block" />
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#22342d] dark:text-slate-100">
              <Clock3 className="size-4 text-[#5f7168] dark:text-emerald-200/78" strokeWidth={1.8} />
              {formatChecklistTime(now)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-start lg:justify-end">
          <span className="inline-flex items-center rounded-full border border-[#d6eddc] bg-[linear-gradient(180deg,#f4fcf6,#edf9f0)] px-3 py-1.5 text-[0.76rem] font-black tracking-[0.02em] text-[#188454] shadow-[0_14px_28px_-24px_rgba(18,132,79,0.42)] dark:border-emerald-300/[0.18] dark:bg-[linear-gradient(180deg,rgba(25,93,65,0.44),rgba(13,54,39,0.28))] dark:text-[#d7f7e5]">
            {completedCount} / {interactiveTasks.length} Selesai
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-[#edf1ed] bg-white/88 dark:border-emerald-300/[0.08] dark:bg-[linear-gradient(180deg,rgba(11,22,18,0.88),rgba(8,17,14,0.8))]">
          {interactiveTasks.map((task, index) => (
            <button
              aria-pressed={task.checked}
              className={cn(
                "admin-checklist-row group grid w-full grid-cols-[2rem_minmax(0,1fr)_1.9rem] items-center gap-3 px-4 py-4 text-left transition-colors duration-300 sm:grid-cols-[2.35rem_minmax(0,1fr)_2.1rem] sm:px-5",
                index !== interactiveTasks.length - 1 && "border-b border-[#edf1ee] dark:border-emerald-300/[0.08]",
                task.checked && "admin-checklist-row-checked"
              )}
              key={task.title}
              onClick={() => toggleTask(index)}
              type="button"
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-[0.82rem] font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-300 sm:size-8",
                  task.checked
                    ? "bg-[linear-gradient(180deg,#1f8355,#126e45)] text-white shadow-[0_12px_24px_-18px_rgba(18,110,69,0.7),inset_0_1px_0_rgba(255,255,255,0.26)]"
                    : "border border-[#d9e3dc] bg-[linear-gradient(180deg,#f8faf8,#f1f5f1)] text-[#2d4338] dark:border-emerald-300/[0.16] dark:bg-[linear-gradient(180deg,rgba(20,38,31,0.94),rgba(13,26,21,0.9))] dark:text-[#ebf6ef]"
                )}
              >
                {index + 1}
              </span>
              <p className="max-w-[54rem] pr-2 text-[0.92rem] font-semibold leading-6 text-[#32463d] transition-colors duration-300 dark:text-[#dceadf] sm:text-[0.96rem]">
                {task.title}
              </p>
              <span
                className={cn(
                  "admin-checklist-toggle grid size-7 place-items-center rounded-full border transition-all duration-300 sm:size-8",
                  task.checked
                    ? "border-[#d7f0e0] bg-[linear-gradient(180deg,#1f8355,#126e45)] text-white shadow-[0_14px_30px_-22px_rgba(18,110,69,0.7)]"
                    : "border-[#d7deda] bg-white text-transparent dark:border-emerald-300/[0.16] dark:bg-[linear-gradient(180deg,rgba(18,35,28,0.9),rgba(10,21,17,0.82))]"
                )}
              >
                <Check className={cn("size-[0.95rem] transition-all duration-300", task.checked ? "scale-100 opacity-100" : "scale-50 opacity-0")} strokeWidth={2.8} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
