const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const usersList = require('../manager.json')
app.use(express.json());
const authRouter = express.Router();
const JWT_SECRET = 'cAtwa1kkEy'

const fieldTypes = {
    "email": 'string',
    "password": 'string',
    "super": 'boolean'
}

authRouter.post('/auth/register', async (req, res) => {
    const body= req.body;
    if (isUserExist(body.email)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);
    createUser(body, hashedPassword, res)
});

// Аутентификация пользователя (логин)
authRouter.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Ищем пользователя по email
    if (!isUserExist(email)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = getuser(email);
  
    // Сравниваем пароль с хешированным паролем из базы данных
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  
    // Создаем JWT токен
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '5m'
    });
  
    res.status(200).json({ token });
  });
  




function isUserExist(userEmail) {
    let arr = usersList.map(user => user.email)
    return arr.includes(userEmail)
}

function getuser(userEmail) {
    let user;
    for (let i = 0; i < usersList.length; i++) {
        if (usersList[i].email === userEmail) {
            user = usersList[i];
            break
        }
    }
    return user
}

function getID() {
    const ids = usersList.map(user => user.id)
    let i = 1;
    while (ids.includes(i)) {
        i++
    }
    return i
}

function createUser(body, hashedPassword, res) {
    if (areAllFields(body) && areTypesRight(body)) {
        let id = getID();
        const newUser = {
            "id": id,
            "email": body.email,
            "password": hashedPassword,
            "super": body.super
        }
        usersList.push(newUser);
        rewriteFile('./manager.json', usersList)
        res.status(201).json({ message: 'User registered successfully' })
    } else {
        res.status(400).send('Invalid data')
    }
}

function areAllFields(body) {
    if (body.email && body.password && (body.super === true  || body.super === false )) {
        return true
    } else {
        return false
    }
}

function areTypesRight(body) {
    for (key in body) {
        if (typeof body[key] !== fieldTypes[key]) {
            return false
        }
    }
    return true
}


function rewriteFile(path, array) {
    let json = JSON.stringify(array);
    fs.writeFile(path, json, 'utf-8', (err) => {
        if (err) {
            console.log('Cant write to file');
        } else {
            console.log('the file was updated')
        }
    })
}


module.exports = authRouter;