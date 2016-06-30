express = require('express')
router = express.Router()
Joi = require('joi')
dataquery = require('../../services/web/dataquery')
exchange = require('../../model/exchange/exchangemanage')

router.get '/', (req, res) ->
  res.render 'exchang/exchangemanage/index',
    info: req.query.info
    error: req.query.error

router.post '/list.html', (req, res) ->
  msFromSql = "t_order
         JOIN t_users
         ON t_order.userId = t_users.id
         JOIN t_product_unit
         ON t_order.productUnitId = t_product_unit.id
         JOIN t_product
         ON t_product_unit.productId = t_product.id
         JOIN t_product_unit_property
         ON t_order.productUnitId = t_product_unit_property.productUnitId
         JOIN t_property_value
         ON t_product_unit_property.propertyValueId = t_property_value.id
         WHERE t_product_unit_property.propertyId = 1"
  if req.body['MysSearch_0']
    msFromSql += " AND t_order.userId = #{req.body['MysSearch_0']} "
  if req.body['MysSearch_1']
    msFromSql += " AND t_users.nickName = #{req.body['MysSearch_1']} "

  tabledefinition =
      sTableName: 't_player'
      sCountColumnName: 'id'
      sSelectSql: "t_order.userId as userId,
                 t_users.nickName as nickName,
                 t_order.deerPointPrice as deerPointPrice,
                 t_product.name as name,
                 t_property_value.value as value,
                 t_order.createdTime as time,
                 t_order.status,
                 t_order.id"
      sFromSql: msFromSql
      aoColumnDefs: [
        { mData: 'userId', bSearchable: true }
        { mData: 'nickName', bSearchable: true }
        { mData: 'deerPointPrice', bSearchable: true }
        { mData: 'name', bSearchable: true }
        { mData: 'value', bSearchable: true }
        { mData: 'time', bSearchable: true }
        { mData: 'status', bSearchable: true }
        { mData: 'id', bSearchable: false }
        { mData: 'null', bSearchable: true }
    ]
  dataquery.pagedataDeer(tabledefinition, req, res)
  res

router.get '/processAward', (req, res) ->
  orderId = parseInt(req.query.id)
  schema = Joi.number().integer()
  Joi.validate  orderId , schema, (err, value) ->
    return res.json status: false, message: "#{encodeURI('传入id不正确')}" if err
    exchange.getUserOrderInfoByOrderId(orderId)
    .then (ret) ->
      console.log ret
      return res.json status: true, data: ret
    .catch (err) ->
      return res.json status: false, message: "#{encodeURI('无法获取订单Id信息')}"

router.post '/sendCard', (req, res) ->
  card = req.body
  schema = Joi.object().keys
    cardNo: Joi.string().required().label('不合法的卡号')
    cardpwd: Joi.string().required().label('不合法的密码')
    orderId: Joi.string().required().label('不合法的orderId')
  Joi.validate  card , schema, (err, value) ->
    return res.json status: false, message: err.details[0].context.key　 if err
    card = JSON.stringify  {cardNo: req.body.cardNo, cardPwd: req.body.cardpwd}
    orderId = req.body.orderId
    console.log card, orderId
    exchange.setUserOrderExtraInfo card, orderId
    .then (ret) ->
      return res.json status: true, data: {}
    .catch (err) ->
      return res.json status: false, message: "#{encodeURI('发卡失败')}"

module.exports = router
