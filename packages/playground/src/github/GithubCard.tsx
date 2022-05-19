import { EventEmitter } from 'estrela';
import Button from './Button';
import styles from './GithubCard.module.css';
import { Repository } from './repository';

interface GithubCardProps {
  item: Repository;
  remove: EventEmitter<Repository>;
}

function GithubCard(props: GithubCardProps) {
  return (
    <div class={styles.card}>
      <div>
        <a href={() => props.item.html_url} target="_blank">
          {() => props.item.full_name}
        </a>
        🌟<strong>{() => props.item.stargazers_count}</strong>
      </div>
      <p>{() => props.item.description}</p>
      <Button on:click={() => props.remove.next(props.item)}>Remove</Button>
    </div>
  );
}

export default GithubCard;
