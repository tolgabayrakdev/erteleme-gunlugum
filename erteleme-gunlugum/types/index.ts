export type TaskStatus = 'pending' | 'done' | 'postponed' | 'cancelled';

export type TaskCategory = 'iş' | 'kişisel' | 'okul' | 'sağlık' | 'diğer';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  deadline?: string; // ISO date string
  initialPostponeReason?: string; // Why it was postponed initially
  status: TaskStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Postponement {
  id: string;
  taskId: string;
  date: string; // ISO date string
  reason: string;
  postponementNumber: number; // How many times this task has been postponed
}

export interface Statistics {
  totalPostponements: number;
  categoryBreakdown: Record<TaskCategory, number>;
  timePatterns: {
    hour: number;
    count: number;
  }[];
  dayPatterns: {
    day: string;
    count: number;
  }[];
  topReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  leastPostponedWeek?: {
    week: string;
    count: number;
  };
}

