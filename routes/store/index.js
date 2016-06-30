/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express');
var router = express.Router();

var propertyroute =  require('./property');
var propertyValueroute =  require('./propertyValue');
var productroute =  require('./product');
var productImageroute =  require('./productImage');
var productImageroute =  require('./productImage');
var productUnitroute =  require('./productUnit');
var productUnitPropertyroute =  require('./productUnitProperty');

router.use('/property', propertyroute);
router.use('/propertyValue', propertyValueroute);
router.use('/product', productroute);
router.use('/productImage', productImageroute);
router.use('/productUnit', productUnitroute);
router.use('/productUnitProperty', productUnitPropertyroute);

module.exports = router;
