/* globals __dirname */
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const md5 = require('md5')
const fs = require('fs')

const app = express()

const config = JSON.parse(fs.readFileSync(__dirname + '/config.json').toString())
const state = JSON.parse(fs.readFileSync(__dirname + '/state.json').toString())

const all_data = {...config, ...state}

const users = {
  'root': 'c4ca4238a0b923820dcc509a6f75849b',
  'admin': 'c4ca4238a0b923820dcc509a6f75849b',
  'journal': 'c4ca4238a0b923820dcc509a6f75849b',
  'service': 'c4ca4238a0b923820dcc509a6f75849b',
  'verify': 'c4ca4238a0b923820dcc509a6f75849b',
  'setup': 'c4ca4238a0b923820dcc509a6f75849b',
  'info': 'c4ca4238a0b923820dcc509a6f75849b'
}

let sessionId = 0

app.use(cors({
  origin: 'http://localhost:8081',
  credentials: true
}))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extend: true}))

app.post('/jrpc', (request, response) => {
  const {method, params, id, jsonrpc} = request.body
  if (method === 'login') {
    console.log('sumwun tryna login', params)
    if (!Object.keys(users).includes(params.username)) {
      response.status(404).send({id, method, jsonrpc, error: {
        code: -32000,
        message: `username ${params.username} does not exist`
      }})
      return
    }
    if (users[params.username] !== params.password) {
      response.status(406).send({id, method, jsonrpc, error: {
        code: -32001,
        message: 'wrong password'
      }})
      return
    }
    sessionId = md5(`${params.username}:${params.password}:${Date.now().toString(24)}`)
    console.log(`generated sessionId=${sessionId}`)
    response
      .cookie('sessionId', sessionId, {expires: new Date(Date.now() + 900000), httpOnly: false, secure: false})
      .status(200)
      .header('Access-Control-Allow-Credentials', 'true')
      .send({jsonrpc, method, id, result: {
        username: params.username
      }})
    return
  }

  const sessionCookie = request.cookies.sessionId

  if (sessionCookie !== sessionId) {
    response.status(400).send({
      jsonrpc,
      method,
      id,
      error: {
        code: -32002,
        message: 'session unauthorized'
      }
    })
    console.log('tryna ask but wrong session')
    return
  }

  let result = null
  switch(method) {
    case 'get_state':
      console.log('getting state')
      result = state
      break
    case 'get_params':
      console.log('getting param', params)
      result = getConfig(params)
      break
    case 'set_params':
      console.log('setting param')
      result = setConfig(params)
      break
    case 'get_serial_number':
      console.log('getting serials')
      result = [111111, 222222]
      break
    case 'logout':
      this.sessionId = null
      break
    case 'set_mode':
      console.log(params)
      result = true
  }
  const responseJson = {jsonrpc, method, result, id}
  console.log(responseJson)
  response.send(responseJson)
})

function getConfig(params) {
  const configPart = {}
  for (const key of params) {
    configPart[key] = all_data[key]
  }
  return configPart
}

function setConfig(params) {
  for (const key in params) {
    all_data[key] = params[key]
  }
  return true
}


app.listen(11000, () => {
  console.log('Server started')
})