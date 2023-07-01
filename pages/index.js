import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [tickerInput, setTickerInput] = useState("");
  const [result, setResult] = useState();

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker: tickerInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      setResult(data.result);
      setTickerInput("");
    } catch(error) {
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div>
      <Head>
        <title>OpenAI Quickstart</title>
        <link rel="icon" href="/stock.png" />
      </Head>

      <main className={styles.main}>
        <img src="/stock2.png" className={styles.icon} />
        <h3>Trading Signal Generator</h3>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="ticker"
            placeholder="Enter a stock symbol"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
          />
          <input type="submit" value="Generate Signal" />
        </form>
        <div className={styles.result}>{result}</div>
      </main>
    </div>
  );
}
