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
 * Initiator: Any Member of the network other than consumet
 * 
 * @param companyCRN -  Name of the Drug
 * @param companyName - Drug's serial no
 * @param location -  Date of manufacturing of the drug
 * @param organisationRole - Expiration date of the drug
 * 
 * @returns  A ‘Company’ asset on the ledger
 */
async function registerCompany(ctx, companyCRN, companyName, location, organisationRole) {

	// Validation to allow ONLY ‘Manufacturer’ or ‘Distributor’ or ‘Retailer’  or ‘Transporter’ to perform this operation
	if('consumerMSP'==ctx.clientIdentity.mspId ){
		throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
	}

	// Validate the organisationRole
	if(!organisationRoleMap[organisationRole]){	
		throw new Error('Invalid Organisation Role : ' + organisationRole );
	}

	// Validate the existence of any other company with same CRN
	let companySearchResults = await searchCompanyByCRN(ctx, companyCRN);
	if(companySearchResults.length>0){
		throw new Error('Invalid COMPANY Details. Another company with this CRN already exists.');
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
	await ctx.stub.putState(companyID, toBuffer(newCompanyObject));

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
 * @returns  A ‘PO’ asset on the ledger
 */
async function createPO(ctx, buyerCRN, sellerCRN, drugName,quantity) {

	// Validation to allow ONLY ‘Distributor’ or ‘Retailer’ to perform this operation
	if('distributorMSP'!=ctx.clientIdentity.mspId && 'retailerMSP'!=ctx.clientIdentity.mspId){
		throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
	}

	//	Validate  BUYER existstance 
	let buyerCompanySearchResults = await searchCompanyByCRN(ctx, buyerCRN);
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

	//	Validate DRUG existence in the network
	let drugSearchResults = await searchDrugByName(ctx, drugName);
	if(drugSearchResults.length==0){
		throw new Error('No DRUG available with specified name '+drugName);
	}
	//	Validate DRUG existence with Manufacturer
	let drugFoundWithSeller = false;
	for(var i=0;i<drugSearchResults.length; i++) {
		var drugFoundWithSameName = drugSearchResults[i];
		if(drugFoundWithSameName.owner===sellerCompanyInfo.companyID){
			drugFoundWithSeller=true;
			break;
		}
	}
	if(!drugFoundWithSeller){
		throw new Error('SELLER does not own this DRUG : '+drugName);
	}

	//	Validate BUYing process takes place hierarcal manner
	if(parseInt(sellerCompanyInfo.hierarchyKey)+1 != parseInt(buyerCompanyInfo.hierarchyKey)){
		throw new Error('You can\'t purchase directly from '+sellerCompanyInfo.organisationRole+ " sellerCompanyInfo.hierarchyKey : "+sellerCompanyInfo.hierarchyKey+ " buyerCompanyInfo.hierarchyKey : "+buyerCompanyInfo.hierarchyKey);
	}

	// Create a new composite key for the new Purchase Order
	const poID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.po', [buyerCRN,drugName]);
	console.log("createPO >> poID >> "+poID);
	// Create a PO model object to be stored in ledger
	let newPurchaseOrderObject = {
		poID: poID
		,drugName: drugName
		,buyerCRN: buyerCRN
		,sellerCRN: sellerCRN
		,quantity: parseInt(quantity)
		,additionalInfo : {	
			buyerCompanyID : buyerCompanyInfo.companyID
			,sellerCompanyID : sellerCompanyInfo.companyID
		}
	};
	
	// Convert the JSON object to a buffer and send it to blockchain for storage
	let newPurchaseOrderObjectDataBuffer = toBuffer(newPurchaseOrderObject);
	await ctx.stub.putState(poID, newPurchaseOrderObjectDataBuffer);
	
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
 * @returns  A ‘Shipment’ asset on the ledger
 */
async function createShipment(ctx, buyerCRN, drugName, listOfAssets, transporterCRN) {

	// Validation to allow ONLY ‘Manufacturer’ or ‘Distributor’ or ‘Retailer’ to perform this operation
	if('distributorMSP'!=ctx.clientIdentity.mspId && 'retailerMSP'!=ctx.clientIdentity.mspId  && 'manufacturerMSP'!=ctx.clientIdentity.mspId){
		throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
	}
	
	//	Validate BUYER existstance 
	let buyerCompanySearchResults = await searchCompanyByCRN(ctx, buyerCRN);
	if(buyerCompanySearchResults.length==0){
		throw new Error('Invalid BUYER CRN.');
	}

	//	Validate BUYER type 
	if(buyerCompanySearchResults[0].hierarchyKey==1){
		throw new Error('BUYER can\'t be Manufacturer');
	}

	//	Validate transporter existstance 
	let transporterCompanySearchResults = await searchCompanyByCRN(ctx, transporterCRN);
	if(transporterCompanySearchResults.length==0){
		throw new Error('Invalid Transporter CRN.');
	}


	//	Validate :  Existense of PO with buyer and DRUG
	const poID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.po', [buyerCRN,drugName]);
	let poDataBuffer = await ctx.stub.getState(poID).catch(err => console.log(err));
	if (!poDataBuffer.toString()) {
		throw new Error('Invalid operation. No PO raised for BUYER :'+buyerCRN+", DRUG : "+drugName);
	}
	const poDetails = fromBuffer(poDataBuffer);

	//	Validate :  The length of ‘listOfAssets’ should be exactly equal to the quantity specified in the PO.
	var listOfAssetsArray = JSON.parse(listOfAssets);
	if(listOfAssetsArray.length!=parseInt(poDetails.quantity)){
		throw new Error('List of Assets should be equal to PO quantity.');
	}

	//	Validate DRUG existence in the network
	let drugSearchResults = await searchDrugByName(ctx, drugName);
	if(drugSearchResults.length==0){
		throw new Error('No DRUG available with specified name '+drugName);
	}
	
	//	Validate DRUG existence with Manufacturer
	let drugFoundWithSeller = false;
	let drugAssetsToBeAttached = [];
	let j=0;
	for(var i=0;i<drugSearchResults.length; i++) {
		var drugFoundWithSameName = drugSearchResults[i];
		
		// Check the DRUG is available with SELLER 
		if(drugFoundWithSameName.owner===poDetails.additionalInfo.sellerCompanyID){
			drugFoundWithSeller=true;
			if(listOfAssetsArray[i] == drugFoundWithSameName.serialNo){
				drugAssetsToBeAttached.push(drugFoundWithSameName.productID);
				j++;
			}

			if(drugAssetsToBeAttached.length==poDetails.quantity){
				break;
			}
		}
	}
	//	Validate STOCK availability
	if(!drugFoundWithSeller){
		throw new Error('SELLER does not own this DRUG : '+drugName);
	}
	//	Validate STOCK availability
	if(drugAssetsToBeAttached.length<poDetails.quantity){
		throw new Error('At this moment, SELLER does not have sufficient stock of DRUG : '+drugName);
	}
	// Create a new composite key for the new SHIPMENT Order
	const shipmentID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.shipment', [buyerCRN,drugName]);
	// Create a PO model object to be stored in ledger
	let newShipmentObject = {
		shipmentID: shipmentID
		,creator : buyerCompanySearchResults[0].companyID
		,assets : drugAssetsToBeAttached
		,transporterCRN: transporterCRN
		,status: 'IN-TRANSIT'
	};
	
	// Convert the JSON object to a buffer and send it to blockchain for storage
	await ctx.stub.putState(shipmentID, toBuffer(newShipmentObject));
	
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
 * @returns  Updated ‘Shipment’ asset on the ledger
 */
async function updateShipment(ctx, buyerCRN, drugName, transporterCRN) {

	//	Validate BUYER existstance 
	let buyerCompanySearchResults = await searchCompanyByCRN(ctx, buyerCRN);
	if(buyerCompanySearchResults.length==0){
		throw new Error('Invalid BUYER CRN.');
	}

	//	Validate transporter existstance 
	let transporterCompanySearchResults = await searchCompanyByCRN(ctx, transporterCRN);
	if(transporterCompanySearchResults.length==0){
		throw new Error('Invalid Transporter CRN.');
	}

	// Create a new composite key for the new SHIPMENT Order
	const shipmentID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.shipment', [buyerCRN,drugName]);
	let shipmentoDataBuffer = await ctx.stub.getState(shipmentID).catch(err => console.log(err));
	if (!shipmentoDataBuffer.toString()) {
		throw new Error('Invalid operation. Can\'t find any SHIPMENT with specified BUYER & DRUG');
	}
	const shipmentObject = fromBuffer(shipmentoDataBuffer);
	

	// Update all DRUG assets with new OWNER and shipment details
	for(var i=0;i<shipmentObject.assets.length;i++){
		const drugObjectDataBuffer = await ctx.stub.getState(shipmentObject.assets[i]).catch(err => console.log(err));
		let drugObject = fromBuffer(drugObjectDataBuffer);

		drugObject.owner = buyerCompanySearchResults[0].companyID;
		drugObject.shipment.push(shipmentID);

		console.log("updateShipment >> drugObject  >> ",drugObject);
		await ctx.stub.putState(drugObject.productID, Buffer.from(JSON.stringify(drugObject)));
	}
	
	// Update status to DELIVERED and Convert the JSON object to a buffer and send it to ledger for storage
	shipmentObject.status = 'DELIVERED';
	await ctx.stub.putState(shipmentID, toBuffer(shipmentObject));

	return shipmentObject;
}
//===============================================================================================================================================
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
async function retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar) {

	// Validation to allow ONLY ‘Retailer’ to perform this operation
	if('retailerMSP'!=ctx.clientIdentity.mspId){
		throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
	}
	
	//	Validate retailerCRN existstance 
	let retailerCompanySearchResults = await searchCompanyByCRN(ctx, retailerCRN);
	if(retailerCompanySearchResults.length==0){
		throw new Error('Invalid Retailer CRN.');
	}

	//	Validate whether DRUG available with specified serialNo
	const productID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.drug', [drugName,serialNo]);
	let drugObjectDataBuffer = await ctx.stub.getState(productID).catch(err => console.log(err));
	if (!drugObjectDataBuffer.toString()) {
		throw new Error('No DRUG available with specified Name & Serial No',drugName,serialNo);
	}
	const drugObject = fromBuffer(drugObjectDataBuffer);

	if(drugObject.owner!=retailerCompanySearchResults[0].companyID){
		throw new Error('You can\'t sell this DRUG as you are not the OWNER of this DRUG ',drugName,serialNo);
	}

	drugObject.owner = customerAadhar;
	await ctx.stub.putState(productID, Buffer.from(JSON.stringify(drugObject)));

	return drugObject;

}

//============================================================================================================================================
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
async function viewHistory(ctx, drugName, serialNo) {

	//	Validate whether DRUG available with specified serialNo
	const productID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.drug', [drugName,serialNo]);
	let historyQueryIterator = await ctx.stub.getHistoryForKey(productID).catch(err => console.log(err));
	const historyValues = getAllResults(historyQueryIterator);
	
	return historyValues;
}

//============================================================================================================================================
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
async function viewDrugCurrentState(ctx, drugName, serialNo) {

	//	Validate whether DRUG available with specified serialNo
	const productID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.drug', [drugName,serialNo]);
	let drugObjectDataBuffer = await ctx.stub.getState(productID).catch(err => console.log(err));
	if (!drugObjectDataBuffer.toString()) {
		throw new Error('No DRUG available with specified Name & Serial No',drugName,serialNo);
	}
	return fromBuffer(drugObjectDataBuffer);
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
module.exports.retailDrug = retailDrug;
module.exports.viewHistory = viewHistory;
module.exports.createShipment = createShipment;
module.exports.updateShipment = updateShipment;
module.exports.registerCompany = registerCompany;
module.exports.viewDrugCurrentState = viewDrugCurrentState;

module.exports.searchDrugByName = searchDrugByName;
module.exports.searchCompanyByCRN = searchCompanyByCRN;
