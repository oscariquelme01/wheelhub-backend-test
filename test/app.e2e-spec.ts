import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersModule (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let userId1: number;
  let userId2: number;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // usa sqlite :memory:

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users → crea un usuario válido', async () => {
    const res = await request(server)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com', isActive: true })
      .expect(201);
    userId1 = res.body.id;
    expect(res.body.name).toBe('Alice');
  });

  it('POST /users → no permite crear dos usuarios con el mismo email', async () => {
    await request(server)
      .post('/users')
      .send({ name: 'Bob', email: 'alice@example.com' })
      .expect(400);
  });

  it('POST /users → valida campos obligatorios', async () => {
    await request(server).post('/users').send({ email: 'no-name@example.com' }).expect(400);
    await request(server).post('/users').send({ name: 'NoEmail' }).expect(400);
  });

  it('POST /users → valida formato de email', async () => {
    await request(server).post('/users').send({ name: 'Test', email: 'invalid' }).expect(400);
  });

  it('GET /users → lista usuarios', async () => {
    const res = await request(server).get('/users').expect(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /users/:id → devuelve un usuario existente', async () => {
    const res = await request(server).get(`/users/${userId1}`).expect(200);
    expect(res.body.id).toBe(userId1);
  });

  it('GET /users/:id → 404 si el usuario no existe', async () => {
    await request(server).get('/users/999').expect(404);
  });

  it('PATCH /users/:id → actualiza un usuario', async () => {
    const res = await request(server)
      .patch(`/users/${userId1}`)
      .send({ name: 'Alice Updated' })
      .expect(200);
    expect(res.body.name).toBe('Alice Updated');
  });

  it('PATCH /users/:id → no permite actualizar a email duplicado', async () => {
    // Crear un segundo usuario
    const res2 = await request(server)
      .post('/users')
      .send({ name: 'Bob', email: 'bob@example.com' })
      .expect(201);
    userId2 = res2.body.id;

    // Intentar actualizar Bob con email de Alice
    await request(server)
      .patch(`/users/${userId2}`)
      .send({ email: 'alice@example.com' })
      .expect(400);
  });

  it('PATCH /users/:id → 404 si el usuario no existe', async () => {
    await request(server).patch('/users/999').send({ name: 'NoOne' }).expect(404);
  });

  it('PATCH /users/:id → valida formato de campos', async () => {
    await request(server).patch(`/users/${userId1}`).send({ email: 'invalid' }).expect(400);
  });

  it('DELETE /users/:id → elimina un usuario existente', async () => {
    await request(server).delete(`/users/${userId1}`).expect(200);
    await request(server).get(`/users/${userId1}`).expect(404);
  });

  it('DELETE /users/:id → 404 si el usuario no existe', async () => {
    await request(server).delete(`/users/999`).expect(404);
  });
});
