'use strict';

/**
 * This is a Node.JS module to load a user's Identity to his wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: MHRD_ADMIN
 *  User Organization: MHRD
 *  User Role: Admin
 *
 */

const fs = require('fs'); // FileSystem Library
const { FileSystemWallet, X509WalletMixin } = require('fabric-network'); // Wallet Library provided by Fabric
const path = require('path'); // Support library to build filesystem paths in NodeJs

const crypto_materials = path.resolve(__dirname, '../network/crypto-config'); // Directory where all Network artifacts are stored

// A wallet is a filesystem path that stores a collection of Identities
const wallet = new FileSystemWallet('./identity/mhrd');

async function main() {
	
	// Main try/catch block
	try {
		
		// Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
		const credentialPath = path.join(crypto_materials, '/peerOrganizations/mhrd.certification-network.com/users/Admin@mhrd.certification-network.com');
		const certificate = fs.readFileSync(path.join(credentialPath, '/msp/signcerts/Admin@mhrd.certification-network.com-cert.pem')).toString();
		// IMPORTANT: Change the private key name to the key generated on your computer
		const privatekey = fs.readFileSync(path.join(credentialPath, '/msp/keystore/6293f68e41e8550b43a28046a5a900b390e4cda3e452d3426e8562459a59cfb3_sk')).toString();
		
		// Load credentials into wallet
		const identityLabel = 'MHRD_ADMIN';
		const identity = X509WalletMixin.createIdentity('mhrdMSP', certificate, privatekey);
		
		await wallet.import(identityLabel, identity);
		
	} catch (error) {
		console.log(`Error adding to wallet. ${error}`);
		console.log(error.stack);
	}
}

main().then(() => {
	console.log('Added New Client Identity for Admin User in MHRD\'s wallet.');
}).catch((e) => {
	console.log(e);
	console.log(e.stack);
	process.exit(-1);
});