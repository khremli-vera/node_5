const express = require('express');
const fs = require('fs');
const usersList = require('../manager.json');

let films;
let filmsArr;


const fieldTypes = {
    "title": 'string',
    "rating": 'number',
    "year": 'number',
    "budget": 'number',
    "gross": 'number',
    "poster": 'string',
    "position": 'number'

}
fs.readFile('films.json', (err, data) => {
    films = data.toString();
    filmsArr = JSON.parse(films)
})

const filmsRouter = express.Router();

filmsRouter.get('/films', (req, res) => {
    filmsArr = filmsArr.sort(function (a, b) {
        return a.position - b.position;
    });
    res.send((filmsArr));
})

filmsRouter.get('/films/:id', (req, res) => {
    const { body, params } = req;

    if (isIdExist(params.id)) {
        let index;
        for (let i = 0; i < filmsArr.length; i++) {
            if (filmsArr[i].id == params.id) {
                index = i;
                break
            }
        }
        res.send((filmsArr[index]))
    } else {
        res.status(404).send('Incorrect id')
    }
}
)

filmsRouter.post('/films', (req, res) => {
    const { body, user } = req;
    const isSuper = checkUserRestrictions(user.id)
    if (!isSuper) {
        res.status(403).send("Forbidden")
    } else {
        if (areAllFields(body) && areTypesRight(body)) {
            let id = getID();
            let position;

            // check position
            if (isPositionExist(body.position)) {
                position = body.position;
                shiftDown(filmsArr, position, filmsArr.length)
            } else {
                position = filmsArr.length + 1;
            }

            const newFilm = {
                "id": id,
                "title": body.title,
                "rating": body.rating,
                "year": body.year,
                "budget": body.budget,
                "gross": body.gross,
                "poster": body.poster,
                "position": position
            }

            filmsArr.push(newFilm);
            filmsArr = filmsArr.sort(function (a, b) {
                return a.position - b.position;
            });
            rewriteFile('films.json', filmsArr)
            res.status(201).send(newFilm)
        } else {
            res.status(400).send('Invalid data')
        }
    }
})

filmsRouter.put('/films/:id', (req, res) => {
    const { body, params, user } = req;
    const isSuper = checkUserRestrictions(user.id)
    if (!isSuper) {
        res.status(403).send("Forbidden")
    } else {
        if (isIdExist(params.id) && areTypesRight(body)) {
            let position;
            let prevPosition;
            if (body.position) {
                for (let i = 0; i < filmsArr.length; i++) {
                    if (filmsArr[i].id == params.id) {
                        prevPosition = filmsArr[i].position;
                        break
                    }
                }
                if (isPositionExist(body.position)) {
                    position = body.position;
                } else {
                    position = filmsArr.length;
                }
            }

            if (position < prevPosition) {
                shiftDown(filmsArr, position, prevPosition - 1)
            } else if (position > prevPosition && position <= filmsArr.length) {
                shiftUp(filmsArr, prevPosition - 1, position)
            } else if (position > prevPosition && position > filmsArr.length) {
                shiftUp(filmsArr, prevPosition - 1, filmsArr.length)
            }

            filmsArr = filmsArr.map(item => item.id != params.id ? item : {
                "id": item.id,
                "title": body.title || item.title,
                "rating": body.rating || item.rating,
                "year": body.year || item.year,
                "budget": body.budget || item.budget,
                "gross": body.gross || item.gross,
                "poster": body.poster || item.poster,
                "position": position || item.position
            });

            filmsArr = filmsArr.sort(function (a, b) {
                return a.position - b.position;
            });
            let index;
            for (let i = 0; i < filmsArr.length; i++) {
                if (filmsArr[i].id == params.id) {
                    index = i;
                    break
                }
            }
            rewriteFile('films.json', filmsArr)
            res.send(filmsArr[index]);
        } else {
            res.status(400).send('Incorrect id or data')
        }
    }
}
)

filmsRouter.delete('/films/:id', (req, res) => {
    const { params, user } = req;
    const isSuper = checkUserRestrictions(user.id)
    if (!isSuper) {
        res.status(403).send("Forbidden")
    } else {
        if (isIdExist(params.id)) {
            let index;
            for (let i = 0; i < filmsArr.length; i++) {
                if (filmsArr[i].id == params.id) {
                    index = i;
                    break
                }
            }
            const position = filmsArr[index].position
            filmsArr.splice(index, 1);
            shiftUp(filmsArr, position, filmsArr.length);
            rewriteFile('films.json', filmsArr)
            res.status(200).send('Removed');
        } else {
            res.status(404).send('Incorrect id')
        }
    }
})

function getID() {
    const ids = filmsArr.map(item => item.id)
    let i = 1;
    while (ids.includes(i)) {
        i++
    }
    return i
}

function isPositionExist(pos) {
    const positions = filmsArr.map(item => item.position)
    return positions.includes(pos)
}

function isIdExist(id) {
    const ids = filmsArr.map(item => item.id)
    return ids.includes(+id)
}

function shiftDown(arr, pos, posNext) {
    for (let i = pos - 1; i < posNext; i++) {
        arr[i].position = arr[i].position + 1
    }
}

function shiftUp(arr, pos, posNext) {
    for (let i = pos - 1; i < posNext; i++) {
        arr[i].position = arr[i].position - 1
    }
}

function areAllFields(body) {
    if (body.title && body.rating && body.year && body.budget && body.gross && body.poster && body.position) {
        return true
    } else {
        return false
    }
}

function areTypesRight(body) {
    if (body.year) {
        let today = new Date();
        let year = today.getFullYear();
        if (body.year < 1895 || body.year > year) {
            return false
        }
    }
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

function checkUserRestrictions(userId) {
    let ids = usersList.map(user => user.id)
    if (ids.includes(userId)) {
        let index = ids.indexOf(userId);

        return usersList[index].super
    } else {
        return res.status(403).send('Forbidden')
    }
}

module.exports = filmsRouter;