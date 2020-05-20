'use strict';

const {Contract} = require('fabric-contract-api');

const hierarchyKeyMap = {
	'Manufacturer' : 1
	,'Distributor' : 2
	,'Retailer' : 3
};

const organisationRoleMap = {
	'Manufacturer' : 'MANUFACTURER'
	,'Distributor' : 'DISTRIBUTOR'
	,'Retailer' : 'RETAILER'
	,'Transporter' : 'TRANSPORTER'
};

class BaseContract extends Contract {
	
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet');
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

		// Make sure valid Status is provided
		if(!organisationRoleMap[organisationRole]){	
			throw new Error('Invalid Organisation Role : ' + organisationRole );
		}

		// Create a new composite key for the new COMPANY
		const companyID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.company', [companyCRN,companyName]);
		
		// Create a COMPANY model object to be stored in ledger
		let newCompanyObject = {
			companyID: companyID
			,name: companyName
			,location: location
			,organisationRole: organisationRoleMap[organisationRole]
			,hierarchyKey : hierarchyKeyMap[organisationRole]
			,updatedBy: ctx.clientIdentity.getID()
			,updatedOn: new Date()
		};
		
		// Convert the JSON object to a buffer and send it to blockchain for storage
		let dataBuffer = Buffer.from(JSON.stringify(newCompanyObject));
		await ctx.stub.putState(companyID, dataBuffer);
		// Return value of new Drug object created to user
		return newCompanyObject;
	}
}

module.exports = BaseContract;