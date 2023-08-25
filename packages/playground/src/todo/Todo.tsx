import { Output, effect, signal, styled } from 'estrela';

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export interface TodoProps {
  todo: TodoItem;
  complete: Output<boolean>;
  remove: Output<TodoItem>;
}

function Todo(this: TodoProps) {
  const completed = signal(this.todo.completed);

  effect(() => {
    this.complete(completed());
  });

  return (
    <div class="todo">
      <input bind={completed} name="todo-item" type="checkbox" />
      <span class:completed={completed()}>{this.todo.text}</span>
      <button on:click={() => this.remove?.(this.todo)}>🗑️</button>
    </div>
  );
}

export default styled(Todo)`
  .todo {
    display: flex;
    align-items: center;
    column-gap: 8px;
    padding: 14px;

    + .todo {
      border-top: 1px solid #ccc;
    }

    span {
      flex: 1;

      &.completed {
        text-decoration: line-through;
      }
    }

    input {
      cursor: pointer;
    }

    button {
      border: none;
      background: none;
      cursor: pointer;
    }
  }
`;
