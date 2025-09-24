// DefinA?cia Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedToEmail: string;
  dueDate: string;
  createdAt: string;
  createdBy: string;
  category: string;
  estimatedHours: number;
  companyId: number;
  companyName: string;
}

// SimulovanA? AsloLliL?te Asloh v localStorage
const TASKS_STORAGE_KEY = 'allTasks';

export interface TaskService {
  getAllTasks(): Promise<Task[]>;
  getTasksByCompany(companyId: number): Promise<Task[]>;
  getTasksByAccountant(accountantEmail: string): Promise<Task[]>;
  addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null>;
  deleteTask(taskId: string): Promise<boolean>;
}

class TaskServiceImpl implements TaskService {
  private getTasksFromStorage(): Task[] {
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Chyba pri na?TA?tanA? Asloh:', error);
      return [];
    }
  }

  private saveTasksToStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Chyba pri ukladanA? Asloh:', error);
    }
  }

  async getAllTasks(): Promise<Task[]> {
    return Promise.resolve(this.getTasksFromStorage());
  }

  async getTasksByCompany(companyId: number): Promise<Task[]> {
    const allTasks = this.getTasksFromStorage();
    return Promise.resolve(allTasks.filter(task => task.companyId === companyId));
  }

  async getTasksByAccountant(accountantEmail: string): Promise<Task[]> {
    const allTasks = this.getTasksFromStorage();
    return Promise.resolve(allTasks.filter(task => task.assignedToEmail === accountantEmail));
  }

  async addTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const allTasks = this.getTasksFromStorage();
    
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    allTasks.push(newTask);
    this.saveTasksToStorage(allTasks);
    
    return Promise.resolve(newTask);
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const allTasks = this.getTasksFromStorage();
    const taskIndex = allTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return Promise.resolve(null);
    }

    allTasks[taskIndex] = { ...allTasks[taskIndex], ...updates };
    this.saveTasksToStorage(allTasks);
    
    return Promise.resolve(allTasks[taskIndex]);
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const allTasks = this.getTasksFromStorage();
    const filteredTasks = allTasks.filter(task => task.id !== taskId);
    
    if (filteredTasks.length === allTasks.length) {
      return Promise.resolve(false); // Asloha nebola nA?jdenA?
    }

    this.saveTasksToStorage(filteredTasks);
    return Promise.resolve(true);
  }

  // InicializA?cia s predvolenA?mi Aslohami
  initializeDefaultTasks(): void {
    const existingTasks = this.getTasksFromStorage();
    if (existingTasks.length > 0) {
      return; // ULl existujAs Aslohy
    }

    const defaultTasks: Task[] = [
      {
        id: '1',
        title: 'Dokon?TiLA vA?ro?TnAs sprA?vu 2024',
        description: 'PripraviLA a dokon?TiLA vA?ro?TnAs sprA?vu za rok 2024, vrA?tane vL?etkA?ch prA?loh a dokumentA?cie.',
        status: 'pending',
        priority: 'high',
        assignedTo: 'Mgr. Jana NovA?kovA?',
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
        title: 'OveriLA DPH priznanie Q4',
        description: 'Kontrola a overenie DPH priznania za 4. L?tvrLArok 2024 pred odoslanA?m.',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'Ing. Peter KovA??T',
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
        title: 'AktualizovaLA firemnA? Asdaje',
        description: 'AktualizA?cia firemnA?ch Asdajov v registri a notifikA?cia zmien Asradom.',
        status: 'completed',
        priority: 'medium',
        assignedTo: 'Mgr. Anna SvobodovA?',
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

// JednorazovA? odstrA?nenie demo Asloh a vypnutie automatickA?ho seedovania
if (typeof window !== 'undefined') {
  try {
    const cleanupFlagKey = 'tasks_demo_cleanup_done';
    const alreadyCleaned = localStorage.getItem(cleanupFlagKey) === 'true';
    if (!alreadyCleaned) {
      const stored = localStorage.getItem('allTasks');
      if (stored) {
        const tasks: Task[] = JSON.parse(stored);
        const demoTitles = new Set([
          'Dokon?TiLA vA?ro?TnAs sprA?vu 2024',
          'OveriLA DPH priznanie Q4',
          'AktualizovaLA firemnA? Asdaje'
        ]);
        const filtered = tasks.filter(t => !(
          demoTitles.has(t.title) &&
          t.companyName === 'Test Firma s.r.o.' &&
          t.createdBy === 'Admin'
        ));
        if (filtered.length !== tasks.length) {
          localStorage.setItem('allTasks', JSON.stringify(filtered));
        }
      }
      localStorage.setItem(cleanupFlagKey, 'true');
    }
  } catch (e) {
    // ignore cleanup errors
  }

  // Seed predvolenA?ch Asloh len ak je explicitne povolenA? cez env premennAs
  if (process.env.REACT_APP_ENABLE_DEMO_DATA === 'true') {
    taskService.initializeDefaultTasks();
  }
}


