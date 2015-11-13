module.exports = {
	help: {
		boolean: true,
		describe: "Display this message."
	},
	port: {
		alias: "p",
		default: "3000",
		describe: "Port used to lift the server."
	},
	env: {
		default: "dev",
		describe: "Environment in which to run the server."
	},
	DB_PORT: {
		default: 27017,
		describe: "Port of the mongodb server."
	},
	DB_HOST: {
		default: '127.0.0.1',
		describe: "Host of the mongodb server."
	},
	DB_USER: {
		default: '',
		describe: "User of the mongodb server."
	},
	DB_NAME: {
		default: 'touchka-refsys',
		describe: "Database of the mongodb server."
	},
	DB_PASS: {
		default: '',
		describe: "Password of the mongodb server."
	},
	ENTRYPOINT: {
		alias: 'EP',
		default: "http://localhost:3030",
		describe: "Central endpoint for all services."
	},
	AUTH_URL: {
		default: "http://localhost:3030",
		describe: "URL of the auth server of drivers."
	}
};
