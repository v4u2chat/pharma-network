const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;

// Import all function modules
const addToWallet = require('./1_addToWallet');

// Define Express app settings
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set('title', 'PharmaNet App');

app.get('/', (req, res) => res.send('Hello Blockchain World, Here comes our hyperledger fabric based PharmaNet App'));

app.post('/initializeAllIdentititiesAtOnce', (req, res) => {
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

app.listen(port, () => console.log(`Distributed PharmeNet App listening on port ${port}!`));