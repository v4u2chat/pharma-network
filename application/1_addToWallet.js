'use strict';

/**
 * This is a Node.JS module to load a user's Identity to his wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * 	User name would be <<ORG_NAME>>_ADMIN
 */

const fs = require('fs'); // FileSystem Library
const path = require('path'); // Support library to build filesystem paths in NodeJs
const { FileSystemWallet, X509WalletMixin } = require('fabric-network'); // Wallet Library provided by Fabric

const crypto_materials = path.resolve(__dirname, '../network/crypto-config'); // Directory where all Network artifacts are stored

// A wallet is a filesystem path that stores a collection of Identities
async function addIdentity(orgType,privateKeyFileName){
	try {
		const wallet = new FileSystemWallet('./identity/'+orgType+'');

		// Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
		const credentialPath = path.join(crypto_materials, '/peerOrganizations/'+orgType+'.pharma-network.com/users/Admin@'+orgType+'.pharma-network.com');
		const certificate = fs.readFileSync(path.join(credentialPath, '/msp/signcerts/Admin@'+orgType+'.pharma-network.com-cert.pem')).toString();

		// IMPORTANT: Change the private key name to the key generated on your computer
		const privatekey = fs.readFileSync(path.join(credentialPath, '/msp/keystore/'+privateKeyFileName)).toString();
		
		// Load credentials into wallet
		const identityLabel = orgType.toUpperCase()+'_ADMIN';
		const identity = X509WalletMixin.createIdentity(''+orgType+'MSP', certificate, privatekey);
		
		await wallet.import(identityLabel, identity);

		console.log(identityLabel +" identity added successfully");
		
	} catch (error) {
		console.log(error.stack);
		throw new Error(`Error adding to wallet. ${error}`);
	}
}

/**
 * This is a Node.JS module to load all user's Identity to their respective wallet.
 * This Identity will be used to sign transactions initiated by this user.
 */
async function initializeAllIdentititiesAtOnce() {
	try {
		await addIdentity('manufacturer','a3486388c31a90e9794f96157db2aa5606eaa896bfe944535323317c22d30e02_sk');
		await addIdentity('distributor','e20b1c8f306ec8a0e955dc9db7cb808bfd4422958bf7ada11094905d46eb55b8_sk');
		await addIdentity('retailer','36d65c3ad6c1bd8bd15cb5765e5fe6aac3138c1f71413654d2b95a0960642ca7_sk');
		await addIdentity('consumer','d6bd7312af941cd2a91af0b3b1c409bfd07af332db21fa406b6426c8f70b4032_sk');
		await addIdentity('transporter','d75d8a1333ace5d81efcf2b4e5f91db657e7d29c993d28593aabbe7ed50b3bb4_sk');
	} catch (error) {
		console.log(error.stack);
		throw new Error(`Error adding to wallet. ${error}`);
	}
}

exports.addIdentity = addIdentity;
exports.initializeAllIdentititiesAtOnce = initializeAllIdentititiesAtOnce;
