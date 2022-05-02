import { Props } from 'estrela';
import Button from './Button';
import styles from './GithubCard.module.css';
import { Repository } from './repository';

interface GithubCardProps {
  item: Repository;
  emitters: {
    remove: Repository;
  };
}

function GithubCard({ item, remove }: Props<GithubCardProps>) {
  return (
    <div class={styles.card}>
      <div>
        <a href={item().html_url} target="_blank">
          {item().full_name}
        </a>
        🌟<strong>{item().stargazers_count}</strong>
      </div>
      <p>{item().description}</p>
      <Button on:click={() => remove.next(item())}>Remove</Button>
    </div>
  );
}

export default GithubCard;
