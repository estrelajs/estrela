import { EventEmitter, getState, styled } from 'estrela';
import { TodoData } from './Todo.model';

export interface TodoProps {
  todo: TodoData;
  complete: EventEmitter<boolean>;
  remove: EventEmitter<TodoData>;
}

function Todo({ todo, complete, remove }: TodoProps) {
  let completed = todo.completed;

  getState(completed).subscribe(value => {
    complete.emit(value);
  });

  return (
    <div class="todo">
      <input type="checkbox" bind={getState(completed)} />
      <span class:completed={completed}>{todo.text}</span>
      <button on:click={() => remove?.emit(todo)}>🗑️</button>
    </div>
  );
}

export default styled(Todo)/* css */ `
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
