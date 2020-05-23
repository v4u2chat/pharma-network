'use strict';

const RetailerContract = require('./RetailerContract.js');
const DistributorContract = require('./DistributorContract.js');
const ManufacturerContract = require('./ManufacturerContract.js');

module.exports.RetailerContract = RetailerContract;
module.exports.DistributorContract = DistributorContract;
module.exports.ManufacturerContract = ManufacturerContract;

module.exports.contracts = [RetailerContract,ManufacturerContract,DistributorContract];