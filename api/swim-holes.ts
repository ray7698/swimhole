import {createSwimHoleStore} from '../server/storage';

export const config = {
  runtime: 'nodejs',
};

export default {
  async fetch() {
    try {
      const records = await createSwimHoleStore().list();
      return Response.json(records);
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Unable to load swim holes.',
        },
        {status: 500},
      );
    }
  },
};
