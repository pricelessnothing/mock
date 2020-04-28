const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const md5 = require('md5')

const app = express()

const config = {
  systemSerial: '123123123',
  masterSerial: '11',
  slaveSerial: '22',
  slaveIP: '192.168.1.11',
  distance: '3000',
  speedLimit: '60',
  disposition: 'НИК',
  orientation: 'await component',
  deviceLocation: '',
  FTPUsername: 'root',
  FTPPassword: 'le password',
  isLocality: true,
  townSpeedLimit: '40',
  coordsMaster: '213123123123',
  coordsSlave: '234124241',
  systemName: 'СКАТ ДУЭТ',
  roadLength: '1502',

  softwareVersion: 'лучшая',
  buildNumber: '312341234',
  checksum: 'CRC32',

  verificationNumber: '123',
  verificatinAgency: 'IEEE',
  verificationStartTime: '123',
  verificationEndTime: '123',

  isConnected: false,
  devicePaired: '',
  uptime: '67:78',
  TSState: '',
  controlRunning: '',
  controlInspection: '',
  controlCurrentState: '',
  connectionStartTime: 0,

  storageVolumeMB: '1024',
  storageVolumePercent: '97',

  targetId: 0,
  lastTargetId: 0,
  fixationCount: '0',
  fixedVehicles: 0
}

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
  if (method === 'auth') {
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

  let paramResponse = {}
  switch(method) {
    case 'get_config':
      paramResponse = getConfig(params)
      break
    case 'set_config':
      setConfig(params)
      break
    case 'logout':
      this.sessionId = null
      break
  }
  const responseJson = {jsonrpc, method, result: paramResponse, id}
  response.send(responseJson)
})

function getConfig(params) {
  const configPart = {}
  for (const key of params) {
    configPart[key] = config[key]
  }
  return configPart
}

function setConfig(params) {
  for (const key in params) {
    config[key] = params[key]
  }
}


app.listen(11000, () => {
  console.log('Server started')
})