import { Task } from '../components/TaskModal';

// Simulované úložište úloh v localStorage
const TASKS_STORAGE_KEY = 'allTasks';

export interface TaskService {
  getAllTasks(): Task[];
  getTasksByCompany(companyId: number): Task[];
  getTasksByAccountant(accountantEmail: string): Task[];
  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task;
  updateTask(taskId: string, updates: Partial<Task>): Task | null;
  deleteTask(taskId: string): boolean;
}

class TaskServiceImpl implements TaskService {
  private getTasksFromStorage(): Task[] {
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Chyba pri načítaní úloh:', error);
      return [];
    }
  }

  private saveTasksToStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Chyba pri ukladaní úloh:', error);
    }
  }

  getAllTasks(): Task[] {
    return this.getTasksFromStorage();
  }

  getTasksByCompany(companyId: number): Task[] {
    const allTasks = this.getTasksFromStorage();
    return allTasks.filter(task => task.companyId === companyId);
  }

  getTasksByAccountant(accountantEmail: string): Task[] {
    const allTasks = this.getTasksFromStorage();
    return allTasks.filter(task => task.assignedToEmail === accountantEmail);
  }

  addTask(taskData: Omit<Task, 'id' | 'createdAt'>): Task {
    const allTasks = this.getTasksFromStorage();
    
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    allTasks.push(newTask);
    this.saveTasksToStorage(allTasks);
    
    return newTask;
  }

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const allTasks = this.getTasksFromStorage();
    const taskIndex = allTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return null;
    }

    allTasks[taskIndex] = { ...allTasks[taskIndex], ...updates };
    this.saveTasksToStorage(allTasks);
    
    return allTasks[taskIndex];
  }

  deleteTask(taskId: string): boolean {
    const allTasks = this.getTasksFromStorage();
    const filteredTasks = allTasks.filter(task => task.id !== taskId);
    
    if (filteredTasks.length === allTasks.length) {
      return false; // Úloha nebola nájdená
    }

    this.saveTasksToStorage(filteredTasks);
    return true;
  }

  // Inicializácia s predvolenými úlohami
  initializeDefaultTasks(): void {
    const existingTasks = this.getTasksFromStorage();
    if (existingTasks.length > 0) {
      return; // Už existujú úlohy
    }

    const defaultTasks: Task[] = [
      {
        id: '1',
        title: 'Dokončiť výročnú správu 2024',
        description: 'Pripraviť a dokončiť výročnú správu za rok 2024, vrátane všetkých príloh a dokumentácie.',
        status: 'pending',
        priority: 'high',
        assignedTo: 'Mgr. Jana Nováková',
        assignedToEmail: 'accountant@portal.sk',
        dueDate: '2024-12-20',
        createdAt: '2024-12-01T10:00:00Z',
        createdBy: 'Admin',
        category: 'accounting',
        estimatedHours: 16,
        companyId: 1,
        companyName: 'Test Firma s.r.o.'
      },
      {
        id: '2',
        title: 'Overiť DPH priznanie Q4',
        description: 'Kontrola a overenie DPH priznania za 4. štvrťrok 2024 pred odoslaním.',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'Ing. Peter Kováč',
        assignedToEmail: 'accountant@portal.sk',
        dueDate: '2024-12-18',
        createdAt: '2024-12-05T14:30:00Z',
        createdBy: 'Admin',
        category: 'tax',
        estimatedHours: 8,
        companyId: 1,
        companyName: 'Test Firma s.r.o.'
      },
      {
        id: '3',
        title: 'Aktualizovať firemné údaje',
        description: 'Aktualizácia firemných údajov v registri a notifikácia zmien úradom.',
        status: 'completed',
        priority: 'medium',
        assignedTo: 'Mgr. Anna Svobodová',
        assignedToEmail: 'accountant@portal.sk',
        dueDate: '2024-12-15',
        createdAt: '2024-12-10T09:15:00Z',
        createdBy: 'Admin',
        category: 'hr',
        estimatedHours: 4,
        companyId: 1,
        companyName: 'Test Firma s.r.o.'
      }
    ];

    this.saveTasksToStorage(defaultTasks);
  }
}

export const taskService = new TaskServiceImpl();

// Inicializácia pri načítaní aplikácie
if (typeof window !== 'undefined') {
  taskService.initializeDefaultTasks();
}

