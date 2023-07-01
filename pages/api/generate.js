import { Configuration, OpenAIApi } from "openai";
import axios from 'axios';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


async function getWeeklyStockData(ticker) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const functionParam = 'TIME_SERIES_WEEKLY';
  const datatype = 'json';
  const url = `https://www.alphavantage.co/query?function=${functionParam}&symbol=${ticker}&datatype=${datatype}&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    if (data.Note) {
      throw new Error(data.Note);
    }

    const mostRecentDataPoint = Object.keys(data['Weekly Time Series'])[0];
    const mostRecentData = data['Weekly Time Series'][mostRecentDataPoint];

    const open = mostRecentData['1. open'];
    const high = mostRecentData['2. high'];
    const low = mostRecentData['3. low'];
    const close = mostRecentData['4. close'];
    const volume = mostRecentData['5. volume'];

    return { ticker, open, high, low, close, volume };

  } catch (error) {
    throw error;
  }
}

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const ticker = req.body.ticker || '';
  if (ticker.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid stock symbol",
      }
    });
    return;
  }

  try {
    const stockData = await getWeeklyStockData(ticker); 
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(stockData),
      temperature: 0.6,
      max_tokens: 200,
    });
    res.status(200).json({ result: completion.data.choices[0].text });
  } catch(error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
}

function generatePrompt(stockData) {
  const { ticker, open, high, low, close, volume } = stockData;
  return `Given the historical weekly trend, the current price of ${close}, volume of ${volume}, opening price of ${open}, highest price of ${high}, and lowest price of ${low} for ${ticker}, analyze the price movement and volatility, and provide a detailed trading signal with speculative buy, sell, and stop loss targets.`;
}
