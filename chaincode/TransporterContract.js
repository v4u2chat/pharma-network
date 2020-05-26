'use strict';
const {Contract} = require('fabric-contract-api');
const commonFunctions = require('./CommonFunctions.js');

class TransporterContract extends Contract {

	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet.transporter');
	}
	
	
	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - Transporter Smart Contract Instantiated');
		return 'PharmaNet - Transporter Smart Contract Instantiated';
	}
	
	/**
	 * This transaction/function will be used to register new entities on the ledger. 
	 * For example, for “VG pharma” to become a distributor on the network, it must register itself on the ledger using this transaction.
	 * 
	 * Initiator: Any Member of the network except CONSUMERs
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

	//============================================================================================================================================
	/**
	 *This transaction is used to update the status of the shipment to ‘Delivered’ when the consignment gets delivered to the destination.
	* 
	*	Validations:
	*		This function should be invoked only by the transporter of the shipment.
	*
	* 	Initiator: ‘Transporter’
	* 
	* @param buyerCRN -  CRN of Buyer Company
	* @param drugName -  Name of the DRUG purchased
	* @param transporterCRN - CRN of ‘Transporter’ Company
	* 
	* @returns  Updated ‘Shipment’ asset on the ledger
	*/
	async updateShipment(ctx, buyerCRN, drugName, transporterCRN) {

		// Validation to allow ONLY ‘Transporter’ to perform this operation
		if('transporterMSP'!=ctx.clientIdentity.mspId){
			throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
		}

		return await commonFunctions.updateShipment(ctx, buyerCRN, drugName, transporterCRN);
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

module.exports = TransporterContract;