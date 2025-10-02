import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersModule (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let createdUserId: number;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // activa sqlite :memory:

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

  it('POST /users → crea un usuario', async () => {
    const res = await request(server)
      .post('/users')
      .send({ name: 'John Doe', email: 'john@example.com' })
      .expect(201);

    createdUserId = res.body.id;
  });

  it('GET /users → lista usuarios', async () => {
    const res = await request(server).get('/users').expect(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /users/:id → devuelve un usuario', async () => {
    const res = await request(server)
      .get(`/users/${createdUserId}`)
      .expect(200);
    expect(res.body.id).toBe(createdUserId);
  });

  it('PATCH /users/:id → actualiza un usuario', async () => {
    const res = await request(server)
      .patch(`/users/${createdUserId}`)
      .send({ name: 'Jane Doe' })
      .expect(200);

    expect(res.body.name).toBe('Jane Doe');
  });

  it('DELETE /users/:id → elimina un usuario', async () => {
    await request(server).delete(`/users/${createdUserId}`).expect(200);
    await request(server).get(`/users/${createdUserId}`).expect(404);
  });

  it('POST /users → no permite crear dos usuarios con el mismo email', async () => {
    // Creamos el primer usuario
    const res1 = await request(server)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201);

    // Intentamos crear otro usuario con el mismo email
    const res2 = await request(server)
      .post('/users')
      .send({ name: 'Bob', email: 'alice@example.com' })
      .expect(400); // o 409 si lanzas conflicto en tu servicio

    // Revisamos que el error contenga algo sobre email duplicado
    expect(res2.body).toHaveProperty('message');
    expect(res2.body.message).toMatch(/email/i);
  });
});
