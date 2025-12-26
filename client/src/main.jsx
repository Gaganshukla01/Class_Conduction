import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/Context.jsx";
import { ToastContainer } from "react-toastify";
import Navbar from "./components/Navbar.jsx";
import "./index.css"

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppContextProvider>
      <ToastContainer />
      <Navbar/>
      <App />
    </AppContextProvider>
  </BrowserRouter>
);
