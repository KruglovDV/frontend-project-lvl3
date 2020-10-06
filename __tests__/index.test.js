import { test, expect } from '@jest/globals';
import fs from 'fs';
import { dirname, join } from 'path';

import parseFeed from '../src/parser';

const getFixturePath = (filename) => {
  const path = join(dirname(__filename), '.', '__fixtures__', filename);
  return path;
};

const readFile = (filename) => fs.readFileSync(getFixturePath(filename), 'utf-8');

let feedText;
let feedJson;

beforeEach(() => {
  feedText = readFile('feed.txt');
  feedJson = JSON.parse(readFile('parsedFeed.json'));
});

test('should parse text to json', () => {
  expect(parseFeed(feedText)).toEqual(feedJson);
});
