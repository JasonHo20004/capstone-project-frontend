import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { WalletProvider } from "./context/WalletContext";
import { PurchasesProvider } from "./context/PurchasesContext";

createRoot(document.getElementById("root")!).render(
  <WalletProvider>
    <CartProvider>
      <PurchasesProvider>
        <App />
      </PurchasesProvider>
    </CartProvider>
  </WalletProvider>
);
