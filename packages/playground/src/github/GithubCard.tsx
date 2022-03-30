import { Component, EventEmitter } from 'estrela';
import Button from './Button';
import styles from './GithubCard.module.css';
import { Repository } from './repository';

interface GithubCardProps {
  item: Repository;
  remove: EventEmitter<Repository>;
}

const GithubCard: Component<GithubCardProps> = ({ item, remove }) => {
  return (
    <div class={styles.card}>
      <div>
        <a href={item().html_url} target="_blank">
          {item().full_name}
        </a>
        🌟<strong>{item().stargazers_count}</strong>
      </div>
      <p>{item().description}</p>
      <Button on:click={() => remove.next(item())}>
        Remove
        <div slot="test">test</div>
      </Button>
    </div>
  );
};

export default GithubCard;
