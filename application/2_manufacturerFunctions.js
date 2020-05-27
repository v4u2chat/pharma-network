'use strict';
const helper = require('./contractHelper');

async function registerCompany(orgType,reqPayload) {
	
	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const registerCompanyBuffer = await contractInstance.submitTransaction('registerCompany', reqPayload.companyCRN, reqPayload.companyName, reqPayload.location, reqPayload.organisationRole);
		console.log('.....Processing registerCompany Transaction Response \n\n');
		let newCompany = JSON.parse(registerCompanyBuffer.toString());
		console.log(newCompany);
		console.log('\n\n.....registerCompany Transaction Complete!');
        return newCompany;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking registerCompany : ${error.message} \n ${error}`);
	} finally {
		// Disconnect from the fabric gateway
		helper.disconnect();
		
	}
}

async function addDrug(orgType,reqPayload) {
	
	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const addDrugBuffer = await contractInstance.submitTransaction('addDrug', reqPayload.drugName, reqPayload.serialNo, reqPayload.mfgDate, reqPayload.expDate, reqPayload.companyCRN);
		console.log('.....Processing addDrug Transaction Response \n\n');
		let newDrug = JSON.parse(addDrugBuffer.toString());
		console.log(newDrug);
		console.log('\n\n.....addDrug Transaction Complete!');
        return newDrug;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking addDrug : ${error.message} \n ${error}`);
	} finally {
		// Disconnect from the fabric gateway
		helper.disconnect();
		
	}
}

async function viewDrugCurrentState(orgType,reqPayload) {
	
	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const viewDrugCurrentStateBuffer = await contractInstance.submitTransaction('viewDrugCurrentState', reqPayload.drugName, reqPayload.serialNo);
		console.log('.....Processing viewDrugCurrentState Transaction Response \n\n');
		let drugState = JSON.parse(viewDrugCurrentStateBuffer.toString());
		console.log(drugState);
		console.log('\n\n.....viewDrugCurrentState Transaction Complete!');
        return drugState;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking viewDrugCurrentState : ${error.message} \n ${error}`);
	} finally {
		// Disconnect from the fabric gateway
		helper.disconnect();
		
	}
}

async function viewHistory(orgType,reqPayload) {
	
	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const viewHistoryBuffer = await contractInstance.submitTransaction('viewHistory', reqPayload.drugName, reqPayload.serialNo);
		console.log('.....Processing viewHistory Transaction Response \n\n');
		let drugState = JSON.parse(viewHistoryBuffer.toString());
		console.log(drugState);
		console.log('\n\n.....viewHistory Transaction Complete!');
        return drugState;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking viewHistory : ${error.message} \n ${error}`);
	} finally {
		// Disconnect from the fabric gateway
		helper.disconnect();
		
	}
}

exports.addDrug = addDrug;
exports.viewHistory = viewHistory;
exports.registerCompany = registerCompany;
exports.viewDrugCurrentState = viewDrugCurrentState;
