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
  resetAtIso?: string;
  taskTitles: string[];
  checked: boolean[];
};

const CHECKLIST_STORAGE_KEY = "pegadaian:admin-dashboard-checklist:v1";
const CHECKLIST_TIME_ZONE = "Asia/Makassar";
const CHECKLIST_TIME_ZONE_OFFSET_MS = 8 * 60 * 60 * 1000;

const checklistDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: CHECKLIST_TIME_ZONE
});

const checklistTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: CHECKLIST_TIME_ZONE
});

const checklistDateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: CHECKLIST_TIME_ZONE,
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

function getChecklistResetAtIso(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const nextLocalMidnightUtc = Date.UTC(year, month - 1, day + 1) - CHECKLIST_TIME_ZONE_OFFSET_MS;

  return new Date(nextLocalMidnightUtc).toISOString();
}

function getChecklistTaskTitles(tasks: DashboardChecklistTask[]) {
  return tasks.map((task) => task.title);
}

function resetChecklistTasks(tasks: DashboardChecklistTask[]) {
  return tasks.map((task) => ({ ...task, checked: false }));
}

function matchesChecklistTasks(stored: StoredDashboardChecklist, tasks: DashboardChecklistTask[]) {
  const taskTitles = getChecklistTaskTitles(tasks);

  return stored.taskTitles.length === taskTitles.length && stored.taskTitles.every((title, index) => title === taskTitles[index]);
}

function createStoredChecklist(tasks: DashboardChecklistTask[], dateKey: string): StoredDashboardChecklist {
  return {
    dateKey,
    resetAtIso: getChecklistResetAtIso(dateKey),
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

function isStoredChecklistExpired(stored: StoredDashboardChecklist, dateKey: string, now: Date) {
  if (stored.dateKey !== dateKey) {
    return true;
  }

  if (!stored.resetAtIso) {
    return false;
  }

  const resetAt = Date.parse(stored.resetAtIso);

  return !Number.isFinite(resetAt) || now.getTime() >= resetAt;
}

function loadStoredChecklist(tasks: DashboardChecklistTask[]) {
  const currentNow = new Date();
  const dateKey = getChecklistDateKey(currentNow);

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
    if (isStoredChecklistExpired(stored, dateKey, currentNow)) {
      const resetTasks = resetChecklistTasks(tasks);
      writeStoredChecklist(resetTasks, dateKey);
      return { tasks: resetTasks, dateKey };
    }

    if (!Array.isArray(stored.checked) || !matchesChecklistTasks(stored, tasks)) {
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
    const resetAt = Date.parse(getChecklistResetAtIso(dateKey));

    if (currentDateKey === dateKey && now.getTime() < resetAt) {
      return;
    }

    const resetTasks = resetChecklistTasks(tasks);
    setInteractiveTasks(resetTasks);
    setDateKey(currentDateKey);
    writeStoredChecklist(resetTasks, currentDateKey);
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
      className="admin-checklist-card relative overflow-hidden rounded-[1.55rem] border border-[#e2e8e4] bg-[#fdfefe] p-0 shadow-[0_22px_58px_-46px_rgba(15,23,42,0.24)] [font-family:var(--font-plus-jakarta)] dark:border-emerald-300/[0.09] dark:bg-[#0c1713] dark:shadow-[0_24px_60px_-38px_rgba(0,0,0,0.72)]"
      data-testid="admin-dashboard-checklist"
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[9.75rem] w-full text-[#e6ece8] dark:text-emerald-300/10"
        data-testid="admin-checklist-wave"
        preserveAspectRatio="none"
        viewBox="0 0 1000 210"
      >
        <defs>
          <linearGradient id="admin-checklist-wave-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="64%" stopColor="#fbfdfb" />
            <stop offset="100%" stopColor="#f6faf7" />
          </linearGradient>
        </defs>
        <path
          d="M0 0H1000V0C930 22 885 64 812 69C724 75 700 30 624 31C507 33 498 99 374 119C260 137 137 115 0 129V0Z"
          fill="url(#admin-checklist-wave-fill)"
        />
        <path
          d="M0 129C137 115 260 137 374 119C498 99 507 33 624 31C700 30 724 75 812 69C885 64 930 22 1000 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
        />
      </svg>

      <div className="relative px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5 xl:px-6 xl:pb-6">
        <header className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="flex items-center gap-4">
            <span className="grid size-[4.05rem] shrink-0 place-items-center rounded-[1.08rem] border border-[#e4ebe6] bg-white text-[#14794e] shadow-[0_18px_36px_-27px_rgba(15,23,42,0.34),inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-emerald-300/12 dark:bg-emerald-300/[0.06] dark:text-emerald-200">
              <ClipboardCheck className="size-8" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-[1.7rem] font-extrabold leading-none text-[#17372d] [letter-spacing:0] dark:text-slate-100 sm:text-[2.05rem]">
                Checklist Harian
              </h2>
              <span className="mt-3 flex items-center pl-10 sm:pl-14">
                <span className="h-0.5 w-14 rounded-full bg-[#11844e]" />
                <span className="mx-1.5 size-2 rotate-45 bg-[#d0ad48]" />
                <span className="h-0.5 w-11 rounded-full bg-[#b7ca7c]" />
              </span>
            </div>
          </div>

          <div className="inline-flex w-full flex-wrap items-center gap-3 self-start rounded-full border border-[#e0e8e4] bg-white/95 px-4 py-2.5 text-[0.8rem] font-semibold text-[#53615d] shadow-[0_14px_32px_-27px_rgba(15,23,42,0.22)] dark:border-emerald-300/[0.1] dark:bg-white/[0.04] dark:text-[#d8e7df] sm:w-auto sm:flex-nowrap">
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

        <div className="mt-5 flex justify-start md:justify-end">
          <div className="inline-flex min-w-[17rem] items-center gap-5 rounded-full border border-[#e1e9e4] bg-[linear-gradient(180deg,#f8fbf9,#f2f8f5)] px-5 py-2.5 text-[0.95rem] font-semibold text-[#1f3329] shadow-[inset_0_1px_0_rgba(255,255,255,0.74)] dark:border-emerald-300/[0.12] dark:bg-emerald-300/[0.06] dark:text-slate-100">
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
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e7ece9] dark:bg-white/10"
              role="progressbar"
            >
              <span
                className="block h-full rounded-full bg-[linear-gradient(90deg,#1a8e5f,#54c48a)] transition-[width] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                style={{ width: `${completionPercent}%` }}
              />
            </span>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.18rem] border border-[#e5ece8] bg-white shadow-[0_16px_36px_-34px_rgba(15,23,42,0.28)] dark:border-emerald-300/[0.08] dark:bg-white/[0.025]">
          {interactiveTasks.map((task, index) => (
            <button
              aria-pressed={task.checked}
              className={cn(
                "admin-checklist-row group grid min-h-[3.9rem] w-full grid-cols-[2.15rem_minmax(0,1fr)_2.15rem] items-center gap-4 px-4 py-2.5 text-left transition-colors duration-200 sm:px-5",
                index !== interactiveTasks.length - 1 && "border-b border-[#edf1ee] dark:border-emerald-300/[0.08]",
                task.checked && "bg-[linear-gradient(90deg,#eef8f2_0%,#f7fcf9_100%)] dark:bg-emerald-300/[0.055]"
              )}
              key={task.title}
              onClick={() => toggleTask(index)}
              type="button"
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-[0.78rem] font-extrabold transition-[background-color,color,border-color] duration-200",
                  task.checked
                    ? "bg-[linear-gradient(180deg,#1f8758,#126e45)] text-white shadow-[0_10px_22px_-16px_rgba(18,110,69,0.65)]"
                    : "border border-[#d9e1dc] bg-white text-[#33413b] dark:border-emerald-300/[0.16] dark:bg-white/[0.04] dark:text-[#ebf6ef]"
                )}
              >
                {index + 1}
              </span>
              <p className="pr-2 text-[0.82rem] font-medium leading-6 text-[#1e2c27] dark:text-[#dceadf] sm:text-[0.9rem]">
                {task.title}
              </p>
              <span
                className={cn(
                  "admin-checklist-toggle grid size-8 place-items-center rounded-full border transition-[background-color,color,border-color] duration-200",
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
