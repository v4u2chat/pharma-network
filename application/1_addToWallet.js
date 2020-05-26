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


async function addIdentity(orgType,privateKeyFileName){
	// Main try/catch block
	try {
		const wallet = new FileSystemWallet('./identity/'+orgType+'');

		// Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
		const credentialPath = path.join(crypto_materials, '/peerOrganizations/'+orgType+'.pharma-network.com/users/Admin@'+orgType+'.pharma-network.com');
		const certificate = fs.readFileSync(path.join(credentialPath, '/msp/signcerts/Admin@'+orgType+'.pharma-network.com-cert.pem')).toString();
		// IMPORTANT: Change the private key name to the key generated on your computer
		//4467cbc87d9e0b1d56d1c4ccc5c3a72af27a9b17d2024db8cd7956dc4707045f_sk
		const privatekey = fs.readFileSync(path.join(credentialPath, '/msp/keystore/'+privateKeyFileName)).toString();
		
		// Load credentials into wallet
		const identityLabel = orgType+'_ADMIN';
		const identity = X509WalletMixin.createIdentity(''+orgType+'MSP', certificate, privatekey);
		
		await wallet.import(identityLabel, identity);

		console.log(identityLabel +" identity added successfully");
		
	} catch (error) {
		console.log(`Error adding to wallet. ${error}`);
		console.log(error.stack);
	}
}

async function main() {
	addIdentity('manufacturer','4467cbc87d9e0b1d56d1c4ccc5c3a72af27a9b17d2024db8cd7956dc4707045f_sk');
	addIdentity('distributor','d09d7a34e7399e527d3573d692e3a78a602261ccda5fe2053652a16026c2abf0_sk');
	addIdentity('retailer','8690deccd410bbea6c5fb1c1d0de04bc7bc5269abc03de2db7113c0e56edd08f_sk');
	addIdentity('consumer','e7a2a60709ac2255bba724ecd9626a8e9634c77b504f99a611077773af4557d6_sk');
	addIdentity('transporter','f12f6a352e07169511272969df1a1c28a1ef3648ce519d78b59bbbc2c254d37b_sk');
}

main().then(() => {
	console.log('Added New Client Identity for Admin User in all Organizations');
}).catch((e) => {
	console.log(e);
	console.log(e.stack);
	process.exit(-1);
});