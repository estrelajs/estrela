import { EventEmitter, styled } from 'estrela';

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export interface TodoProps {
  todo: TodoItem;
  complete: EventEmitter<boolean>;
  remove: EventEmitter<TodoItem>;
}

function Todo({ todo, complete, remove }: TodoProps) {
  let completed = todo.completed;

  completed$.subscribe((value: boolean) => {
    complete.emit(value);
  });

  return (
    <div class="todo">
      <input type="checkbox" bind={completed$} />
      <span class:completed={completed}>{todo.text}</span>
      <button on:click={() => remove?.emit(todo)}>🗑️</button>
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
