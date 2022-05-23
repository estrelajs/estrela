import { EventEmitter, Ref, setRef, State, styled } from 'estrela';
import { TodoData } from './Todo.model';

export interface TodoProps {
  todo: TodoData;
  complete: EventEmitter<boolean>;
  remove: EventEmitter<TodoData>;
  ref?: Ref<TodoRef>;
}

export interface TodoRef {
  doSomething(): void;
}

function Todo({ todo, complete, remove }: TodoProps) {
  let completed = todo.completed;

  (completed$ as State<boolean>).subscribe(value => {
    complete.emit(value);
  });

  setRef<TodoRef>({
    doSomething() {
      console.log('logged to console!');
    },
  });

  return (
    <div class="todo">
      <input type="checkbox" bind={completed$} />
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
