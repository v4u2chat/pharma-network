'use strict';

const BaseContract = require('./BaseContract.js');
const ManufacturerContract = require('./ManufacturerContract.js');

module.exports.BaseContract = BaseContract;
module.exports.ManufacturerContract = ManufacturerContract;

module.exports.contracts = [BaseContract,ManufacturerContract];