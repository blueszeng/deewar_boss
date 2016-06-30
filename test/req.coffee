http = require('../utils/http')
token = null
headers = null
PORT = 3005
loginLocal = () ->
  url = (route) -> "http://localhost:#{PORT}/api/auth#{route}"
  http.postAndHead url('/loginLocal'),
    mobile: '18525300520'
    password: 'dirdell'
    rememberMe: false
  .then (res) ->
    token = res['x-deerwar-token'][0]
    headers =
      'authorization': "Bearer #{token}"
    getAddresses()
  .catch (err) ->
    console.log err

getAddresses = () ->
  url = () -> "http://localhost:#{PORT}/api/lobby/contest/availableTicketRange"
  console.log '111-->', headers
  http.get url(), {}, headers
  .then (res) ->
    console.log res
  .catch (err) ->
    console.log err

loginLocal()
