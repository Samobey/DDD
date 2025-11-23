import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-control-flow-demo',
  templateUrl: './control-flow-demo.component.html',
  styleUrl: './control-flow-demo.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class ControlFlowDemoComponent {
  filter = signal<'all' | 'pending' | 'completed'>('all');
  
  todos = signal<Todo[]>([]);

  todoCount = () => this.todos().length;
  pendingCount = () => this.todos().filter(t => !t.completed).length;
  completedCount = () => this.todos().filter(t => t.completed).length;

  filteredTodos = () => {
    const todos = this.todos();
    switch (this.filter()) {
      case 'completed':
        return todos.filter(t => t.completed);
      case 'pending':
        return todos.filter(t => !t.completed);
      default:
        return todos;
    }
  };

  private nextId = 1;

  constructor() {
    // Add some initial todos
    this.addSampleTodo();
    this.addSampleTodo();
  }

  addSampleTodo() {
    const sampleTitles = [
      'Learn Angular 19 Signals',
      'Explore SSR Features',
      'Master Control Flow',
      'Implement Hydration',
      'Build Demo Application',
      'Optimize Performance',
      'Write Unit Tests',
      'Deploy to Production'
    ];

    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

    const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];

    this.todos.update(todos => [
      ...todos,
      {
        id: this.nextId++,
        title: randomTitle,
        completed: false,
        priority: randomPriority
      }
    ]);
  }

  toggleTodo(id: number) {
    this.todos.update(todos =>
      todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  removeTodo(id: number) {
    this.todos.update(todos => todos.filter(t => t.id !== id));
  }

  toggleFilter(newFilter: 'all' | 'pending' | 'completed') {
    this.filter.set(newFilter);
  }
}
