'use strict';

const BaseContract = require('./BaseContract.js');
const RetailerContract = require('./RetailerContract.js');
const DistributorContract = require('./DistributorContract.js');
const ManufacturerContract = require('./ManufacturerContract.js');

module.exports.BaseContract = BaseContract;
module.exports.RetailerContract = RetailerContract;
module.exports.DistributorContract = DistributorContract;
module.exports.ManufacturerContract = ManufacturerContract;

module.exports.contracts = [BaseContract,RetailerContract,ManufacturerContract,DistributorContract];