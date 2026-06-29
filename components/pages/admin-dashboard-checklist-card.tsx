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
  dateKey: string;
  taskTitles: string[];
  checked: boolean[];
};

const CHECKLIST_STORAGE_KEY = "pegadaian:admin-dashboard-checklist:v1";

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

const checklistDateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Makassar",
  year: "numeric"
});

function formatChecklistDate(value: Date) {
  const label = checklistDateFormatter.format(value);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatChecklistTime(value: Date) {
  return checklistTimeFormatter.format(value);
}

function getChecklistDateKey(value: Date) {
  const parts = checklistDateKeyFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function getChecklistTaskTitles(tasks: DashboardChecklistTask[]) {
  return tasks.map((task) => task.title);
}

function matchesChecklistTasks(stored: StoredDashboardChecklist, tasks: DashboardChecklistTask[]) {
  const taskTitles = getChecklistTaskTitles(tasks);

  return stored.taskTitles.length === taskTitles.length && stored.taskTitles.every((title, index) => title === taskTitles[index]);
}

function createStoredChecklist(tasks: DashboardChecklistTask[], dateKey: string): StoredDashboardChecklist {
  return {
    dateKey,
    taskTitles: getChecklistTaskTitles(tasks),
    checked: tasks.map((task) => task.checked)
  };
}

function writeStoredChecklist(tasks: DashboardChecklistTask[], dateKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(createStoredChecklist(tasks, dateKey)));
}

function loadStoredChecklist(tasks: DashboardChecklistTask[]) {
  const dateKey = getChecklistDateKey(new Date());

  if (typeof window === "undefined") {
    return { tasks, dateKey };
  }

  const rawValue = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
  if (!rawValue) {
    writeStoredChecklist(tasks, dateKey);
    return { tasks, dateKey };
  }

  try {
    const stored = JSON.parse(rawValue) as StoredDashboardChecklist;
    if (
      stored.dateKey !== dateKey ||
      !Array.isArray(stored.checked) ||
      !matchesChecklistTasks(stored, tasks)
    ) {
      writeStoredChecklist(tasks, dateKey);
      return { tasks, dateKey };
    }

    return {
      dateKey,
      tasks: tasks.map((task, index) => ({
        ...task,
        checked: Boolean(stored.checked[index])
      }))
    };
  } catch {
    writeStoredChecklist(tasks, dateKey);
    return { tasks, dateKey };
  }
}

export function AdminDashboardChecklistCard({ nowIso, tasks }: DashboardChecklistCardProps) {
  const [interactiveTasks, setInteractiveTasks] = useState(tasks);
  const [now, setNow] = useState(() => new Date(nowIso));
  const [dateKey, setDateKey] = useState(() => getChecklistDateKey(new Date(nowIso)));
  const taskSignature = useMemo(() => getChecklistTaskTitles(tasks).join("\u001f"), [tasks]);

  useEffect(() => {
    setNow(new Date(nowIso));
  }, [nowIso]);

  useEffect(() => {
    const restored = loadStoredChecklist(tasks);
    setInteractiveTasks(restored.tasks);
    setDateKey(restored.dateKey);
  }, [taskSignature, tasks]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    const currentDateKey = getChecklistDateKey(now);
    if (currentDateKey === dateKey) {
      return;
    }

    setInteractiveTasks(tasks);
    setDateKey(currentDateKey);
    writeStoredChecklist(tasks, currentDateKey);
  }, [dateKey, now, taskSignature, tasks]);

  const completedCount = useMemo(
    () => interactiveTasks.filter((task) => task.checked).length,
    [interactiveTasks]
  );

  const toggleTask = (index: number) => {
    const currentDateKey = getChecklistDateKey(new Date());
    setDateKey(currentDateKey);
    setInteractiveTasks((currentTasks) => {
      const nextTasks = currentTasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, checked: !task.checked } : task
      );

      writeStoredChecklist(nextTasks, currentDateKey);
      return nextTasks;
    });
  };
  const completionPercent = interactiveTasks.length
    ? Math.round((completedCount / interactiveTasks.length) * 100)
    : 0;

  return (
    <section
      className="admin-checklist-card relative overflow-hidden rounded-[1.25rem] border border-[#e3e9e5] bg-white p-4 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.2)] [font-family:var(--font-plus-jakarta)] dark:border-emerald-300/[0.09] dark:bg-[#0c1713] dark:shadow-[0_24px_60px_-38px_rgba(0,0,0,0.72)] sm:p-5"
      data-testid="admin-dashboard-checklist"
    >
      <div className="relative">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="grid size-[3.35rem] shrink-0 place-items-center rounded-[0.9rem] border border-[#e1e8e3] bg-white text-[#14794e] shadow-[0_12px_28px_-22px_rgba(15,23,42,0.32),inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-emerald-300/12 dark:bg-emerald-300/[0.06] dark:text-emerald-200">
              <ClipboardCheck className="size-7" strokeWidth={1.85} />
            </span>
            <div>
              <h2 className="text-[1.35rem] font-extrabold leading-tight text-[#17372d] dark:text-slate-100 sm:text-[1.55rem]">
                Checklist Harian
              </h2>
              <span className="mt-2 flex items-center">
                <span className="h-0.5 w-16 rounded-full bg-[#11844e]" />
                <span className="mx-1 size-2 rotate-45 bg-[#d0ad48]" />
                <span className="h-0.5 w-10 rounded-full bg-[#b7ca7c]" />
              </span>
            </div>
          </div>

          <div className="inline-flex w-full flex-wrap items-center gap-3 self-start rounded-full border border-[#e2e8e4] bg-white px-4 py-2.5 text-[0.76rem] font-semibold text-[#53615d] shadow-[0_12px_30px_-26px_rgba(15,23,42,0.2)] dark:border-emerald-300/[0.1] dark:bg-white/[0.04] dark:text-[#d8e7df] sm:w-auto sm:flex-nowrap">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <CalendarDays className="size-4 text-[#687672] dark:text-emerald-200/78" strokeWidth={1.8} />
              {formatChecklistDate(now)}
            </span>
            <span className="hidden h-5 w-px bg-[#e1e6e3] dark:bg-white/10 sm:block" />
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#33413d] dark:text-slate-100">
              <Clock3 className="size-4 text-[#687672] dark:text-emerald-200/78" strokeWidth={1.8} />
              {formatChecklistTime(now)}
            </span>
          </div>
        </header>

        <div className="mt-4 flex justify-start md:justify-end">
          <div className="inline-flex min-w-[15rem] items-center gap-4 rounded-full border border-[#e2e9e4] bg-[linear-gradient(180deg,#f8fbf9,#f3f8f5)] px-4 py-2 text-[0.78rem] font-semibold text-[#253a31] dark:border-emerald-300/[0.12] dark:bg-emerald-300/[0.06] dark:text-slate-100">
            <span className="whitespace-nowrap">
              <strong className="font-extrabold text-[#14794e] dark:text-emerald-200">{completedCount}</strong>
              {" / "}
              {interactiveTasks.length} Selesai
            </span>
            <span
              aria-label="Progres checklist harian"
              aria-valuemax={interactiveTasks.length}
              aria-valuemin={0}
              aria-valuenow={completedCount}
              className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7ece9] dark:bg-white/10"
              role="progressbar"
            >
              <span
                className="block h-full rounded-full bg-[linear-gradient(90deg,#11844e,#4fc888)] transition-[width] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                style={{ width: `${completionPercent}%` }}
              />
            </span>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-[1rem] border border-[#e7ece8] bg-white dark:border-emerald-300/[0.08] dark:bg-white/[0.025]">
          {interactiveTasks.map((task, index) => (
            <button
              aria-pressed={task.checked}
              className={cn(
                "admin-checklist-row group grid min-h-[3.5rem] w-full grid-cols-[1.85rem_minmax(0,1fr)_1.85rem] items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-200 sm:px-4",
                index !== interactiveTasks.length - 1 && "border-b border-[#edf1ee] dark:border-emerald-300/[0.08]",
                task.checked && "bg-[linear-gradient(90deg,#f0f8f3,#f8fcf9)] dark:bg-emerald-300/[0.055]"
              )}
              key={task.title}
              onClick={() => toggleTask(index)}
              type="button"
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-[0.76rem] font-extrabold transition-[background-color,color,border-color] duration-200",
                  task.checked
                    ? "bg-[linear-gradient(180deg,#1f8758,#126e45)] text-white shadow-[0_10px_22px_-16px_rgba(18,110,69,0.65)]"
                    : "border border-[#d9e1dc] bg-white text-[#33413b] dark:border-emerald-300/[0.16] dark:bg-white/[0.04] dark:text-[#ebf6ef]"
                )}
              >
                {index + 1}
              </span>
              <p className="pr-2 text-[0.78rem] font-medium leading-5 text-[#273a32] dark:text-[#dceadf] sm:text-[0.82rem]">
                {task.title}
              </p>
              <span
                className={cn(
                  "admin-checklist-toggle grid size-7 place-items-center rounded-full border transition-[background-color,color,border-color] duration-200",
                  task.checked
                    ? "border-[#197c50] bg-[linear-gradient(180deg,#1f8758,#126e45)] text-white"
                    : "border-[#d8dfdb] bg-white text-transparent dark:border-emerald-300/[0.16] dark:bg-white/[0.04]"
                )}
              >
                <Check className={cn("size-4 transition-[opacity,transform] duration-200", task.checked ? "scale-100 opacity-100" : "scale-75 opacity-0")} strokeWidth={2.8} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
