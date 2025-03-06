// import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'SyncSeller',
        width: 1000,
        height: 600
    });

    const startUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
    });

    mainWindow.loadUrl(startUrl);
}

app.whenReady().then(createMainWindow);