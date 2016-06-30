
require('isomorphic-fetch')

removeTailAnd = (str) ->
  str.replace /&$/, ''

makeGetUrl = (path, params) ->
  uri = "#{path}"
  for key of Object.keys(params)
    uri += "#{key}=#{encodeURIComponent(params[key])}&"
  if params
    removeTailAnd uri
  else
    removeTailAnd path

jsonRequestTemplate = (method) ->
  (url, body = {}, headers = {}) ->
    new Promise (resolve, reject) ->
      allHeaders =
        {
          'Accept': 'application/json'
          'Content-Type': 'application/json'
          'authorization': headers.authorization
        }
      url = makeGetUrl(url, body).replace(/&$/, '') if method == 'GET'
      fetch url,
        {
          method,
          headers: allHeaders,
          body: if method == 'GET' then null  else JSON.stringify(body)
        }
      .then (res) ->
        body = ''
        res.body.on 'data', (chunk) ->
          body += chunk.toString('utf8')
          return
        res.body.on 'end', () ->
          try
            resolve JSON.parse(body)
          catch err
            reject "发生错误 #{url}, ${body}"


jsonRequestHead = (method) ->
  (url, body = {}, headers = {}) ->
    new Promise (resolve, reject) ->
      allHeaders =
          'Accept': 'application/json'
          'Content-Type': 'application/json'
          'authorization': headers.authorization
      url = makeGetUrl(url, body).replace(/&$/, '') if method == 'GET'
      fetch url,
        {
          method,
          headers: allHeaders,
          body: if method == 'GET' then null  else JSON.stringify(body)
        }
      .then (res) ->
        return resolve(res.headers._headers)

module.exports =
  get: jsonRequestTemplate('GET')
  post: jsonRequestTemplate('POST')
  put: jsonRequestTemplate('PUT')
  delete: jsonRequestTemplate('DELETE')
  postAndHead: jsonRequestHead('POST')
