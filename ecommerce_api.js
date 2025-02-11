const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 8080;
const PRODUCTS_FILE = path.join(__dirname, 'productos.json');
const CARTS_FILE = path.join(__dirname, 'carrito.json');

// Configuración de Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public')); // Para archivos estáticos como CSS o JS

// Cargar productos
const readFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Guardar productos
const writeFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Generar ID único
const generateId = (items) => {
  return items.length > 0 ? items[items.length - 1].id + 1 : 1;
};

// Rutas de vistas
app.get('/', async (req, res) => {
  const products = await readFile(PRODUCTS_FILE);
  res.render('home', { products });
});

app.get('/realtimeproducts', async (req, res) => {
  const products = await readFile(PRODUCTS_FILE);
  res.render('realTimeProducts', { products });
});

// Configuración de WebSockets
io.on('connection', (socket) => {
  console.log('Usuario conectado');

  socket.on('newProduct', async (product) => {
    const products = await readFile(PRODUCTS_FILE);
    const newProduct = { id: generateId(products), ...product };
    products.push(newProduct);
    await writeFile(PRODUCTS_FILE, products);

    io.emit('updateProducts', products);
  });

  socket.on('deleteProduct', async (id) => {
    let products = await readFile(PRODUCTS_FILE);
    products = products.filter((p) => p.id !== id);
    await writeFile(PRODUCTS_FILE, products);

    io.emit('updateProducts', products);
  });
});

app.listen(8080, () => {
    console.log('Servidor corriendo en http://localhost:8080');
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});