const socket = io();

document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const product = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        code: document.getElementById('code').value,
        price: document.getElementById('price').value,
        stock: document.getElementById('stock').value,
        category: document.getElementById('category').value,
    };

    socket.emit('newProduct', product);
});

socket.on('updateProducts', (products) => {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    products.forEach((product) => {
        productList.innerHTML += `<li>${product.title} - $${product.price} <button onclick="deleteProduct(${product.id})">Eliminar</button></li>`;
    });
});

function deleteProduct(id) {
    socket.emit('deleteProduct', id);
}