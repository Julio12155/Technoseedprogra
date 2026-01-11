const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'vivero_secreto_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production' 
    }
}));

const rutasAuth = require('./back/rutas/rutasAuth');
const rutasAdmin = require('./back/rutas/rutasAdmin');
const rutasPublicas = require('./back/rutas/rutasPublicas');

app.use('/api/auth', rutasAuth);
app.use('/api/admin', rutasAdmin);
app.use('/api/public', rutasPublicas);

app.get('/', (req, res) => {
    res.redirect('/tienda/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});