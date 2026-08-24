type Row = Record<string, any>;

let idCounter = 1;
const tables: Record<string, Row[]> = { todos: [] };

export const webDb = {
  execAsync: async (_sql: string) => {},
  runAsync: async (query: string, params: any[]) => {
    const q = query.trim().toUpperCase();
    if (q.startsWith('INSERT INTO TODOS')) {
      tables.todos.push({
        id: idCounter++,
        title: params[0],
        completed: params[1],
        priority: params[2] ?? 1,
        due_date: params[3] ?? null,
      });
    } else if (q.startsWith('UPDATE TODOS SET COMPLETED')) {
      const row = tables.todos.find((r) => r.id === params[1]);
      if (row) row.completed = params[0];
    } else if (q.startsWith('DELETE FROM TODOS')) {
      tables.todos = tables.todos.filter((r) => r.id !== params[0]);
    }
  },
  getAllAsync: async <T>(_query: string): Promise<T[]> => {
    return [...tables.todos].reverse() as unknown as T[];
  },
};
