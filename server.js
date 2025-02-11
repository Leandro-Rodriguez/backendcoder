const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 8080;
const PRODUCTS_FILE = path.join(__dirname, 'productos.json');
const CARTS_FILE = path.join(__dirname, 'carrito.json');

// Utility Functions
const readFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

const generateId = (items) => {
  return items.length > 0 ? items[items.length - 1].id + 1 : 1;
};

// Products Router
const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
  const { limit } = req.query;
  const products = await readFile(PRODUCTS_FILE);
  res.json(limit ? products.slice(0, Number(limit)) : products);
});

productsRouter.get('/:pid', async (req, res) => {
  const { pid } = req.params;
  const products = await readFile(PRODUCTS_FILE);
  const product = products.find((p) => p.id === Number(pid));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

productsRouter.post('/', async (req, res) => {
  const { title, description, code, price, stock, category, thumbnails = [] } = req.body;
  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ error: 'All fields except thumbnails are required' });
  }

  const products = await readFile(PRODUCTS_FILE);
  const newProduct = {
    id: generateId(products),
    title,
    description,
    code,
    price,
    status: true,
    stock,
    category,
    thumbnails,
  };
  products.push(newProduct);
  await writeFile(PRODUCTS_FILE, products);
  res.status(201).json(newProduct);
});

productsRouter.put('/:pid', async (req, res) => {
  const { pid } = req.params;
  const updates = req.body;
  const products = await readFile(PRODUCTS_FILE);
  const productIndex = products.findIndex((p) => p.id === Number(pid));

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (updates.id) {
    return res.status(400).json({ error: 'ID cannot be updated' });
  }

  products[productIndex] = { ...products[productIndex], ...updates };
  await writeFile(PRODUCTS_FILE, products);
  res.json(products[productIndex]);
});

productsRouter.delete('/:pid', async (req, res) => {
  const { pid } = req.params;
  const products = await readFile(PRODUCTS_FILE);
  const filteredProducts = products.filter((p) => p.id !== Number(pid));

  if (products.length === filteredProducts.length) {
    return res.status(404).json({ error: 'Product not found' });
  }

  await writeFile(PRODUCTS_FILE, filteredProducts);
  res.status(204).send();
});

// Carts Router
const cartsRouter = express.Router();

cartsRouter.post('/', async (req, res) => {
  const carts = await readFile(CARTS_FILE);
  const newCart = {
    id: generateId(carts),
    products: [],
  };
  carts.push(newCart);
  await writeFile(CARTS_FILE, carts);
  res.status(201).json(newCart);
});

cartsRouter.get('/:cid', async (req, res) => {
  const { cid } = req.params;
  const carts = await readFile(CARTS_FILE);
  const cart = carts.find((c) => c.id === Number(cid));
  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).json({ error: 'Cart not found' });
  }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
  const { cid, pid } = req.params;
  const carts = await readFile(CARTS_FILE);
  const products = await readFile(PRODUCTS_FILE);

  const cart = carts.find((c) => c.id === Number(cid));
  if (!cart) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  const product = products.find((p) => p.id === Number(pid));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const productInCart = cart.products.find((p) => p.product === Number(pid));
  if (productInCart) {
    productInCart.quantity += 1;
  } else {
    cart.products.push({ product: Number(pid), quantity: 1 });
  }

  await writeFile(CARTS_FILE, carts);
  res.status(201).json(cart);
});

// Register Routers
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const cors = require('cors');
app.use(cors());