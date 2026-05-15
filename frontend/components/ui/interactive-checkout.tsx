"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingCart, X, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  color: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface InteractiveCheckoutProps {
  products?: Product[];
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Air Max 90",
    price: 129.99,
    category: "Running",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop",
    color: "Black/White",
  },
  {
    id: "2",
    name: "Ultra Boost",
    price: 179.99,
    category: "Performance",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200&h=200&fit=crop",
    color: "Grey/Blue",
  },
  {
    id: "3",
    name: "Classic Trainer",
    price: 89.99,
    category: "Casual",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=200&h=200&fit=crop",
    color: "White/Red",
  },
];

function InteractiveCheckout({ products = defaultProducts }: InteractiveCheckoutProps) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      })
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex gap-6">
        {/* Product list */}
        <div className="flex-1 space-y-3">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "group p-4 rounded-xl",
                "bg-white border border-zinc-200",
                "hover:border-zinc-400 hover:shadow-sm",
                "transition-all duration-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-zinc-900">{product.name}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <span className="font-medium text-zinc-900">${product.price}</span>
                      <span>·</span>
                      <span>{product.color}</span>
                    </div>
                  </div>
                </div>
                {/* Add button — outline (white bg, black border) */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToCart(product)}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cart panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "w-80 flex flex-col p-4 rounded-xl",
            "bg-white border border-zinc-200 shadow-sm",
            "sticky top-4 max-h-[32rem]"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Cart ({totalItems})</h2>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {cart.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-zinc-400 text-center py-6"
                >
                  Your cart is empty
                </motion.p>
              )}
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ opacity: { duration: 0.15 }, layout: { duration: 0.2 } }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900 truncate">{item.name}</span>
                      {/* Remove — critical/destructive (light red icon button) */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1 border border-zinc-200 rounded-md overflow-hidden">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-zinc-100 text-zinc-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </motion.button>
                        <span className="text-xs text-zinc-700 w-5 text-center font-medium">
                          {item.quantity}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-zinc-100 text-zinc-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </motion.button>
                      </div>
                      <span className="text-xs font-medium text-zinc-700">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <motion.div
            layout
            className="pt-3 mt-3 border-t border-zinc-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-900">Total</span>
              <span className="text-sm font-bold text-zinc-900">
                $<NumberFlow value={totalPrice} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
              </span>
            </div>
            {/* Checkout — critical action: use light red to indicate importance */}
            {cart.length > 0 ? (
              <Button size="sm" className="w-full gap-2" variant="default">
                <CreditCard className="w-4 h-4" />
                Checkout
              </Button>
            ) : (
              <Button size="sm" className="w-full gap-2" variant="secondary" disabled>
                <ShoppingCart className="w-4 h-4" />
                Checkout
              </Button>
            )}
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="w-full mt-2 text-xs text-red-500 hover:text-red-700 flex items-center justify-center gap-1 py-1 rounded hover:bg-red-50 transition-colors"
              >
                <AlertCircle className="w-3 h-3" />
                Clear cart
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export { InteractiveCheckout };
