const request = require('supertest');
const express = require('express');
const cors = require('cors');

// App de prueba sin DB
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: true });
});

app.get('/api/productos', (req, res) => {
  res.json([]);
});

app.post('/api/productos', (req, res) => {
  const { nombre, precio, stock } = req.body;
  if (!nombre || precio == null || stock == null) {
    return res.status(400).json({ message: 'Nombre, precio y stock son obligatorios.' });
  }
  res.status(201).json({ id: 1, nombre, precio, stock });
});

// Tests
describe('API Tienda Tech', () => {
  test('GET /api/health - responde ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/productos - retorna array', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/productos - crea producto válido', async () => {
    const res = await request(app).post('/api/productos').send({
      nombre: 'Test Product',
      descripcion: 'Descripción test',
      precio: 9990,
      stock: 5
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.nombre).toBe('Test Product');
  });

  test('POST /api/productos - falla sin nombre', async () => {
    const res = await request(app).post('/api/productos').send({
      precio: 9990,
      stock: 5
    });
    expect(res.statusCode).toBe(400);
  });
});