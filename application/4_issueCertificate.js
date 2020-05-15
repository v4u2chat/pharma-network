'use strict';

/**
 * This is a Node.JS application to Issue a Certificate to Student
 * Defaults:
 * StudentID: 0001
 * CourseID: PGDBC
 * Grade: A
 * Certificate Hash: asdfgh
 */

const helper = require('./contractHelper');

async function main() {
	
	try {
		const certnetContract = await helper.getContractInstance();
		
		// Create a new student account
		console.log('.....Issue Certificate To Student');
		const certificateBuffer = await certnetContract.submitTransaction('issueCertificate', '0001', 'PGDBC', 'A', 'asdfgh');
		
		// process response
		console.log('.....Processing Issue Certificate Transaction Response \n\n');
		let newCertificate = JSON.parse(certificateBuffer.toString());
		console.log(newCertificate);
		console.log('\n\n.....Issue Certificate Transaction Complete!');
		
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