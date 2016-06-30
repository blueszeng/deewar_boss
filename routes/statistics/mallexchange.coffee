
express = require('express')
moment = require('moment')
async = require('async')
router = express.Router()
dataquery = require('../../services/web/dataquery')

router.get '/', (req, res) ->
  res.render 'statistics/mallexchange/index',
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
    msFromSql += "AND t_order.createdTime = #{req.body['MysSearch_0']} "
  if req.body['MysSearch_1']
    msFromSql += "AND t_product.name = #{req.body['MysSearch_1']} "

  tabledefinition =
      sTableName: 't_player'
      sCountColumnName: 'id'
      sSelectSql: "t_order.createdTime as time,
                 t_product.name as name,
                 t_property_value.value as value,
                 t_order.deerPointPrice as deerPointPrice,
                 t_order.userId as userId,
                 t_users.nickName as nickName,
                 t_order.address as address"
      sFromSql: msFromSql
      aoColumnDefs: [
        { mData: 'time', bSearchable: true }
        { mData: 'name', bSearchable: true }
        { mData: 'value', bSearchable: true }
        { mData: 'deerPointPrice', bSearchable: true }
        { mData: 'userId', bSearchable: true }
        { mData: 'nickName', bSearchable: true }
        { mData: 'address', bSearchable: true }
        { mData: 'null', bSearchable: true }
    ]
  dataquery.pagedataDeer(tabledefinition, req, res)


module.exports = router
