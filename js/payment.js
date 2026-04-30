document.addEventListener('DOMContentLoaded', () => {
  const payBtn = document.getElementById('pay-btn');
  if (!payBtn) return;

  payBtn.addEventListener('click', async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const statusDiv = document.getElementById('payment-status');

    if (!userInfo || cart.length === 0) return;

    try {
      payBtn.textContent = 'Processing...';
      payBtn.disabled = true;

      // Calculate total
      let total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      
      // Prepare items for backend
      const items = cart.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        price: item.price
      }));

      // 1. Create Order on Backend
      const res = await fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ items, total })
      });

      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_test_YOUR_KEY_ID', // Remember to set correct key or inject dynamically
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'Snacks.',
        description: 'Premium Traditional Snacks',
        order_id: orderData.order.id, // Razorpay Order ID
        handler: async function (response) {
          // 3. Verify Payment on Backend
          try {
            statusDiv.textContent = 'Verifying payment...';
            statusDiv.style.color = 'blue';

            const verifyRes = await fetch(`${API_URL}/orders/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                mongoOrderId: orderData.mongoOrderId
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              statusDiv.textContent = 'Payment Successful! Order placed.';
              statusDiv.style.color = 'green';
              localStorage.removeItem('cart'); // Clear cart
              setTimeout(() => {
                window.location.href = 'index.html'; // Redirect to home
              }, 2000);
            } else {
              statusDiv.textContent = 'Payment Verification Failed.';
              statusDiv.style.color = 'red';
            }
          } catch (error) {
            console.error('Verification Error', error);
            statusDiv.textContent = 'Error verifying payment.';
            statusDiv.style.color = 'red';
          }
        },
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
        },
        theme: {
          color: '#f97316'
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response){
        statusDiv.textContent = 'Payment Failed.';
        statusDiv.style.color = 'red';
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      statusDiv.textContent = 'Error initiating payment.';
      statusDiv.style.color = 'red';
    } finally {
      payBtn.textContent = 'Pay with Razorpay';
      payBtn.disabled = false;
    }
  });
});
