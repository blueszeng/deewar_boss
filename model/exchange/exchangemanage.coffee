deerDb = require ('../../stores/deerdb')
moment = require('moment')

module.exports.getUserOrderInfoByOrderId = (orderId) ->
  new Promise (resolve, reject) ->
    sql = "
    SELECT
       t_order.id,
       t_order.userId as userId,
    	 t_users.nickName as nickName,
    	 t_order.deerPointPrice as deerPointPrice,
    	 t_product.name as name,
    	 t_property_value.value as value,
    	 t_order.createdTime as time,
    	 t_order.status
    FROM
    	 t_order
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
    	 WHERE t_product_unit_property.propertyId = 1 AND t_order.id = ?
        "
    deerDb.query sql, [orderId], (err, ret) ->
      if err
        return reject(err)
      else if ret.length <= 0
        return resolve({})
      else
        return resolve(ret[0])

module.exports.setUserOrderExtraInfo = (cardInfo, orderId) ->
  new Promise (resolve, reject) ->
    sql = "
    UPDATE
      t_order
    SET status = 4, extraInfo = ?
    WHERE
      id = ?"
    deerDb.query sql, [cardInfo, orderId], (err, ret) ->
      if err
        return reject(err)
      else
        return resolve(true)
