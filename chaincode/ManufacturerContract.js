'use strict';
const {Contract} = require('fabric-contract-api');
const commonFunctions = require('./CommonFunctions.js');

class ManufacturerContract extends Contract {

	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet.manufacturer');
	}
	
	
	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - Manufacturer Smart Contract Instantiated');
		return 'PharmaNet - Manufacturer Smart Contract Instantiated';
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
		// //re-use the common function
		return await commonFunctions.registerCompany(ctx, companyCRN, companyName, location, organisationRole);
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

		let companySearchResults = await commonFunctions.searchCompanyByCRN(ctx, companyCRN);
		if(companySearchResults.length==0){
			throw new Error('Invalid CRN. No MANUFACTURER exists with provided CRN');
		}
		
		if(companySearchResults[0].organisationRole!='MANUFACTURER'){
			throw new Error('You are not registered as MANUFACTURER and can\'t add DRUGs with your license');
		}

		
		let drugSearchResults = await commonFunctions.searchDrugByName(ctx, drugName);

		// Create a new composite key for the new DRUG
		const productID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.drug', [drugName,serialNo]);

		for(var i=0;i<drugSearchResults.length; i++) {
			var drugFoundWithSameName = drugSearchResults[i];
			if(drugFoundWithSameName.productID===productID){
				console.log(drugFoundWithSameName.productID);
				throw new Error('You already have a DRUG with same '+drugName+' & '+serialNo);
			}
		}
		
		// Create a DRUG model object to be stored in ledger
		let newDrugObject = {
			productID: productID
			,name: drugName
			,serialNo:serialNo
			,manufacturer: companySearchResults[0].companyID
			,manufacturingDate: mfgDate
			,expiryDate: expDate
			,owner: companySearchResults[0].companyID
			,shipment : []
		};
		
		// Convert the JSON object to a buffer and send it to blockchain for storage
		let dataBuffer = Buffer.from(JSON.stringify(newDrugObject));
		await ctx.stub.putState(productID, dataBuffer);
		// Return value of new Drug object created to user
		return newDrugObject;
	}

	/**
	 * After the buyer invokes the createPO transaction, the seller invokes this transaction to transport the consignment via a transporter corresponding to each PO.
	 * 
	 *	Validations:
	 *		The length of ‘listOfAssets’ should be exactly equal to the quantity specified in the PO.
	 * 		The IDs of the Asset should be valid IDs which are registered on the network.
	 *
	 * 	Initiator:  ‘Manufacturer’ or ‘Distributor’ or ‘Retailer’
	 * 
	 * @param buyerCRN -  CRN of Buyer Company
	 * @param drugName -  Name of the DRUG purchased
	 * @param listOfAssets - list of all DRUGs purchased
	 * @param transporterCRN - CRN of ‘Transporter’ Company
	 * 
	 * @returns  A ‘Shipment’ asset on the ledger
	 */
	async createShipment (ctx,buyerCRN, drugName, listOfAssets, transporterCRN ) {
		console.log("buyerCRN, drugName, listOfAssets, transporterCRN ",buyerCRN, drugName, listOfAssets, transporterCRN );
		//re-use the common function
		return await commonFunctions.createShipment(ctx,buyerCRN, drugName, listOfAssets, transporterCRN );
	}


	/**
	 * This transaction is used to view the current state of the Asset.
	 * 
	 * 	Initiator:  Any Member of the Network
	 * 
	 * @param drugName -  Name of the DRUG purchased
	 * @param serialNo - Drug's serial no
	 * 
	 * @returns  A ‘DRUG’ asset on the ledger
	 */
	async viewDrugCurrentState(ctx, drugName, serialNo) {
		return await commonFunctions.viewDrugCurrentState(ctx, drugName, serialNo);
	}


	/**
	 * This transaction is used to view the current state of the Asset.
	 * 
	 * 	Initiator:  Any Member of the Network
	 * 
	 * @param drugName -  Name of the DRUG purchased
	 * @param serialNo - Drug's serial no
	 * 
	 * @returns  A ‘DRUG’ asset on the ledger
	 */
	async viewHistory(ctx, drugName, serialNo) {
		return await commonFunctions.viewHistory(ctx, drugName, serialNo);
	}

}

module.exports = ManufacturerContract;