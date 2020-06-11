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
  'Администратор': 'c4ca4238a0b923820dcc509a6f75849b',
  'Журнал': 'c4ca4238a0b923820dcc509a6f75849b',
  'Поверка': 'c4ca4238a0b923820dcc509a6f75849b',
  'Настройка': 'c4ca4238a0b923820dcc509a6f75849b',
  'Оператор': 'c4ca4238a0b923820dcc509a6f75849b'
}

let sessionId = 0

app.use(cors({
  origin: 'http://127.0.0.1:8081',
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
      .cookie('session_id', sessionId, {expires: new Date(Date.now() + 900000), httpOnly: false, secure: false})
      .status(200)
      .header('Access-Control-Allow-Credentials', 'true')
      .send({jsonrpc, method, id, result: {
        username: params.username,
        rights: 'root'
      }})
    return
  }

  const sessionCookie = request.cookies.session_id

  if (sessionCookie !== sessionId) {
    response.status(401).send({
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
  const offset = params.offset
  const length = params.length
  const updateLastFix = Math.round(Math.random() * 0.6)
  switch(method) {
    case 'get_state':
      console.log('getting state', updateLastFix)
      if (updateLastFix)
        state.last_pushed_id = Date.now()
      result = state
      break
    case 'get_ver': 
      result = {
        'version': '1.2',
        'build': '7195.24482',
        'crc': 'BD60FE02',
        'product': 'Duet',
        'company': 'Olvia',
        'copyright': 'Copyright © Olvia 2020'
      }
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
      state.mode = params.mode
      result = true
      break
    case 'get_events_list':
      console.log(`getting event list of ${length} with offset of ${offset}`)
      result = [] 
      for (let i = offset; i < offset + length; i++) {
        const rand = Math.random()
        result.push({
          'id': i,
          '0': Date.now(),
          '1': 'в000oр|777',
          '2': Math.round(rand) ? 0 : 1.2,
          '3': Math.round(rand*100)
        })
      }
      break
    case 'get_db_time_minmax':
      console.log('getting times')
      result = {
        'min': '2020-03-24 15:15:13.091000',
        'max': '2020-04-23 12:55:53.649000'
      }
      break
    case 'get_events_list_info':
      console.log('getting list length')
      result = {
        'rows_count':'125037'
      }
      break
    case 'get_target_data':
      console.log('getting target data', params.id) 
      result = {
        'time': '2020-04-15 13:35:28.848000',
        'speed': '51',
        'distance': '27.4728',
        'liplate': '\u0445993\u0440\u0443|178',
        'event_id': '328627',
        'target_type': '0'
      }
      break
    case 'get_report_templates_list':
      result = [
        {'file_name':'ru.xml', 'file_path':'/mnt/targets/templates/ru.xml', 'default':true, 'selected':true},
        {'file_name':'ru_samara.xml', 'file_path':'/mnt/targets/templates/ru_samara.xml', 'default':false, 'selected':false}
      ]
      break
    case 'get_users_actions': 
      result = [
        {'id':340, 'tm':'2020-03-26 13:07:36', 'us':'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440', 'ac':10,  'va':'setup', 'vb':null, 'vc':null, 'vd':null, 've':null, 'vf':null},
        {'id':335, 'tm':'2020-03-26 13:02:35', 'us':'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440', 'ac':101, 'va':'speed_limit', 'vb':'{"speed_limit":30.0}', 'vc':null, 'vd':null, 've':null, 'vf':null},
        {'id':336, 'tm':'2020-03-26 13:02:35', 'us':'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440', 'ac':101, 'va':'speed_limit_truck', 'vb':'{"speed_limit_truck":30.0}', 'vc':null, 'vd':null, 've':null, 'vf':null},
        {'id':232, 'tm':'2020-03-19 04:05:17', 'us':'\u041e\u043f\u0435\u0440\u0430\u0442\u043e\u0440', 'ac':200, 'va':'181.65.241.45', 'vb':null, 'vc':null, 'vd':null, 've':null, 'vf':null},
        {'id':259, 'tm':'2020-03-23 15:27:35', 'us':'\u041e\u043f\u0435\u0440\u0430\u0442\u043e\u0440', 'ac':201, 'va':'84.52.101.111', 'vb':null, 'vc':null, 'vd':null, 've':null, 'vf':null},
        {'id':294, 'tm':'2020-03-26 11:08:15', 'us':'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440', 'ac':202, 'va':'84.52.101.121', 'vb':null, 'vc':null, 'vd':null, 've':null, 'vf':null},
        {'id':241, 'tm':'2020-03-19 09:35:46', 'us':'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440', 'ac':10,  'va':'work', 'vb':null, 'vc':null, 'vd':null, 've':null, 'vf':null},
        {'id':212, 'tm':'2020-03-17 01:47:12', 'us':'root', 'ac':101, 'va':'slave', 'vb':'{"fixations_dir":"blabla","ftp_pass":"abcabc"}', 'vc':null, 'vd':null, 've':null, 'vf':null}
      ]
      break
    case 'get_users_actions_count':
      result = 254
      break
  }
  const responseJson = {jsonrpc, method, result, id}
  // console.log(responseJson)
  response.send(responseJson)
})

function getConfig(params) {
  const configPart = {}
  for (const key in params) {
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