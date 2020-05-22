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
		super('org.pharma-network.pharmanet.common');
	}

	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - COMMON Smart Contract Instantiated');
		return 'PharmaNet - COMMON Smart Contract Instantiated';
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

		// Make sure valid organisationRole is provided
		if(!organisationRoleMap[organisationRole]){	
			throw new Error('Invalid Organisation Role : ' + organisationRole );
		}

		// Create a new composite key for the new COMPANY
		const companyID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.company', [companyCRN,companyName]);

		//	Validation to ensure - No other company exists already with provided details 
		let dataBuffer = await ctx.stub.getState(companyID).catch(err => console.log(err));
		if (dataBuffer.toString()) {
			throw new Error('Invalid COMPANY Details. Another company with this CRN & Name already exists.');
		}

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
		await ctx.stub.putState(companyID, Buffer.from(JSON.stringify(newCompanyObject)));


		//	Store companyID against crnCacheID for quick retrieval in the future
		//	In majority of use cases, we get only CRN. So, maintaining a cache based on CRN & ORG_ROLE would be used to fetch companyID
		const crnCacheID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.crncache', [companyCRN,organisationRoleMap[organisationRole]]);
		await ctx.stub.putState(crnCacheID, Buffer.from(JSON.stringify({companyID: companyID})));
		
		
		// Return value of new COMPANY object created
		return newCompanyObject;
	}
}


module.exports = BaseContract;