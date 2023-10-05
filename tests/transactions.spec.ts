import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../src/app';
import { execSync } from 'child_process';
import { beforeEach } from 'node:test';

describe('Transactions', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    execSync('npm run knex -- migrate:rollback --all');
    execSync('npm run knex -- migrate:latest');
  });

  it('User can create a new transaction', async () => {
    await supertest(app.server)
      .post('/transactions')
      .send({
        title: 'Test transaction',
        amount: 500,
        type: 'credit',
      })
      .expect(201);
  });

  it('should be possible to list all transactions', async () => {
    const createTransactionResponse = await supertest(app.server)
      .post('/transactions')
      .send({
        title: 'Test transaction',
        amount: 500,
        type: 'credit',
      });

    const cookies = createTransactionResponse.get('Set-Cookie');

    const listTransactionsResponse = await supertest(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200);

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'Test transaction',
        amount: 500,
      }),
    ]);
  });

  it('should be possible to list a specific transaction', async () => {
    const createTransactionResponse = await supertest(app.server)
      .post('/transactions')
      .send({
        title: 'Test transaction',
        amount: 500,
        type: 'credit',
      });

    const cookies = createTransactionResponse.get('Set-Cookie');

    const listTransactionsResponse = await supertest(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200);

    const transactionId = listTransactionsResponse.body.transactions[0].id;

    const getTransactionsResponse = await supertest(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200);

    expect(getTransactionsResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'Test transaction',
        amount: 500,
      })
    );
  });

  it('should be possible to get sum of amount of transactions', async () => {
    const createTransactionResponse = await supertest(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 500,
        type: 'credit',
      });

    const cookies = createTransactionResponse.get('Set-Cookie');

    await supertest(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 200,
        type: 'debit',
      });

    const getTransactionsResponse = await supertest(app.server)
      .get(`/transactions/summary`)
      .set('Cookie', cookies)
      .expect(200);

    expect(getTransactionsResponse.body.summary).toEqual({ amount: 300 });
  });
});
