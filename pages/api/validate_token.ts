import { NowRequest, NowResponse } from "@vercel/node";
import { connectToDatabase } from "../../config/database";

import jwt from "jsonwebtoken";
import Cors from "cors";
import { ObjectId } from "mongodb";
import initMiddleware from "../../lib/init-middleware";

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
		const collection = db.collection("users");
		const user = await collection.findOne(
			{ _id },
			{ projection: { name: true, teams: true } }
		);
		if (!user) return res.status(403).json({ message: "Token inválida" });
		const allTeams = [] as string[];
		await db
			.collection("teams")
			.find()
			.forEach((team) => {
				allTeams.push(team.name);
			});

		const teams = user.teams.includes("adm") ? allTeams : user.teams;

		delete user._id;
		return res.json({ pass: true, user: { ...user, teams } });
	} catch (err) {
		console.log(err);
		return res.status(403).json({ message: "Token inválida", err });
	}
};
