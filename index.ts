import 'dotenv/config';
import { Bot } from '@skyware/bot';
import { readFileSync, writeFileSync } from 'fs';
import cron from 'node-cron';
import lyrics from './flat-song-lyrics.json' assert { type: 'json' };

const username = process.env.BLUESKY_USERNAME;
const password = process.env.BLUESKY_PASSWORD;
const postedLyricsListPath = process.env.POSTED_LYRICS_LIST_PATH ?? './postedLyrics.txt';

if (!username || !password) throw new Error('BLUESKY_USERNAME and BLUESKY_PASSWORD must be set');

const readFileOrReturnEmptyArray = (path: string) => {
  try {
    return readFileSync(path, 'utf8').split('\n');
  } catch {
    return [];
  }
};

const lyricsArray = Object.values(lyrics);
const lyricsPosted = readFileOrReturnEmptyArray(postedLyricsListPath);

const getRandomUnpostedLyric = () => {
  const word = lyricsArray[Math.floor(Math.random() * lyricsArray.length)];
  if (lyricsPosted.includes(word)) return getRandomUnpostedLyric();
  return word;
};

const writePostedLyrics = (lyric: string) => {
  lyricsPosted.push(lyric);
  writeFileSync(postedLyricsListPath, lyricsPosted.join('\n'), 'utf8');
};

const bot = new Bot();

const postLyrics = async () => {
  const lyric = getRandomUnpostedLyric();
  try {
    writePostedLyrics(lyric);

    console.info(`posting lyric: ${lyric}`);
    await bot.post({
      text: lyric,
    });
  } catch (error) {
    console.error(`error posting lyric: ${lyric}`, error);
  }
};

const main = async () => {
  await bot.login({
    identifier: username,
    password: password,
  });

  console.info(`using ${postedLyricsListPath} to track posted lyrics`);

  bot.on('error', (error) => {
    console.error(`error: ${error}`);
  });

  console.info(`bot logged in as ${username}`);

  // every 1 hour
  cron.schedule('0 * * * *', postLyrics);
};

main().catch(console.error);
