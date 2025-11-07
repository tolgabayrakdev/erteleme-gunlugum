import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Postponement } from '@/types';

const TASKS_KEY = '@tasks';
const POSTPONEMENTS_KEY = '@postponements';

export const storageService = {
  // Tasks
  async getTasks(): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  },

  async saveTask(task: Task): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const existingIndex = tasks.findIndex((t) => t.id === task.id);
      if (existingIndex >= 0) {
        tasks[existingIndex] = task;
      } else {
        tasks.push(task);
      }
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const filtered = tasks.filter((t) => t.id !== taskId);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Postponements
  async getPostponements(): Promise<Postponement[]> {
    try {
      const data = await AsyncStorage.getItem(POSTPONEMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting postponements:', error);
      return [];
    }
  },

  async savePostponement(postponement: Postponement): Promise<void> {
    try {
      const postponements = await this.getPostponements();
      postponements.push(postponement);
      await AsyncStorage.setItem(POSTPONEMENTS_KEY, JSON.stringify(postponements));
    } catch (error) {
      console.error('Error saving postponement:', error);
      throw error;
    }
  },

  async getPostponementsByTaskId(taskId: string): Promise<Postponement[]> {
    try {
      const postponements = await this.getPostponements();
      return postponements.filter((p) => p.taskId === taskId);
    } catch (error) {
      console.error('Error getting postponements by task:', error);
      return [];
    }
  },
};

