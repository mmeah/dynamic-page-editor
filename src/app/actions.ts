'use server';

import { promises as fs } from 'fs';
import path from 'path';

export async function loadLocalConfig(filePath: string) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContents = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    return null;
  }
}