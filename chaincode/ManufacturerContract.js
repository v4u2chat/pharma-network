'use strict';

//const BaseContract = require('./BaseContract.js');
const {Contract} = require('fabric-contract-api');

class ManufacturerContract extends Contract {
	
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet.manufacturer');
	}
	
	
	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - Manufacturer Smart Contract Instantiated');
	}
	
	/**
	 * This transaction is used by any organisation registered as a ‘manufacturer’ to register a new drug on the ledger. 
	 * 
	 * Initiator: Manufacturer
	 * 
	 * @param drugName -  Name of the Drug
	 * @param serialNo - Drug's serial no
	 * @param mfgDate -  Date of manufacturing of the drug
	 * @param expDate - Expiration date of the drug
	 * @param companyCRN - Key to identify Manufacturer
	 * 
	 * @returns  A ‘Drug’ asset on the ledger
	 */
	async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN) {

		// Validation to allow ONLY manufactures to perform this operation
		if('manufacturerMSP'!=ctx.clientIdentity.mspId){
			throw new Error('You are not authorized to perform this operation');
		}

		// Create a new composite key for the new DRUG
		const productID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.drug', [drugName,serialNo]);
		
		// Create a DRUG model object to be stored in ledger
		let newDrugObject = {
			productID: productID
			,name: drugName
			,manufacturer: companyCRN	//	------------		FETCH and Update 
			,manufacturingDate: mfgDate
			,expiryDate: expDate
			,owner: ctx.clientIdentity.getID()
			//shipment : ''
		};
		
		// Convert the JSON object to a buffer and send it to blockchain for storage
		let dataBuffer = Buffer.from(JSON.stringify(newDrugObject));
		await ctx.stub.putState(productID, dataBuffer);
		// Return value of new Drug object created to user
		return newDrugObject;
	}
}

module.exports = ManufacturerContract;