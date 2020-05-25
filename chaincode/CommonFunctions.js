'use strict';

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


//============================================================================================================================================
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
async function registerCompany(ctx, companyCRN, companyName, location, organisationRole) {

	if(!organisationRoleMap[organisationRole]){	
		throw new Error('Invalid Organisation Role : ' + organisationRole );
	}

	let companySearchResults = await searchCompanyByCRN(ctx, companyCRN);
	if(companySearchResults.length>0){
		throw new Error('Invalid COMPANY Details. Another company with this CRN already exists.');
	}
	
	// Create a new composite key for the new CRN
	// const crnCacheID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.crncache', [companyCRN]);
	// //	Validation to ensure - No other CRN exists across all companies
	// let dataBuffer = await ctx.stub.getState(crnCacheID).catch(err => console.log(err));
	// if (dataBuffer.toString()) {
	// 	throw new Error('Invalid COMPANY Details. Another company with this CRN & Name already exists.');
	// }


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
	await ctx.stub.putState(companyID, toBuffer(newCompanyObject));
	//await ctx.stub.putState(crnCacheID, toBuffer(newCompanyObject));	// For future retrievals with just CRN
	

	
	//Return value of new COMPANY object created
	return newCompanyObject;
}
//============================================================================================================================================
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
async function createPO(ctx, buyerCRN, sellerCRN, drugName,quantity) {

	// Validation to allow ONLY ‘Distributor’ or ‘Retailer’ to perform this operation
	if('distributorMSP'!=ctx.clientIdentity.mspId && 'retailerMSP'!=ctx.clientIdentity.mspId){
		throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
	}

	//	Validate  BUYER existstance 
	let buyerCompanySearchResults = await searchCompanyByCRN(ctx, buyerCRN);
	console.log("buyerCRN --->"+buyerCRN);
	console.log("buyerCompanySearchResults --->"+buyerCompanySearchResults);
	
	if(buyerCompanySearchResults.length==0){
		throw new Error('Invalid BUYER CRN.');
	}
	const buyerCompanyInfo = buyerCompanySearchResults[0];
	if(buyerCompanyInfo.hierarchyKey==1){
		throw new Error('BUYER can\'t be Manufacturer');
	}

	//	Validate  SELLER existstance 
	let sellerCompanySearchResults = await searchCompanyByCRN(ctx, sellerCRN);
	if(sellerCompanySearchResults.length==0){
		throw new Error('Invalid SELLER CRN.');
	}
	const sellerCompanyInfo = sellerCompanySearchResults[0];

	//	Validate BUYing process takes place hierarcal manner
	if(parseInt(sellerCompanyInfo.hierarchyKey)+1 != parseInt(buyerCompanyInfo.hierarchyKey)){
		throw new Error('You can\'t purchase directly from '+sellerCompanyInfo.organisationRole+ " sellerCompanyInfo.hierarchyKey : "+sellerCompanyInfo.hierarchyKey+ " buyerCompanyInfo.hierarchyKey : "+buyerCompanyInfo.hierarchyKey);
	}

	// Create a new composite key for the new Purchase Order
	const poID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.po', [buyerCRN,drugName]);
	
	// Create a PO model object to be stored in ledger
	let newPurchaseOrderObject = {
		poID: poID
		,drugName: drugName
		,buyerCRN: buyerCRN
		,sellerCRN: sellerCRN
		,quantity: parseInt(quantity)
		,manufacturer : sellerCompanyInfo.hierarchyKey==1 ? sellerCompanyInfo.companyID : null
	};
	
	// Convert the JSON object to a buffer and send it to blockchain for storage
	let newPurchaseOrderObjectDataBuffer = toBuffer(newPurchaseOrderObject);
	await ctx.stub.putState(poID, newPurchaseOrderObjectDataBuffer);
	
	ctx.stub.setEvent('createPO_Event', newPurchaseOrderObjectDataBuffer);

	return newPurchaseOrderObject;	// Return value of new  Purchase Order object created to user
}
//============================================================================================================================================
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
 * @returns  A ‘Drug’ asset on the ledger
 */
async function createShipment (buyerCRN, drugName, listOfAssets, transporterCRN ) {

	// Validation to allow ONLY ‘Manufacturer’ or ‘Distributor’ or ‘Retailer’ to perform this operation
	if('distributorMSP'!=ctx.clientIdentity.mspId && 'retailerMSP'!=ctx.clientIdentity.mspId  && 'manufacturerMSP'!=ctx.clientIdentity.mspId){
		throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
	}
	
	//	Validate BUYER existstance 
	let buyerCompanySearchResults = await searchCompanyByCRN(ctx, buyerCRN);
	console.log("buyerCRN --->"+buyerCRN);
	console.log("buyerCompanySearchResults --->"+buyerCompanySearchResults);
	if(buyerCompanySearchResults.length==0){
		throw new Error('Invalid BUYER CRN.');
	}

	//	Validate BUYER type 
	if(buyerCompanySearchResults[0].hierarchyKey==1){
		throw new Error('BUYER can\'t be Manufacturer');
	}

	//	Validate transporter existstance 
	let transporterCompanySearchResults = await searchCompanyByCRN(ctx, buyerCRN);
	if(transporterCompanySearchResults.length==0){
		throw new Error('Invalid Transporter CRN.');
	}


	//	Validate :  Existense of PO with buyer and DRUG
	const poID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.po', [drugName,buyerCRN]);
	let poDataBuffer = await ctx.stub.getState(poID).catch(err => console.log(err));
	if (!poDataBuffer.toString()) {
		throw new Error('Invalid operation. No PO raised for BUYER :'+buyerCRN+", DRUG : "+drugName);
	}
	const poDetails = fromBuffer(poDataBuffer);


	//	Validate :  The length of ‘listOfAssets’ should be exactly equal to the quantity specified in the PO.
	if(listOfAssets.length!=parseInt(poDetails.quantity)){
		throw new Error('You can\'t ship neither lee/more than PO quantity.');
	}


	// Create a new composite key for the new SHIPMENT Order
	const shipmentID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.shipment', [buyerCRN,drugName]);
	
	// Create a PO model object to be stored in ledger
	let newShipmentObject = {
		shipmentID: shipmentID
		,creator : buyerCompanyInfo.companyID
		,assets : [{

		}]
		,transporterCRN: transporterCRN
		,status: 'IN-TRANSIT'
	};
	
	// Convert the JSON object to a buffer and send it to blockchain for storage
	await ctx.stub.putState(poID, toBuffer(newShipmentObject));
	

	return newShipmentObject;	// Return value of new  Shipment object created to user
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
 * @returns  A ‘Drug’ asset on the ledger
 */
async function updateShipment( buyerCRN, drugName, transporterCRN) {

	// Validation to allow ONLY ‘Transporter’ to perform this operation
	if('transporterMSP'!=ctx.clientIdentity.mspId){
		throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
	}

	// Create a new composite key for the new SHIPMENT Order
	const shipmentID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.shipment', [buyerCRN,drugName]);
	let shipmentoDataBuffer = await ctx.stub.getState(shipmentID).catch(err => console.log(err));
	if (!shipmentoDataBuffer.toString()) {
		throw new Error('Invalid operation. Can\'t find any SHIPMENT with specified BUYER & DRUG');
	}
	const shipmentObject = fromBuffer(shipmentoDataBuffer);
	shipmentObject.status = 'DELIVERED';

	//Get all DRUG objects and update their shipment & OWNER info
	//let drugSearchResultsIterator = await stub.getStateByPartialCompositeKey('org.pharma-network.pharmanet.drug', [drugName]);


}

//============================================================================================================================================
//											The following are private UTIL functions
//============================================================================================================================================

/**
 * Convert the object of this model to a buffer stream
 * @returns {Buffer}
 */
function toBuffer(jsonObj) {
	return Buffer.from(JSON.stringify(jsonObj));
}
//============================================================================================================================================
/**
 * Convert the buffer stream received from blockchain into an object of this model
 * @param buffer {Buffer}
 */
function fromBuffer(buffer) {
	return JSON.parse(buffer.toString());
}
//============================================================================================================================================
/**
 * This is private function to iterate Search Results with Partial Key
 * @param {*} iterator :	Iterator of getStateByPartialCompositeKey
 */
async function getAllResults(iterator) {
	const allResults = [];
	while (true) {
        const res = await iterator.next();
        if (res.value && res.value.value.toString()) {
            // if not a getHistoryForKey iterator then key is contained in res.value.key
			//allResults.push(res.value.value.toString('utf8'));
			console.log(res.value.value.toString('utf8'));
			allResults.push(JSON.parse(res.value.value.toString('utf8')));
        }

        // check to see if we have reached then end
        if (res.done) {
            // explicitly close the iterator            
			await iterator.close();
            return allResults;
        }
    }
}
//============================================================================================================================================
async function searchCompanyByCRN(ctx,companyCRN){
	const companySearchResultsIterator = await ctx.stub.getStateByPartialCompositeKey('org.pharma-network.pharmanet.company', [companyCRN]);
	return await getAllResults(companySearchResultsIterator);
	
}

//============================================================================================================================================
async function searchDrugByName(ctx,drugName){
	return await getAllResults(await ctx.stub.getStateByPartialCompositeKey('org.pharma-network.pharmanet.drug', [drugName]));
	
}
//============================================================================================================================================

module.exports.createPO = createPO;
module.exports.createShipment = createShipment;
module.exports.updateShipment = updateShipment;
module.exports.registerCompany = registerCompany;

module.exports.searchDrugByName = searchDrugByName;
module.exports.searchCompanyByCRN = searchCompanyByCRN;
