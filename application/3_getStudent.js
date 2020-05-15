'use strict';

/**
 * This is a Node.JS application to fetch a Student Account from network
 * Defaults:
 * StudentID: 0001
 */

const helper = require('./contractHelper');

async function main() {
	
	try {
		const certnetContract = await helper.getContractInstance();
		
		// Create a new student account
		console.log('.....Get Student Account');
		const studentBuffer = await certnetContract.submitTransaction('getStudent', '0001');
		
		// process response
		console.log('.....Processing Get Student Transaction Response\n\n');
		let existingStudent = JSON.parse(studentBuffer.toString());
		console.log(existingStudent);
		console.log('\n\n.....Get Student Transaction Complete!');
		
	} catch (error) {
		
		console.log(`\n\n ${error} \n\n`);
		
	} finally {
		
		// Disconnect from the fabric gateway
		helper.disconnect();
		
	}
}

main().then(() => {
	
	console.log('.....API Execution Complete!');
	
}).catch((e) => {
	
	console.log('.....Transaction Exception: ');
	console.log(e);
	console.log(e.stack);
	process.exit(-1);
	
});