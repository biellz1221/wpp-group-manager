import { NowRequest, NowResponse } from "@vercel/node";
import { connectToDatabase } from "../../config/database";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import stringToSlug from "../../lib/stringToSlug";
import { IUser } from "./users";

const cors = initMiddleware(
	Cors({
		methods: ["POST", "GET"],
	})
);

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

		const teamsCollection = await db.collection("teams");

		if (req.method == "GET") {
			if (!user.teams.includes("adm")) return res.json({ teams: user.teams });

			const teams = [] as string[];
			await teamsCollection.find().forEach((team) => {
				teams.push(team.name);
			});

			return res.json({ teams });
		}

		if (req.method == "POST") {
			await teamsCollection.createIndex({ name: 1 }, { unique: true });
			if (!user.teams.includes("adm"))
				return res.status(403).json({
					message: "Usuário não pode criar times, apenas administradores",
				});

			const { team } = req.body;
			if (!team)
				return res.status(400).json({ message: "Time não informado." });

			const name = stringToSlug(team);
			const { ops } = await teamsCollection.insertOne({ name });

			return res.json(ops[0]);
		}
	} catch (error) {
		console.log(error);
		if (error?.code == 11000)
			return res
				.status(400)
				.json({ message: `Time '${error.keyValue.name}' já está cadastrado.` });
	}
};
