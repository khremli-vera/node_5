const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

const filmsRouter = require('./routes/films');
const authRouter = require('./routes/auth');

app.use(express.json());

app.use('/', filmsRouter);
app.use('/:id', filmsRouter);
app.use('/', authRouter);
app.use('/*', function (req, res) {
    res.status(400).send("Invalid request")
})


app.listen(3000, '127.0.0.1', function () {
    console.log('Running');
});