import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const products = [
  {
    id: 'dish-wash',
    name: 'Dish Wash Liquid Soap',
    size: '500ml bottle',
    price: 2400,
    image: '/assets/waelshopy-bottle.png',
    description: 'A bright, concentrated clean made with lime and citrus extracts.',
  },
]

const deliveryFee = 600

function App() {
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [stars, setStars] = useState(() => Number(localStorage.getItem('waelshopy-stars') || 0))
  const [checkoutStep, setCheckoutStep] = useState('basket')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [customerInfo, setCustomerInfo] = useState(() => {
    const saved = localStorage.getItem('waelshopy-customer')
    if (!saved) {
      return { name: '', phone: '', address: '', area: '' }
    }
    try {
      return { name: '', phone: '', address: '', area: '', ...JSON.parse(saved) }
    } catch {
      return { name: '', phone: '', address: '', area: '' }
    }
  })
  const [editingCustomer, setEditingCustomer] = useState(() => !localStorage.getItem('waelshopy-customer'))
  const [subscriptionFrequency, setSubscriptionFrequency] = useState('monthly')
  const [sendingOrder, setSendingOrder] = useState(false)

  const addToCart = (product) => {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id)
      if (existing) {
        return items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...items, { ...product, quantity: 1 }]
    })
    setNotice(`${product.name} added to your order`)
    setCartOpen(true)
    window.setTimeout(() => setNotice(''), 2400)
  }

  const updateQuantity = (id, delta) => {
    setCart((items) =>
      items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const completeOrder = () => {
    if (cart.length === 0) return
    const nextStars = stars + 3
    setStars(nextStars)
    localStorage.setItem('waelshopy-stars', String(nextStars))
    setCart([])
    setNotice('Order placed. You earned 3 stars!')
  }

  const sendOrderNotification = async () => {
    const paymentLabel =
      paymentMethod === 'card'
        ? 'Card payment'
        : paymentMethod === 'transfer'
          ? 'Bank transfer'
          : 'Cash on delivery'

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...customerInfo,
        payment: paymentLabel,
        items: cart.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
        subtotal,
        delivery: deliveryFee,
        total: subtotal + deliveryFee,
      }),
    })

    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      throw new Error(result.error || 'Order notification failed')
    }
  }

  const beginCheckout = () => setCheckoutStep('payment')

  const finishPayment = async (event) => {
    event.preventDefault()
    setSendingOrder(true)
    localStorage.setItem('waelshopy-customer', JSON.stringify(customerInfo))

    try {
      await sendOrderNotification()
      completeOrder()
      setCheckoutStep('basket')
      setEditingCustomer(false)
      setNotice('Order placed. Waelshopy has been notified.')
      window.setTimeout(() => setNotice(''), 4000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Order could not be placed. Please try again.'
      setNotice(
        message === 'Email service is not configured'
          ? 'Order paused: email service is not configured.'
          : 'Order could not be placed. Please try again.',
      )
    } finally {
      setSendingOrder(false)
    }
  }

  const closeOrder = () => {
    setCartOpen(false)
    setCheckoutStep('basket')
  }

  const startSubscription = () => {
    addToCart(products[0])
    setNotice(`${subscriptionFrequency === 'monthly' ? 'Monthly' : 'Every 2 months'} delivery added to your order`)
  }

  const redeemReward = () => {
    if (stars < 100) return
    const nextStars = stars - 100
    setStars(nextStars)
    localStorage.setItem('waelshopy-stars', String(nextStars))
    setCart([])
    setNotice('Reward redeemed. Your free product is ready!')
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Waelshopy home">
          <span className="brand-mark">W</span>
          <span>waelshopy</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#shop">Shop</a>
          <a href="#story">Why Waelshopy</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open order, ${cartCount} items`}>
          <span>Order</span>
          <b>{cartCount}</b>
        </button>
      </header>

      <main id="top">
        <section className="hero" id="shop">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> Fresh clean, made simple</p>
            <h1>
              Clean dishes.<br />
              <em>Clear mind.</em>
            </h1>
            <p className="hero-text">A little lime, a lot of clean. Waelshopy is your everyday dish wash liquid for a brighter kitchen and a lighter routine.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#products">Shop the clean <span>↘</span></a>
              <span className="delivery-note"><strong>Delivery fee ₦600</strong><br />to all destinations</span>
            </div>
            <div className="hero-stats">
              <div><strong>500</strong><span>ml of clean</span></div>
              <div><strong>98%</strong><span>plant-inspired</span></div>
              <div><strong>01</strong><span>easy choice</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="sun-disc" />
            <div className="floating-badge">Same-day delivery</div>
            <div className="image-frame">
              <img src="/assets/waelshopy-bottle.png" alt="Waelshopy lime and citrus dish wash bottle" />
            </div>
            <p className="bottle-caption">Lime + citrus extracts <span>•</span> 500ml</p>
            <div className="leaf leaf-one" />
            <div className="leaf leaf-two" />
          </div>
        </section>

        <section className="ticker" aria-label="Product benefits">
          <span>Powerful on grease</span><i>✳</i><span>Gentle on hands</span><i>✳</i><span>Fresh citrus finish</span><i>✳</i><span>Made for everyday</span>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The good stuff</p>
              <h2>Pick your perfect<br /><em>clean.</em></h2>
            </div>
            <p className="section-intro">One beautiful bottle for today. Set up a delivery rhythm that keeps you ready.</p>
          </div>

          <div className="product-grid">
            {products.map((product, index) => (
              <article className={`product-card ${index === 0 ? 'featured' : ''}`} key={product.id}>
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-info">
                  <div>
                    <p className="product-size">{product.size}</p>
                    <h3>{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                  </div>
                  <div className="product-buy">
                    <strong>₦{product.price.toFixed(2)}</strong>
                    <button onClick={() => addToCart(product)} aria-label={`Add ${product.name} to order`}>
                      Add <span>+</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="subscription-card">
            <div className="subscription-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> Never run out</p>
              <h3>Make clean<br /><em>a habit.</em></h3>
              <p>Get your Waelshopy bottle delivered on your schedule and keep the sink feeling fresh.</p>
              <div className="subscription-perks">
                <span>✓ Save time</span>
                <span>✓ Cancel anytime</span>
                <span>✓ Earn 3 stars</span>
              </div>
            </div>
            <div className="subscription-action">
              <p>Deliver every</p>
              <div className="frequency-options">
                <button className={subscriptionFrequency === 'monthly' ? 'active' : ''} onClick={() => setSubscriptionFrequency('monthly')}>Month</button>
                <button className={subscriptionFrequency === 'bi-monthly' ? 'active' : ''} onClick={() => setSubscriptionFrequency('bi-monthly')}>2 months</button>
              </div>
              <button className="subscribe-button" onClick={startSubscription}>Start subscription <span>↗</span></button>
            </div>
          </div>
        </section>

        <section className="story-section" id="story">
          <div className="story-image">
            <img src="/assets/waelshopy-lifestyle.jpg" alt="Citrus fruits beside the Waelshopy bottle" />
          </div>
          <div className="story-copy">
            <p className="eyebrow">A cleaner little ritual</p>
            <h2>Good for the sink.<br /><em>Good for the day.</em></h2>
            <p>We make everyday cleaning feel a little less ordinary. Waelshopy pairs the power you need with the citrus freshness you actually want.</p>
            <a href="#contact" className="text-link">Meet Waelshopy <span>↗</span></a>
          </div>
        </section>
      </main>

      <footer id="contact">
        <div>
          <a className="brand" href="#top">
            <span className="brand-mark">W</span>
            <span>waelshopy</span>
          </a>
          <p>Bright clean for everyday living.</p>
        </div>
        <div className="footer-links">
          <a href="mailto:waelshopy@gmail.com">waelshopy@gmail.com</a>
          <a href="tel:+2349066666958">+234 906 666 6958</a>
          <span>Lawan Dambazau, Opp Ali Gita</span>
          <span>© 2026 Waelshopy</span>
        </div>
      </footer>

      {notice && <div className="toast">✓ {notice}</div>}

      {cartOpen && (
        <div className="drawer-backdrop" onClick={closeOrder}>
          <aside className="order-drawer" onClick={(event) => event.stopPropagation()}>
            {checkoutStep === 'basket' ? (
              <>
                <div className="drawer-header">
                  <div>
                    <p className="eyebrow">Your basket</p>
                    <h2>Your order</h2>
                  </div>
                  <button className="close-button" onClick={closeOrder} aria-label="Close order">×</button>
                </div>

                <div className="loyalty-card">
                  <div>
                    <span className="star-symbol">★</span>
                    <div>
                      <strong>{stars} stars</strong>
                      <small>3 stars per completed order</small>
                    </div>
                  </div>
                  {stars >= 100 ? (
                    <button className="reward-button" onClick={redeemReward}>Redeem 1 product</button>
                  ) : (
                    <small>{100 - stars} to a free product</small>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="empty-order">
                    <div className="empty-icon">＋</div>
                    <p>Your order is waiting<br />for something fresh.</p>
                    <a href="#products" onClick={closeOrder}>Browse the clean ↘</a>
                  </div>
                ) : (
                  <>
                    <div className="cart-items">
                      {cart.map((item) => (
                        <div className="cart-item" key={item.id}>
                          <img src={item.image} alt="" />
                          <div className="cart-item-info">
                            <h3>{item.name}</h3>
                            <span>₦{item.price.toFixed(2)}</span>
                            <div className="quantity">
                              <button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease quantity">−</button>
                              <b>{item.quantity}</b>
                              <button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity">+</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="checkout">
                      <div><span>Subtotal</span><strong>₦{subtotal.toFixed(2)}</strong></div>
                      <div><span>Delivery</span><strong>₦{deliveryFee.toFixed(2)}</strong></div>
                      <div className="checkout-total"><span>Total</span><strong>₦{(subtotal + deliveryFee).toFixed(2)}</strong></div>
                      <p>₦600 delivery to all destinations</p>
                      <button className="checkout-button" onClick={beginCheckout}>Proceed to payment <span>↗</span></button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <form className="payment-step" onSubmit={finishPayment}>
                <div className="drawer-header">
                  <div>
                    <button className="back-button" type="button" onClick={() => setCheckoutStep('basket')}>← Back to basket</button>
                    <h2>Payment</h2>
                  </div>
                  <button className="close-button" onClick={closeOrder} aria-label="Close order">×</button>
                </div>

                <div className="payment-total">
                  <span>Amount due</span>
                  <strong>₦{(subtotal + deliveryFee).toFixed(2)}</strong>
                </div>

                <fieldset>
                  <legend>Choose payment</legend>
                  {[
                    { value: 'card', label: 'Card payment', note: 'Visa, Mastercard, Verve', icon: '◉' },
                    { value: 'transfer', label: 'Bank transfer', note: 'Zenith / Access / GTBank', icon: '↗' },
                    { value: 'cash', label: 'Cash on delivery', note: 'Pay in person when delivered', icon: '₦' },
                  ].map((option) => (
                    <label className={`payment-option ${paymentMethod === option.value ? 'selected' : ''}`} key={option.value}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
                      />
                      <span className="payment-icon">{option.icon}</span>
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.note}</small>
                      </span>
                      <b>›</b>
                    </label>
                  ))}
                </fieldset>

                {!editingCustomer && customerInfo.name ? (
                  <div className="saved-customer">
                    <div>
                      <span>Delivery info</span>
                      <strong>{customerInfo.name}</strong>
                      <small>{customerInfo.phone}<br />{customerInfo.address}</small>
                    </div>
                    <button type="button" onClick={() => setEditingCustomer(true)}>Edit</button>
                  </div>
                ) : (
                  <div className="customer-fields">
                    <label className="full-field">
                      Full name
                      <input
                        type="text"
                        name="name"
                        value={customerInfo.name}
                        onChange={(event) => setCustomerInfo({ ...customerInfo, name: event.target.value })}
                        placeholder="Your full name"
                        required
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        type="tel"
                        name="phone"
                        value={customerInfo.phone}
                        onChange={(event) => setCustomerInfo({ ...customerInfo, phone: event.target.value })}
                        placeholder="0802 000 0000"
                        required
                      />
                    </label>
                    <label>
                      Delivery area
                      <input
                        type="text"
                        name="area"
                        value={customerInfo.area || ''}
                        onChange={(event) => setCustomerInfo({ ...customerInfo, area: event.target.value })}
                        placeholder="Area / landmark"
                      />
                    </label>
                    <label className="full-field">
                      Delivery address
                      <textarea
                        name="address"
                        rows="3"
                        value={customerInfo.address}
                        onChange={(event) => setCustomerInfo({ ...customerInfo, address: event.target.value })}
                        placeholder="Street, house number, location"
                        required
                      />
                    </label>
                  </div>
                )}

                <button className="checkout-button" type="submit" disabled={sendingOrder}>
                  {sendingOrder ? 'Placing order...' : `Pay ₦${(subtotal + deliveryFee).toFixed(2)}`} <span>↗</span>
                </button>
                <p className="payment-note">Secure checkout and order updates sent to waelshopy@gmail.com.</p>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
