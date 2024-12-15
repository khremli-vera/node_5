const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = 'cAtwa1kkEy'

const filmsRouter = require('./routes/films');
const authRouter = require('./routes/auth');

app.use(express.json());
app.use('/', function (req, res, next) {
    if (req.url !== '/auth/login' && req.url !== '/auth/register') {
        if (req.header('Authorization')) {
            const token = req.header('Authorization').replace('Bearer ', '');
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded;
                next()
            } catch (err) {
                res.status(403).send('Forbidden');
            }
        } else {
            res.status(401).send("Unauthorized")
        }
    } else { next() }
})
app.use('/', filmsRouter);
app.use('/:id', filmsRouter);
app.use('/', authRouter);
app.use('/*', function (req, res) {
    res.status(400).send("Invalid request")
})


app.listen(3000, '127.0.0.1', function () {
    console.log('Running');
});