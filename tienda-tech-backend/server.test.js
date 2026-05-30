const request = require("supertest");
const express = require("express");
const cors = require("cors");

// ── Mock de mysql2/promise ──────────────────────────────────────────────────
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockPing = jest.fn().mockResolvedValue(true);
const mockGetConnection = jest.fn().mockResolvedValue({
  ping: mockPing,
  release: mockRelease,
});

jest.mock("mysql2/promise", () => ({
  createPool: jest.fn(() => ({
    query: mockQuery,
    getConnection: mockGetConnection,
  })),
}));

// ── Reconstruir la app igual que server.js pero sin el bloque de arranque ───
const mysql = require("mysql2/promise");

const app = express();
app.use(cors({
  origin: "http://localhost:8080",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

const pool = mysql.createPool({});

function handleError(res, error, message = "Error interno del servidor") {
  console.error(error);
  res.status(500).json({ message });
}

function validateProductoInput({ nombre, precio, stock }) {
  if (!nombre || precio == null || stock == null) {
    return { ok: false, message: "Nombre, precio y stock son obligatorios." };
  }
  const precioNum = Number(precio);
  const stockNum = Number(stock);
  if (!Number.isFinite(precioNum) || precioNum < 0)
    return { ok: false, message: "Precio inválido." };
  if (!Number.isInteger(stockNum) || stockNum < 0)
    return { ok: false, message: "Stock inválido (debe ser entero >= 0)." };
  return { ok: true, precioNum, stockNum };
}

app.get("/api/productos", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, descripcion, precio, stock FROM productos ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    handleError(res, err, "No se pudieron obtener los productos.");
  }
});

app.get("/api/productos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, descripcion, precio, stock FROM productos WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Producto no encontrado." });
    res.json(rows[0]);
  } catch (err) {
    handleError(res, err, "No se pudo obtener el producto.");
  }
});

app.post("/api/productos", async (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  const validation = validateProductoInput({ nombre, precio, stock });
  if (!validation.ok)
    return res.status(400).json({ message: validation.message });
  try {
    const [result] = await pool.query(
      "INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)",
      [nombre, descripcion || null, validation.precioNum, validation.stockNum]
    );
    const nuevoId = result.insertId;
    const [rows] = await pool.query(
      "SELECT id, nombre, descripcion, precio, stock FROM productos WHERE id = ?",
      [nuevoId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    handleError(res, err, "No se pudo crear el producto.");
  }
});

app.put("/api/productos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock } = req.body;
  const validation = validateProductoInput({ nombre, precio, stock });
  if (!validation.ok)
    return res.status(400).json({ message: validation.message });
  try {
    const [result] = await pool.query(
      "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?",
      [nombre, descripcion || null, validation.precioNum, validation.stockNum, id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado." });
    const [rows] = await pool.query(
      "SELECT id, nombre, descripcion, precio, stock FROM productos WHERE id = ?",
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    handleError(res, err, "No se pudo actualizar el producto.");
  }
});

app.delete("/api/productos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM productos WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado." });
    res.json({ message: "Producto eliminado correctamente." });
  } catch (err) {
    handleError(res, err, "No se pudo eliminar el producto.");
  }
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ status: "ok", db: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ status: "error", db: false });
  }
});

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockQuery.mockReset();
});

const producto = {
  id: 1,
  nombre: "Teclado Mecánico",
  descripcion: "RGB",
  precio: 59990,
  stock: 10,
};

describe("GET /api/productos", () => {
  test("retorna lista de productos", async () => {
    mockQuery.mockResolvedValueOnce([[producto]]);
    const res = await request(app).get("/api/productos");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].nombre).toBe("Teclado Mecánico");
  });

  test("maneja error de DB", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB error"));
    const res = await request(app).get("/api/productos");
    expect(res.status).toBe(500);
  });
});

describe("GET /api/productos/:id", () => {
  test("retorna producto existente", async () => {
    mockQuery.mockResolvedValueOnce([[producto]]);
    const res = await request(app).get("/api/productos/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  test("retorna 404 si no existe", async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).get("/api/productos/999");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/productos", () => {
  test("crea producto correctamente", async () => {
    mockQuery
      .mockResolvedValueOnce([{ insertId: 5 }])
      .mockResolvedValueOnce([[{ ...producto, id: 5 }]]);
    const res = await request(app).post("/api/productos").send({
      nombre: "Teclado Mecánico",
      descripcion: "RGB",
      precio: 59990,
      stock: 10,
    });
    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe("Teclado Mecánico");
  });

  test("retorna 400 si falta nombre", async () => {
    const res = await request(app).post("/api/productos").send({
      precio: 1000,
      stock: 5,
    });
    expect(res.status).toBe(400);
  });

  test("retorna 400 si precio es negativo", async () => {
    const res = await request(app).post("/api/productos").send({
      nombre: "Test",
      precio: -100,
      stock: 5,
    });
    expect(res.status).toBe(400);
  });

  test("retorna 400 si stock es negativo", async () => {
    const res = await request(app).post("/api/productos").send({
      nombre: "Test",
      precio: 100,
      stock: -1,
    });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/productos/:id", () => {
  test("actualiza producto correctamente", async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ ...producto, nombre: "Teclado Actualizado" }]]);
    const res = await request(app).put("/api/productos/1").send({
      nombre: "Teclado Actualizado",
      precio: 69990,
      stock: 8,
    });
    expect(res.status).toBe(200);
  });

  test("retorna 404 si producto no existe", async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put("/api/productos/999").send({
      nombre: "X",
      precio: 100,
      stock: 1,
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/productos/:id", () => {
  test("elimina producto correctamente", async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete("/api/productos/1");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminado/i);
  });

  test("retorna 404 si no existe", async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete("/api/productos/999");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/health", () => {
  test("retorna status ok", async () => {
    mockQuery.mockResolvedValueOnce([[{ ok: 1 }]]);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe(true);
  });

  test("retorna error si falla DB", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB down"));
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(500);
    expect(res.body.status).toBe("error");
  });
});