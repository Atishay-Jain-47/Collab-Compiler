import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { BrowserRouter } from 'react-router-dom'
import { Provider } from "react-redux";
import rootReducer from "./reducers/index";
import {configureStore} from "@reduxjs/toolkit"
import { Toaster } from "react-hot-toast";

/**
 * Main application Redux store configuration.
 */
const store = configureStore({
  reducer:rootReducer,
});

/**
 * Application DOM entrypoint mount with Redux Provider, Browser Router, and React Hot Toast.
 */
createRoot(document.getElementById('root')).render(
    <Provider store = {store}>
      <BrowserRouter>
        <App />
        <Toaster/>
      </BrowserRouter>
  </Provider>

)
