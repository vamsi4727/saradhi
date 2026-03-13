import axios from 'axios';

const baseURL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function fetchStock(symbol) {
  const { data } = await axios.get(`${baseURL}/stocks/${encodeURIComponent(symbol)}`);
  return data;
}

export async function fetchMF(schemeCode) {
  const { data } = await axios.get(`${baseURL}/mf/${schemeCode}`);
  return data;
}

export async function fetchSentiment(query) {
  const { data } = await axios.get(`${baseURL}/sentiment/${encodeURIComponent(query)}`);
  return data;
}

export async function fetchFDRates() {
  const { data } = await axios.get(`${baseURL}/fd/rates`);
  return data;
}

export async function searchAssets(q) {
  const { data } = await axios.get(`${baseURL}/search`, { params: { q } });
  return data;
}
