import { MongoClient, Db } from "mongodb";
import url from "url";

const uriDatabase =
	(process.env.NODE_ENV == "production"
		? process.env.MONGODB_URL_PRODUCTION
		: process.env.MONGODB_URL_TEST) || "/";

if (uriDatabase === "/") {
	const environmentVariable =
		process.env.NODE_ENV == "production"
			? "MONGODB_URL_PRODUCTION"
			: "MONGODB_URL_TEST";
	const environmentStatus =
		process.env.NODE_ENV == "production"
			? "produção"
			: process.env.NODE_ENV == "development"
			? "desenvolvimento"
			: "teste";
	throw new Error(
		`É necessário configurar a variável de ambiente ${environmentVariable}: Servidor em ${environmentStatus}`
	);
}

let cachedDb: Db | null = null;

async function connectToDatabase() {
	if (cachedDb) return cachedDb;

	const client = await MongoClient.connect(uriDatabase, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	const dbName = url.parse(uriDatabase).pathname?.substr(1);

	const db = client.db(dbName);

	cachedDb = db;

	return db;
}

export { connectToDatabase };
