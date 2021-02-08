import { NowRequest, NowResponse } from "@vercel/node";
import { connectToDatabase } from "../../config/database";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import Cors from "cors";
import bcrypt from "bcrypt";
import initMiddleware from "../../lib/init-middleware";

const cors = initMiddleware(
	Cors({
		methods: ["POST"],
	})
);

export interface IUser {
	_id: ObjectId;
	name: string;
	email: string;
	password: string;
	teams: string[];
}

export default async (req: NowRequest, res: NowResponse) => {
	await cors(req, res);

	const token = req.headers.authorization;
	if (!token)
		return res
			.status(403)
			.json({ message: "Token não informada no cabeçalho" });
	try {
		const { id }: any = await jwt.verify(
			token,
			process.env.TOKEN_SECRET as string
		);
		const _id = new ObjectId(id);
		const db = await connectToDatabase();
		const usersCollection = db.collection("users");
		const user: IUser | null = await usersCollection.findOne(
			{ _id },
			{ projection: { name: true, teams: true } }
		);
		if (!user) return res.status(403).json({ message: "Token inválida" });

		const currentTeams = [] as string[];
		await db
			.collection("teams")
			.find()
			.forEach((team) => {
				currentTeams.push(team.name);
			});

		if (req.method == "GET") {
			if (!user.teams.includes("adm"))
				return res
					.status(403)
					.json({ message: "Acesso restrito a administradores." });

			const users = [] as Array<IUser>;
			await usersCollection
				.find({}, { projection: { password: false } })
				.forEach((user: IUser) => {
					const serializedUser = { id: user._id.toHexString(), ...user };
					delete serializedUser["_id"];
					users.push(serializedUser);
				});

			return res.json({ users, currentTeams });
		}

		if (req.method == "POST") {
			const { name, email, password, teams } = req.body;
			if (!Array.isArray(teams))
				return res.status(400).json({
					message: "É preciso enviar um array com os times do usuário.",
				});

			const seralizedTeams = teams.map((team) => {
				if (currentTeams?.includes(team) && user.teams?.includes(team || "adm"))
					return team;
			});

			if (seralizedTeams.length == 0)
				return res.status(400).json({
					message: "Nenhum time válido foi informado no array.",
				});
			const hash = await bcrypt.hash(password, 5);
			const { ops } = await usersCollection.insertOne({
				name,
				email,
				password: hash,
				teams: seralizedTeams,
			});
			const id = ops[0]["_id"];
			const token = jwt.sign({ id }, process.env.TOKEN_SECRET as string);
			return res.json({ token });
		}
	} catch (err) {
		if (err.code == 11000 && err.keyValue.email)
			return res
				.status(400)
				.json({ message: `Email '${err.keyValue.email}' já está cadastrado` });
		return res.status(400).json(err);
	}
};
