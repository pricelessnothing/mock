const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

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

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extend: true}))

app.get('/', (request, response) => {
  response.send('Hi API')
})

app.post('/jrpc', (request, response) => {
  const {method, params, id, jsonrpc} = request.body
  let paramResponse = {}
  switch(method) {
  case 'get_config':
    paramResponse = getConfig(params)
    break
  case 'set_config':
    setConfig(params)
    break

  }
  const responseJson = {jsonrpc, method, result: paramResponse, id}
  console.log(responseJson)
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