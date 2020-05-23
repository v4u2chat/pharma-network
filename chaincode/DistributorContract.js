'use strict';

const {Contract} = require('fabric-contract-api');
const commonFunctions = require('./CommonFunctions.js');


class DistributorContract extends Contract {
	
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet.distributor');
	}
	
	
	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - Distributor Smart Contract Instantiated');
		return 'PharmaNet -  Disributor  Smart Contract Instantiated';
	}

	/**
	 * This transaction/function will be used to register new entities on the ledger. 
	 * For example, for “VG pharma” to become a distributor on the network, it must register itself on the ledger using this transaction.
	 * 
	 * Initiator: Any Member of the network
	 * 
	 * @param companyCRN -  Name of the Drug
	 * @param companyName - Drug's serial no
	 * @param location -  Date of manufacturing of the drug
	 * @param organisationRole - Expiration date of the drug
	 * 
	 * @returns  A ‘Company’ asset on the ledger
	 */
	async registerCompany(ctx, companyCRN, companyName, location, organisationRole) {
		//re-use the common function
		return await commonFunctions.registerCompany(ctx, companyCRN, companyName, location, organisationRole);
	}
	/**
	 * This function is used to create a Purchase Order (PO) to buy drugs, by companies belonging to ‘Distributor’ or ‘Retailer’ organisation.
	 * 
	 * Initiator:  ‘Distributor’ or ‘Retailer’
	 * 
	 * @param buyerCRN -  CRN of Buyer Company
	 * @param sellerCRN - CRN of Seller Company
	 * @param drugName -  Name of the DRUG purchased
	 * @param quantity - Quantity of the DRUG purchased
	 * 
	 * @returns  A ‘Drug’ asset on the ledger
	 */
	async createPO(ctx, buyerCRN, sellerCRN, drugName,quantity) {
		//re-use the common function
		return await commonFunctions.createPO(ctx, buyerCRN, sellerCRN, drugName,quantity);
	}
}

module.exports = DistributorContract;