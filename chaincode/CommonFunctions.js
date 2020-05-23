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

/**
 * Convert the object of this model to a buffer stream
 * @returns {Buffer}
 */
function toBuffer(jsonObj) {
	return Buffer.from(JSON.stringify(jsonObj));
}

/**
 * Convert the buffer stream received from blockchain into an object of this model
 * @param buffer {Buffer}
 */
function fromBuffer(buffer) {
	return JSON.parse(buffer.toString());
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
async function registerCompany(ctx, companyCRN, companyName, location, organisationRole) {

	if(!organisationRoleMap[organisationRole]){	
		throw new Error('Invalid Organisation Role : ' + organisationRole );
	}

	// Create a new composite key for the new CRN
	const crnCacheID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.crncache', [companyCRN]);
	//	Validation to ensure - No other CRN exists across all companies
	let dataBuffer = await ctx.stub.getState(crnCacheID).catch(err => console.log(err));
	if (dataBuffer.toString()) {
		throw new Error('Invalid COMPANY Details. Another company with this CRN & Name already exists.');
	}


	// Create a new composite key for the new COMPANY
	const companyID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.company', [companyCRN,companyName]);

	//	Validation to ensure - No other company exists already with provided details 
	dataBuffer = await ctx.stub.getState(companyID).catch(err => console.log(err));
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
	await ctx.stub.putState(crnCacheID, toBuffer(newCompanyObject));	// For future retrievals with just CRN
	
	// Return value of new COMPANY object created
	return newCompanyObject;
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
async function createPO(ctx, buyerCRN, sellerCRN, drugName,quantity) {

	console.log("Distributor >> createPO >> "+ctx.clientIdentity.mspId);

	// Validation to allow ONLY ‘Distributor’ or ‘Retailer’ to perform this operation
	if('distributorMSP'!=ctx.clientIdentity.mspId && 'retailerMSP'!=ctx.clientIdentity.mspId){
		throw new Error('You are not authorized to perform this operation : Your Organization is : '+ctx.clientIdentity.mspId);
	}
	
	//	Validate whether BUYER existstance 
	const buyerCrnCacheID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.crncache', [buyerCRN]);
	let buyerCrnCacheDataBuffer = await ctx.stub.getState(buyerCrnCacheID).catch(err => console.log(err));
	if (!buyerCrnCacheDataBuffer.toString()) {
		throw new Error('Invalid BUYER CRN.');
	}
	const buyerCompanyInfo = fromBuffer(buyerCrnCacheDataBuffer);
	if(buyerCompanyInfo.hierarchyKey==1){
		throw new Error('BUYER can\'t be Manufacturer');
	}

	//	Validate whether SELLER existstance 
	const sellerCrnCacheID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.crncache', [sellerCRN]);
	let sellerCrnCacheDataBuffer = await ctx.stub.getState(sellerCrnCacheID).catch(err => console.log(err));
	if (!sellerCrnCacheDataBuffer.toString()) {
		throw new Error('Invalid SELLER CRN.');
	}
	const sellerCompanyInfo = fromBuffer(sellerCrnCacheDataBuffer);

	//	Validate BUYing process takes place hierarcal manner
	if(parseInt(sellerCompanyInfo.hierarchyKey)+1 != parseInt(buyerCompanyInfo.hierarchyKey)){
		throw new Error('You can\'t purchase directly from '+sellerCompanyInfo.organisationRole+ " sellerCompanyInfo.hierarchyKey : "+sellerCompanyInfo.hierarchyKey+ " buyerCompanyInfo.hierarchyKey : "+buyerCompanyInfo.hierarchyKey);
	}

	// Create a new composite key for the new Purchase Order
	const poID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.po', [drugName,buyerCRN]);
	
	// Create a PO model object to be stored in ledger
	let newPurchaseOrderObject = {
		poID: poID
		,drugName: drugName
		,buyerCRN: buyerCRN
		,sellerCRN: sellerCRN
		,quantity: quantity
	};
	
	// Convert the JSON object to a buffer and send it to blockchain for storage
	let newPurchaseOrderObjectDataBuffer = toBuffer(newPurchaseOrderObject);
	await ctx.stub.putState(poID, newPurchaseOrderObjectDataBuffer);
	
	ctx.stub.setEvent('createPO_Event', newPurchaseOrderObjectDataBuffer);

	return newPurchaseOrderObject;	// Return value of new  Purchase Order object created to user
}

module.exports.createPO = createPO;
module.exports.registerCompany = registerCompany;
