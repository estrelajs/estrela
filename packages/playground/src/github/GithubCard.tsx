import { Output } from 'estrela';
import Button from './Button';
import styles from './GithubCard.module.css';
import { Repository } from './repository';

interface GithubCardProps {
  item: Repository;
  remove: Output<Repository>;
}

function GithubCard(this: GithubCardProps) {
  return (
    <div class={styles.card}>
      <div>
        <a href={this.item.html_url} target="_blank">
          {this.item.full_name}
        </a>
        <span>🌟</span>
        <strong>{this.item.stargazers_count}</strong>
      </div>
      <p>{this.item.description}</p>
      <Button on:click={() => this.remove(this.item)}>Remove</Button>
    </div>
  );
}

export default GithubCard;
