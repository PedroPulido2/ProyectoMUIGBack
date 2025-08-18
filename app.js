var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
const loginRouter = require('./routes/loginRoutes');
const fosilRouter = require('./routes/fosilRoutes');
const investigacionRouter = require('./routes/investigacionRoutes');
const mineralRouter = require('./routes/mineralRoutes');
const rocaRouter = require('./routes/rocaRoutes');
const perfilRouter = require('./routes/perfilRoute');
const imagenRouter = require('./routes/imagenRouter');

var app = express();

// view engine setup
//pp.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

app.use(logger('dev'));
const allowedOrigins = ['http://localhost','http://localhost:3000', 'http://localhost:5173','https://muig.up.railway.app',];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Permite cookies o autenticación con tokens
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Aquí servimos solo la carpeta dist (el build de Vite)
app.use(express.static(path.join(__dirname, 'dist')));

app.use('/', indexRouter);
app.use('/api/login', loginRouter);
app.use('/api/fosil', fosilRouter);
app.use('/api/investigacion', investigacionRouter);
app.use('/api/mineral', mineralRouter);
app.use('/api/roca', rocaRouter);
app.use('/api/perfil', perfilRouter);
app.use('/api/imagen',imagenRouter);

// Cualquier ruta que no sea API devuelve el index.html de React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// catch 404
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler (sin jade)
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: true,
    message: err.message
  });
});


module.exports = app;
