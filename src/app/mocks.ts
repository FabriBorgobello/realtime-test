import { useState } from "react";

export type Product = {
  name: string;
  emoji: string;
};

export const PRODUCTS: Product[] = [
  { name: "Apple", emoji: "🍎" },
  { name: "Banana", emoji: "🍌" },
  { name: "Cherry", emoji: "🍒" },
  { name: "Nectarine", emoji: "🍑" },
  { name: "Blueberry", emoji: "🫐" },
  { name: "Orange", emoji: "🍊" },
];
type BasketProduct = Product & {
  quantity: number;
};

export const useBasket = () => {
  const [basket, setBasket] = useState<BasketProduct[]>([]);

  const addProduct = (product: Product) => {
    const existingProduct = basket.find((p) => p.name === product.name);
    if (existingProduct) {
      setBasket(
        basket.map((p) =>
          p.name === product.name ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setBasket([...basket, { ...product, quantity: 1 }]);
    }
  };

  const addMultipleProducts = (products: Product[]) => {
    products.forEach((product) => {
      const existingProduct = basket.find((p) => p.name === product.name);
      if (existingProduct) {
        setBasket(
          basket.map((p) =>
            p.name === product.name ? { ...p, quantity: p.quantity + 1 } : p
          )
        );
      } else {
        setBasket([...basket, { ...product, quantity: 1 }]);
      }
    });
  };

  const removeProduct = (product: Product) => {
    const existingProduct = basket.find((p) => p.name === product.name);
    if (existingProduct) {
      if (existingProduct.quantity === 1) {
        setBasket(basket.filter((p) => p.name !== product.name));
      } else {
        setBasket(
          basket.map((p) =>
            p.name === product.name ? { ...p, quantity: p.quantity - 1 } : p
          )
        );
      }
    }
  };

  const removeMultipleProducts = (products: Product[]) => {
    // Delete element or decrement quantity
    products.forEach((product) => {
      const existingProduct = basket.find((p) => p.name === product.name);
      if (existingProduct) {
        if (existingProduct.quantity === 1) {
          setBasket(basket.filter((p) => p.name !== product.name));
        } else {
          setBasket(
            basket.map((p) =>
              p.name === product.name ? { ...p, quantity: p.quantity - 1 } : p
            )
          );
        }
      }
    });
  };

  const clearBasket = () => {
    setBasket([]);
  };

  return {
    addProduct,
    removeProduct,
    addMultipleProducts,
    removeMultipleProducts,
    basket,
    clearBasket,
  };
};
