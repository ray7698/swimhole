import type {IncomingMessage, ServerResponse} from 'node:http';
import {createSwimHoleStore} from './_lib/storage.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const records = await createSwimHoleStore().list();
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(records));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unable to load swim holes.',
      }),
    );
  }
}
