const API_URL = 'http://localhost:5000/api';

// Cart State
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function updateCartCount() {
  const countElement = document.getElementById('cart-count');
  if (countElement) {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    countElement.textContent = totalItems;
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(product) {
  const existingItem = cart.find(item => item._id === product._id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  alert(`${product.name} added to cart!`);
}

// Check Auth State
function checkAuth() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const authLink = document.getElementById('auth-link');
  
  if (authLink) {
    if (userInfo) {
      authLink.textContent = 'Logout';
      authLink.href = '#';
      authLink.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem('userInfo');
        window.location.reload();
      };
    } else {
      authLink.textContent = 'Login';
      authLink.href = 'login.html';
    }
  }
}

// Fetch Products
async function fetchProducts() {
  const container = document.getElementById('products-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();
    
    container.innerHTML = '';
    
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      // We pass the product object to the button via a data attribute
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <h3 class="product-title">${product.name}</h3>
          <div class="product-bottom">
            <span class="product-price">₹${product.price}</span>
            <button class="btn add-to-cart-btn" data-product='${JSON.stringify(product).replace(/'/g, "&#39;")}'>
              Add to Cart
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productData = JSON.parse(e.target.getAttribute('data-product'));
        addToCart(productData);
      });
    });

  } catch (error) {
    console.error('Error fetching products', error);
    container.innerHTML = '<p style="text-align:center; width:100%;">Failed to load products.</p>';
  }
}

// Render Cart Page
function renderCartPage() {
  const tableBody = document.getElementById('cart-table-body');
  const summary = document.getElementById('cart-summary');
  const emptyMsg = document.getElementById('empty-cart-msg');
  const totalPriceEl = document.getElementById('cart-total-price');
  
  if (!tableBody) return;

  if (cart.length === 0) {
    tableBody.parentElement.style.display = 'none';
    summary.style.display = 'none';
    emptyMsg.style.display = 'block';
    return;
  }

  tableBody.parentElement.style.display = 'table';
  summary.style.display = 'block';
  emptyMsg.style.display = 'none';

  tableBody.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="cart-flex">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div>
            <strong>${item.name}</strong><br>
            <small style="color:var(--text-light)">${item.category}</small>
          </div>
        </div>
      </td>
      <td>₹${item.price}</td>
      <td>
        <div class="cart-flex">
          <button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
        </div>
      </td>
      <td><strong>₹${itemTotal}</strong></td>
      <td>
        <button class="remove-btn" onclick="removeFromCart(${index})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  totalPriceEl.textContent = total;
}

function changeQuantity(index, change) {
  if (cart[index].quantity + change > 0) {
    cart[index].quantity += change;
    saveCart();
    renderCartPage();
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCartPage();
}

function proceedToCheckout() {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    alert('Please login to continue');
    window.location.href = 'login.html';
  } else {
    window.location.href = 'checkout.html';
  }
}

// Auth Forms Logic
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  checkAuth();

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('login-error');

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('userInfo', JSON.stringify(data));
          window.location.href = 'index.html';
        } else {
          errorDiv.textContent = data.message;
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Server error. Please try again.';
        errorDiv.style.display = 'block';
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('register-error');

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('userInfo', JSON.stringify(data));
          window.location.href = 'index.html';
        } else {
          errorDiv.textContent = data.message;
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Server error. Please try again.';
        errorDiv.style.display = 'block';
      }
    });
  }
});
