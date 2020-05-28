const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;

// Import all function modules
const addToWallet = require('./1_addToWallet');
const contractFunctions = require('./contractFunctions');

// Define Express app settings
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set('title', 'PharmaNet App');

app.get('/', (req, res) => res.send('Hello Blockchain World, Here comes our hyperledger fabric based PharmaNet App'));

// ________________________________________________________API route to invoke "initializeAllIdentititiesAtOnce"
app.get('/initializeAllIdentititiesAtOnce', (req, res) => {
	addToWallet.initializeAllIdentititiesAtOnce()
		.then(() => {
			const result = {
				status: 'success',
				message: `All organisation user credentials added to wallet`
			};
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		});
});
// ________________________________________________________ API route to invoke "addToWallet"
app.post('/addToWallet', (req, res) => {
	addToWallet.addIdentity(req.body.orgType, req.body.privateKeyFileName)
			.then(() => {
				console.log(`${req.body.orgType}'s User credentials added to wallet`);
				const result = {
					status: 'success',
					message: `${req.body.orgType}'s User credentials added to wallet`
				};
				res.json(result);
			})
			.catch((e) => {
				const result = {
					status: 'error',
					message: 'Failed',
					error: e
				};
				res.status(500).send(result);
			});
});
// ________________________________________________________ API route to invoke "addToWallet"
app.post('/registerCompany', (req, res) => {
	contractFunctions.registerCompany(req.body.orgType,req.body)
	.then((response) => {
		const result = {
			status: 'success',
			message: `registerCompany invoked successfully`,
			response : response
		};
		res.json(result);
	})
	.catch((e) => {
		const result = {
			status: 'ERROR',
			message: 'Failed',
			error: e.message
		};
		res.status(500).send(result);
	});
});

// ________________________________________________________ API route to invoke "addDrug"
app.post('/addDrug', (req, res) => {
	contractFunctions.addDrug(req.body.orgType,req.body)
	.then((response) => {
		const result = {
			status: 'success',
			message: `addDrug invoked successfully`,
			response : response
		};
		res.json(result);
	})
	.catch((e) => {
		const result = {
			status: 'ERROR',
			message: 'Failed',
			error: e.message
		};
		res.status(500).send(result);
	});
});

// ________________________________________________________ API route to invoke "createPO"
app.post('/createPO', (req, res) => {
	contractFunctions.createPO(req.body.orgType,req.body)
	.then((response) => {
		const result = {
			status: 'success',
			message: `createPO invoked successfully`,
			response : response
		};
		res.json(result);
	})
	.catch((e) => {
		const result = {
			status: 'ERROR',
			message: 'Failed',
			error: e.message
		};
		res.status(500).send(result);
	});
});
// ________________________________________________________ API route to invoke "createShipment"
app.post('/createShipment', (req, res) => {
	contractFunctions.createShipment(req.body.orgType,req.body)
	.then((response) => {
		const result = {
			status: 'success',
			message: `createShipment invoked successfully`,
			response : response
		};
		res.json(result);
	})
	.catch((e) => {
		const result = {
			status: 'ERROR',
			message: 'Failed',
			error: e.message
		};
		res.status(500).send(result);
	});
});
// ________________________________________________________ API route to invoke "updateShipment"
app.post('/updateShipment', (req, res) => {
	contractFunctions.updateShipment(req.body.orgType,req.body)
	.then((response) => {
		const result = {
			status: 'success',
			message: `updateShipment invoked successfully`,
			response : response
		};
		res.json(result);
	})
	.catch((e) => {
		const result = {
			status: 'ERROR',
			message: 'Failed',
			error: e.message
		};
		res.status(500).send(result);
	});
});
// ________________________________________________________ API route to invoke "retailDrug"
app.post('/retailDrug', (req, res) => {
	contractFunctions.retailDrug(req.body.orgType,req.body)
	.then((response) => {
		const result = {
			status: 'success',
			message: `retailDrug invoked successfully`,
			response : response
		};
		res.json(result);
	})
	.catch((e) => {
		const result = {
			status: 'ERROR',
			message: 'Failed',
			error: e.message
		};
		res.status(500).send(result);
	});
});
// ________________________________________________________ API route to invoke "viewHistory"
app.post('/viewHistory', (req, res) => {
	contractFunctions.viewHistory(req.body.orgType,req.body)
	.then((response) => {
		const result = {
			status: 'success',
			message: `viewHistory invoked successfully`,
			response : response
		};
		res.json(result);
	})
	.catch((e) => {
		const result = {
			status: 'ERROR',
			message: 'Failed',
			error: e.message
		};
		res.status(500).send(result);
	});
});
// ________________________________________________________ API route to invoke "viewDrugCurrentState"
app.post('/viewDrugCurrentState', (req, res) => {
	contractFunctions.viewDrugCurrentState(req.body.orgType,req.body)
	.then((response) => {
		const result = {
			status: 'success',
			message: `viewDrugCurrentState invoked successfully`,
			response : response
		};
		res.json(result);
	})
	.catch((e) => {
		const result = {
			status: 'ERROR',
			message: 'Failed',
			error: e.message
		};
		res.status(500).send(result);
	});
});
// Starting the SERVER on Port No 3000
app.listen(port, () => console.log(`Distributed PharmeNet App listening on port ${port}!`));