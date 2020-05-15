'use strict';

/**
 * This is a Node.JS application to add a new student on the network.
 * Defaults:
 * StudentID: 0001
 * Name: Aakash Bansal
 * Email: connect@aakashbansal.com
 */

const fs = require('fs');
const yaml = require('js-yaml');
const { FileSystemWallet, Gateway } = require('fabric-network');
let gateway;

async function main() {
	
	try {
		const certnetContract = await getContractInstance();
		
		// Create a new student account
		console.log('.....Create a new Student account');
		const studentBuffer = await certnetContract.submitTransaction('createStudent', '0001', 'Aakash Bansal', 'connect@aakashbansal.com');
		
		// process response
		console.log('.....Processing Create Student Transaction Response \n\n');
		let newStudent = JSON.parse(studentBuffer.toString());
		console.log(newStudent);
		console.log('\n\n.....Create Student Transaction Complete!');
		
	} catch (error) {
		
		console.log(`\n\n ${error} \n\n`);
		
	} finally {
		
		// Disconnect from the fabric gateway
		console.log('.....Disconnecting from Fabric Gateway');
		gateway.disconnect();
		
	}
}

async function getContractInstance() {
	
	// A gateway defines which peer is used to access Fabric network
	// It uses a common connection profile (CCP) to connect to a Fabric Peer
	// A CCP is defined manually in file connection-profile-iit.yaml
	gateway = new Gateway();
	
	// A wallet is where the credentials to be used for this transaction exist
	// Credentials for user IIT_ADMIN was initially added to this wallet.
	const wallet = new FileSystemWallet('./identity/mhrd');
	
	// What is the username of this Client user accessing the network?
	const fabricUserName = 'MHRD_ADMIN';
	
	// Load connection profile; will be used to locate a gateway; The CCP is converted from YAML to JSON.
	let connectionProfile = yaml.safeLoad(fs.readFileSync('./connection-profile-mhrd.yaml', 'utf8'));
	
	// Set connection options; identity and wallet
	let connectionOptions = {
		wallet: wallet,
		identity: fabricUserName,
		discovery: { enabled: false, asLocalhost: true }
	};
	
	// Connect to gateway using specified parameters
	console.log('.....Connecting to Fabric Gateway');
	await gateway.connect(connectionProfile, connectionOptions);
	
	// Access certification channel
	console.log('.....Connecting to channel - certificationchannel');
	const channel = await gateway.getNetwork('certificationchannel');
	
	// Get instance of deployed Certnet contract
	// @param Name of chaincode
	// @param Name of smart contract
	console.log('.....Connecting to Certnet Smart Contract');
	return channel.getContract('certnet', 'org.certification-network.certnet');
}

main().then(() => {
	
	console.log('.....API Execution Complete!');
	
}).catch((e) => {
	
	console.log('.....Transaction Exception: ');
	console.log(e);
	console.log(e.stack);
	process.exit(-1);
	
});