// fetchAndSave.js

import dotenv from 'dotenv';
dotenv.config();

import { writeFileSync } from 'fs';

// ====== CONFIG ======
const BASE_URL = process.env.VITE_API_BASE_URL;
const OPENAPI_URL = new URL('/openapi.json', BASE_URL);
const WEBSOCKET_URL = new URL('/websocket-contracts.json', BASE_URL);
const OPENAPI_JSON_PATH = './src/api/openapi.json';
const WEBSOCKET_JSON_PATH = './src/api/websocket/websocket-contracts.json';
// ====================

/**
 * @param {string | URL | Request} url
 * @param {import("fs").PathOrFileDescriptor} outputFilePath
 */
async function fetchAndSave(url, outputFilePath) {
  const response = await fetch(url);
  const data = await response.text();
  writeFileSync(outputFilePath, data, 'utf-8');
}

(async () => {
  if (!BASE_URL) {
    console.error('❌ VITE_API_BASE_URL is not defined in .env file');
    process.exit(1);
  }

  console.log('⏳ Fetching data from:', BASE_URL);
  await fetchAndSave(OPENAPI_URL, OPENAPI_JSON_PATH);
  console.log(`✅ OpenAPI JSON saved successfully to ${OPENAPI_JSON_PATH}`);

  await fetchAndSave(WEBSOCKET_URL, WEBSOCKET_JSON_PATH);
  console.log(`✅ WebSocket JSON saved successfully to ${WEBSOCKET_JSON_PATH}`);

})();
