import styles from './App.module.css';
import { apiBaseUrl } from './config';

export function App() {
  return (
    <main className={styles.root}>
      <h1 className={styles.title}>HouseHoldHub</h1>
      <p className={styles.meta}>API: {apiBaseUrl || 'not configured'}</p>
    </main>
  );
}
