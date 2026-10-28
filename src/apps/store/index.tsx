import './store.css'
import { useEffect, useRef } from 'react'
import { SI } from './icons'
import { CartDrawer } from './Cart'
import { CategoryPage, SearchPage, WishlistPage } from './Catalog'
import { Checkout, OrderPage, nav } from './Checkout'
import { Header } from './Header'
import { Home } from './Home'
import { ProductPage } from './Product'
import { ShopProvider, useShop } from './state'
import { useStoreRoute } from './router'

function Shell() {
  const route = useStoreRoute()
  const { toast } = useShop()
  const scroll = useRef<HTMLDivElement>(null)
  const key = JSON.stringify(route)
  useEffect(() => { scroll.current?.scrollTo(0, 0); if (route.name !== 'checkout' && route.name !== 'order') nav.last = location.hash }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const focused = route.name === 'checkout' || route.name === 'order'
  return (
    <div className="st-root">
      <div className="st-scroll scroll" ref={scroll}>
        {!focused && <Header route={route} />}
        <main className="st-body" id="st-main">
          {route.name === 'home' && <Home />}
          {route.name === 'category' && <CategoryPage id={route.id} type={route.type} />}
          {route.name === 'search' && <SearchPage q={route.q} />}
          {route.name === 'wishlist' && <WishlistPage />}
          {route.name === 'product' && <ProductPage id={route.id} />}
          {route.name === 'checkout' && <Checkout />}
          {route.name === 'order' && <OrderPage refId={route.ref} />}
        </main>
      </div>
      <CartDrawer />
      <div className="st-toast" role="status" aria-live="polite">{toast && <span><SI name="check" size={14} />{toast}</span>}</div>
    </div>
  )
}

export default function Store() {
  return <ShopProvider><Shell /></ShopProvider>
}
