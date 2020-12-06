require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

morgan.token('data', (tokens, req,res,) => {
    return [
        req.method,
        req.originalUrl,
        res.statusCode,
        req.headers['content-length'], '-',
        tokens['response-time'](req,res), 'ms',
        JSON.stringify(req.body)
    ].join(' ')
})

app.use(express.static('build'))
app.use(express.json())
app.use(cors())
app.use(morgan('data', { skip: (req) => req.method !== 'POST' }))

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/info', (request, response) => {
    Person.countDocuments()
        .then(count => {
            const msg = `Phonebook has info for ${count} people`
            const date = new Date()
            const info = `<div>${msg}</br>${date}</div>`
            response.send(info)
        })
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id)
        .then(person => {
            if(person) {
                res.json(person)
            } else {
                res.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndDelete(req.params.id)
        .then(() => {
            res.status(204).end()
        })
        .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
    const body = req.body
    if(!body.name || !body.number) return res.status(400).json({
        error: 'incomplete information, pls send full info'
    })

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save()
        .then(savedContact => {
            res.json(savedContact)
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body
    const person = {
        name: body.name,
        number: body.number,
    }

    Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query' })
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if(error.name === 'CastError' && error.kind === 'ObjectId') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if(error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log('Server is running...')
})
