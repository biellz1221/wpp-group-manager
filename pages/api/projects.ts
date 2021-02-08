import { NowRequest, NowResponse } from "@vercel/node";
import { connectToDatabase } from "../../config/database";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";
import stringToSlug from "../../lib/stringToSlug";

const cors = initMiddleware(
	Cors({
		methods: ["POST", "GET", "PATCH"],
	})
);
export interface ILink {
	_id: ObjectId;
	name: string;
	link: string;
	active: boolean;
	numLeads: number;
}

export interface IProject {
	_id: ObjectId;
	name: string;
	description: string;
	slug: string;
	trackerGoogleAnalytics?: string;
	trackerGoogleAds?: string;
	trackerFacebook?: string;
	team: string;
	links: ILink[];
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
		const user = await usersCollection.findOne(
			{ _id },
			{ projection: { name: true, teams: true } }
		);
		if (!user) return res.status(403).json({ message: "Token inválida" });

		const projectsCollection = db.collection("projects");
		if (req.method == "GET") {
			if (req.body.id) {
				if (!ObjectId.isValid(req.body.id))
					return res.status(400).json({
						message:
							"O id precisa ser uma número hexadecimal com 24 caracteres.",
					});
				const project = await projectsCollection.findOne({
					_id: new ObjectId(req.body.id),
				});
				return res.json(project);
			}
			const projects = [] as Array<IProject>;
			await projectsCollection.find().forEach((project: IProject) => {
				const id = project._id.toHexString();
				const serializedProject = { id, ...project };
				delete serializedProject["_id"];
				if (user.teams?.includes(serializedProject.team || "adm"))
					projects.push(serializedProject);
			});

			return res.json(projects);
		}

		const {
			name,
			description,
			links,
			trackerGoogleAnalytics,
			trackerGoogleAds,
			trackerFacebook,
			team,
		} = req.body;

		const currentTeams = [] as string[];
		await db
			.collection("teams")
			.find()
			.forEach((team) => {
				currentTeams.push(team.name);
			});

		if (req.method == "POST") {
			const slug = stringToSlug(name);
			const serializedTeam = stringToSlug(team);
			if (!currentTeams.includes(serializedTeam))
				return res
					.status(400)
					.json({ message: `O time ${serializedTeam} não está cadastrado.` });

			if (!user.teams.includes(serializedTeam || "adm"))
				return res.status(403).json({
					message:
						"Usuário só pode criar projetos no time em que está cadastrado.",
				});

			const { ops } = await projectsCollection.insertOne({
				name,
				description,
				slug,
				trackerGoogleAnalytics,
				trackerGoogleAds,
				trackerFacebook,
				links: links || [],
				team: serializedTeam,
			});
			const id = ops[0]._id.toHexString();
			return res.json({ id, slug });
		}

		if (req.method == "PATCH") {
			if (!id)
				return res.status(400).json({
					message: "Deve ser informado o id do link na variável id.",
				});
			const _id = new ObjectId(req.body.id);
			if (!ObjectId.isValid(id))
				return res.status(400).json({
					message:
						"O projectID precisa ser uma número hexadecimal com 24 caracteres.",
				});
			const slug = stringToSlug(name);
			const serializedTeam = stringToSlug(team);
			if (!currentTeams.includes(serializedTeam))
				return res
					.status(400)
					.json({ message: `O time ${serializedTeam} não está cadastrado.` });

			if (!user.teams.includes(serializedTeam || "adm"))
				return res.status(403).json({
					message:
						"Usuário só pode alterar projetos no time em que está cadastrado.",
				});

			const serializedLinks = links.map((link) => {
				return { ...link, _id: new ObjectId(link._id) };
			});

			const updateObject = {
				name,
				description,
				slug,
				trackerGoogleAnalytics,
				trackerGoogleAds,
				trackerFacebook,
				links: serializedLinks,
				team: serializedTeam,
			};
			const { result } = await projectsCollection.updateOne(
				{ _id },
				{ $set: updateObject }
			);

			if (result.ok == 1) {
				if (result.nModified > 0)
					return res.json({ message: "Projeto atualizado com sucesso" });
				return res.json({
					message: "Nenhuma alteração a ser salva neste projeto.",
				});
			}
		}
	} catch (err) {
		console.error(err);
		return res.status(400).json(err);
	}
};
