import { effect, signal, styled } from 'estrela';
import Todo, { TodoItem } from './Todo';

function App() {
  const todos = signal<TodoItem[]>([]);
  const todoText = signal('');
  let id = 0;

  const storeTodo = localStorage.getItem('todos');
  if (storeTodo) {
    todos.set(JSON.parse(storeTodo));
    id = todos().reduce((max, todo) => Math.max(max, todo.id + 1), 0);
  }

  effect(() => {
    localStorage.setItem('todos', JSON.stringify(todos()));
  });

  const addTodo = () => {
    if (!!todoText()) {
      const todo: TodoItem = {
        id: id++,
        text: todoText(),
        completed: false,
      };
      todos.mutate(todos => todos.push(todo));
      todoText.set('');
    }
  };

  const completeTodo = (id: number) => (completed: boolean) => {
    todos.mutate(todos => {
      const todo = todos.find(todo => todo.id === id);
      if (todo) {
        todo.completed = completed;
      }
    });
  };

  const removeTodo = (id: number) => () => {
    todos.update(todos => todos.filter(t => t.id !== id));
  };

  return (
    <>
      <div class="header">
        <h1>Estrela Todo App</h1>
      </div>
      <div class="container">
        <div class="add-todo">
          <input
            placeholder="Enter todo"
            bind={todoText}
            on:keydown={e => e.key === 'Enter' && addTodo()}
          />
          <button disabled={!todoText} on:click={addTodo}>
            ➕
          </button>
        </div>
        <div class="todos" class:empty={todos.length === 0}>
          {todos().map(todo => (
            <Todo
              key={todo.id}
              todo={todo}
              on:complete={completeTodo(todo.id)}
              on:remove={removeTodo(todo.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default styled(App)`
  .header {
    display: flex;
    justify-content: center;
    background-color: #009dff;
    padding: 20px;
    height: 80px;

    h1 {
      color: white;
      margin: 0;
    }
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 500px;
    padding: 20px;
    margin: 0 auto;

    .add-todo {
      display: flex;
      align-items: stretch;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: hidden;
      height: 40px;

      input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 0 10px;
      }

      button {
        border: none;
        cursor: pointer;
        width: 40px;
      }
    }

    .todos {
      display: flex;
      flex-direction: column;
      margin-top: 10px;

      &:not(.empty) {
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    }
  }
`;
