import fastify from 'fastify';
import { env } from './env';
import { transactionsRoutes } from './routes/transactionsRoutes';
import cookie from '@fastify/cookie';

export const app = fastify();

app.register(cookie);
app.register(transactionsRoutes, {
  prefix: 'transactions',
});
