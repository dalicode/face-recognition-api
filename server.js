const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const knex = require('knex');
const saltRounds = 10;
const Clarifai = require('clarifai');

const cApp = new Clarifai.App({
	apiKey: 'c400f7a917204671b49178f2da246228'
  });

const db = knex({
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		port: '5433',
		user: 'postgres',
		password: 'test',
		database: 'smartbrain'
	}
});

const app = express();
app.use(bodyParser.json())
app.use(cors());

app.get('/', (req, res) => {
	res.send(database.users);
})

app.post('/imageurl', (req, res) => {
	cApp.models.predict('a403429f2ddf4b49b307e318f00e528b', req.body.input)
	.then (response => res.json(response))
	.catch (err => res.status(400).json('unable to work with API'))
})

app.post('/signin', (req, res) => {
	const { email, password } = req.body;
	db.select('email', 'hash').from('login')
	.where('email', '=' , email)
	.then(data => {
		if (bcrypt.compareSync (password, data[0].hash)){
			return db.select('*').from('users')
			.where('email', '=', email)
			.then(user => {
				res.json(user[0])
			})
			.catch(err => console.log("Unable to get user"))
		} else {
		res.status(400).json("invalid username or password")
		}
	})
	.catch(err => res.status(400).json("invalid username or password"))
})

app.post('/register', (req, res) => {
	const { email, name, password } = req.body;
	const hash = bcrypt.hashSync(password, saltRounds);

	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			 return trx('users')
			.returning('*')
			.insert({
				name: name,
				email: loginEmail[0],
				joined: new Date()
			}).then(user => res.json(user[0]))
		})	
		.then(trx.commit)
		.catch(trx.rollback)
	})	
	.catch(err => res.status(400).json("Unable to register."))
})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	db.select('*').from('users').where({ id })
		.then(user => {
			if (user.length) {
				res.json(user[0])
			} else {
				res.status(400).json('user not found')
			}
		})
})


app.put('/image', (req, res) => {
	const { id } = req.body;
	db('users').where('id', '=', id)
		.increment({ entries: 1 })
		.returning('entries')
		.then(entries => res.json(entries[0]))
		.catch(err => res.status(400).json('unable to update entries'))
})

app.listen(process.env.PORT || 3000, () => {
	console.log(`app is running on port 3000 ${process.env.PORT}`);
})