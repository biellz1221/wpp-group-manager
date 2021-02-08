import { NowRequest, NowResponse } from "@vercel/node";
import { connectToDatabase } from "../../config/database";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import Cors from "cors";
import initMiddleware from "../../lib/init-middleware";

const cors = initMiddleware(
	Cors({
		methods: ["POST", "GET", "PATCH", "DELETE"],
	})
);
interface ILink {
	_id: ObjectId;
	name: string;
	link: string;
	active: boolean;
	numLeads: number;
}

interface IProject {
	_id: ObjectId;
	name: string;
	description: string;
	slug: string;
	links: ILink[];
}

export default async (req: NowRequest, res: NowResponse) => {
	await cors(req, res);
	/* Verificação da validade do token */
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
			{ projection: { name: true } }
		);
		if (!user) return res.status(403).json({ message: "Token inválida" });
		/**/

		const projectsCollection = db.collection("projects");
		if (req.method == "GET") {
			/* Verificação da validade do ID */
			if (req.body.projectID) {
				if (!ObjectId.isValid(req.body.projectID))
					return res.status(400).json({
						message:
							"O id precisa ser uma número hexadecimal com 24 caracteres.",
					});
				/* */
				/* Todos os links por projeto*/
				const _id = new ObjectId(req.body.projectID);
				const project = await projectsCollection.findOne(
					{
						_id,
					},
					{ projection: { links: true, _id: false } }
				);
				if (!project)
					return res.status(404).json({
						message: "Nenhum projeto encontrado como id especificado.",
					});
				return res.json(project.links);
				/**/
			}

			if (req.body.id) {
				if (!ObjectId.isValid(req.body.id))
					return res.status(400).json({
						message:
							"O id precisa ser uma número hexadecimal com 24 caracteres.",
					});
				const _id = new ObjectId(req.body.id);

				/*link por ID*/
				const project = await projectsCollection.findOne(
					{
						links: { $elemMatch: { _id } },
					},
					{ projection: { links: { $elemMatch: { _id } } } }
				);
				return res.json(project.links[0]);
				/* */
			}
		}

		if (req.method == "POST") {
			/*criar novo link*/
			const { projectID, name, link, active, numLeads } = req.body;
			if (!projectID)
				return res.status(400).json({
					message: "Deve ser informado o id do projeto na variável projectID.",
				});

			if (isNaN(Number(numLeads)) || numLeads > 257 || numLeads < 0)
				return res.status(400).json({
					message: "numLeads precisa ser um número entre 0 e 257",
				});
			if (!ObjectId.isValid(projectID))
				return res.status(400).json({
					message:
						"O projectID precisa ser uma número hexadecimal com 24 caracteres.",
				});
			const _id = new ObjectId(projectID);
			const linkId = new ObjectId();
			await projectsCollection.updateOne(
				{ _id },
				{
					$push: {
						links: {
							_id: linkId,
							name,
							link,
							active,
							numLeads: Number(numLeads),
						},
					},
				}
			);

			return res.json({ id: linkId });
			/**/
		}

		/*atualizar link*/
		if (req.method == "PATCH") {
			/* Verificação do ID */
			const { id, name, link, active, numLeads } = req.body;
			if (!id)
				return res.status(400).json({
					message: "Deve ser informado o id do link na variável id.",
				});

			if (isNaN(Number(numLeads)) || numLeads > 257 || numLeads < 0)
				return res.status(400).json({
					message: "numLeads precisa ser um número entre 0 e 257",
				});
			if (!ObjectId.isValid(id))
				return res.status(400).json({
					message:
						"O projectID precisa ser uma número hexadecimal com 24 caracteres.",
				});
			/* */
			const _id = new ObjectId(id);
			const updateObject = {
				"links.$.name": name,
				"links.$.link": link,
				"links.$.active": active,
				"links.$.numLeads": Number(numLeads),
			};
			for (const key of Object.keys(updateObject)) {
				if (updateObject[key] === undefined) delete updateObject[key];
			}
			const teste = await projectsCollection.findOne({
				links: { $elemMatch: { _id } },
			});
			const response = await projectsCollection.updateOne(
				{
					"links._id": _id,
				},
				{
					$set: updateObject,
				}
			);

			return res.json({ updated: response.modifiedCount > 0 });
		}
		/**/

		/* apagar link*/
		if (req.method == "DELETE") {
			/* Verificação do ID */
			const { id } = req.query;
			if (!id)
				return res.status(400).json({
					message: "Deve ser informado o id do projeto na query url",
				});

			if (!ObjectId.isValid(id.toString()))
				return res.status(400).json({
					message:
						"O projectID precisa ser uma número hexadecimal com 24 caracteres.",
				});
			/* */
			const _id = new ObjectId(id.toString());
			const response = await projectsCollection.updateOne(
				{
					links: { $elemMatch: { _id } },
				},

				{
					$pull: { links: { _id } },
				}
			);
			return res.json({ updated: response.modifiedCount > 0 });
		}
		/**/
	} catch (err) {
		console.log(err);
		if (err.code === 11000)
			return res.status(400).json({ message: "Este link já existe" });

		return res.status(400).json(err);
	}
};
