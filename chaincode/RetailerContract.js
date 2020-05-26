'use strict';

const {Contract} = require('fabric-contract-api');
const commonFunctions = require('./CommonFunctions.js');

class RetailerContract extends Contract {
	
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet.retailer');
	}
	
	
	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - Retailer Smart Contract Instantiated');
		return 'PharmaNet - Retailer Smart Contract Instantiated';
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
	 * @returns  A ‘PO’ asset on the ledger
	 */
	async createPO(ctx, buyerCRN, sellerCRN, drugName,quantity) {
		return await commonFunctions.createPO(ctx, buyerCRN, sellerCRN, drugName,quantity);
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
	async createShipment(ctx,buyerCRN, drugName, listOfAssets, transporterCRN ) {
		console.log("RetailerContract >> createShipment >> buyerCRN, drugName, listOfAssets, transporterCRN ",buyerCRN, drugName, listOfAssets, transporterCRN );
		//re-use the common function
		return await commonFunctions.createShipment(ctx,buyerCRN, drugName, listOfAssets, transporterCRN );
	}


	/**
	 *	This transaction is called by the retailer while selling the drug to a consumer. 
	* 
	*	Validations:
	*		This transaction should be invoked only by the retailer, who is the owner of the drug. 
	*
	* 	Initiator: Retailer
	* 
	* @param drugName -  Name of the DRUG purchased
	* @param serialNo - Drug's serial no
	* @param retailerCRN -  CRN of Retailer Company
	
	* @param customerAadhar - Aadhaar of the Customer who purchased the DRUG
	* 
	* @returns  Updated ‘DRUG’ asset on the ledger
	*/
	async retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar) {
		console.log("RetailerContract >> retailDrug >> drugName, serialNo, retailerCRN, customerAadhar ",drugName, serialNo, retailerCRN, customerAadhar);
		//re-use the common function
		return await commonFunctions.retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar);
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

module.exports = RetailerContract;