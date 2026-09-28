import styles from "./App.module.css";
import { apiBaseUrl } from "./config/env";

function App() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>HouseHoldHub</p>
        <h1 className={styles.title}>Frontend foundation ready</h1>
        <p className={styles.description}>
          React 19, TypeScript and Vite are configured with native CSS Modules
          and custom-property design tokens.
        </p>
        <dl className={styles.statusList}>
          <div className={styles.statusRow}>
            <dt>API base URL</dt>
            <dd>{apiBaseUrl}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

export default App;
