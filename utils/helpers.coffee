crypto = require('crypto')

encryptWithMD5 = (value) ->
  if not value
    return ''
  hash = crypto.createHash 'md5'
  hash.update value.toString()
  hash.digest 'hex'

module.exports =
  encryptWithMD5 : encryptWithMD5
