import React, { Fragment } from "react";
import {
	Grid,
	InputGroup,
	Input,
	InputLeftAddon,
	Text,
	Accordion,
	AccordionItem,
	AccordionPanel,
	AccordionHeader,
	AccordionIcon,
	Box,
	Heading,
	Select,
	Checkbox,
} from "@chakra-ui/core";
import axios from "axios";
import { useState, useContext, useEffect } from "react";
import { RefreshProjects, UserContext } from "../pages/admin";
import { ILink } from "./Links";
import ProjectFields from "./Project/Fields";

export interface IProject {
	id: string;
	name: string;
	description: string;
	slug: string;
	trackerGoogleAnalytics?: string;
	trackerGoogleAds?: string;
	trackerFacebook?: string;
	team: string;
	links: ILink[];
}

export default function Projects() {
	const [message, setMessage] = useState("");
	const [projects, setProjects] = useState([] as IProject[]);
	const [selectedProject, setSelectedProject] = useState({} as IProject);
	const { token } = useContext(UserContext);
	const { refreshProjectsContext, setRefreshProjectsContext } = useContext(
		RefreshProjects
	);
	const [messagesArray, setMessagesArray] = useState([] as string[]);

	async function handleSubmitNewProject(event) {
		event.preventDefault();
		const form = event.target;
		const name = form.name.value;
		const description = form.description.value;
		const trackerGoogleAnalytics = form.trackerGoogleAnalytics.value;
		const trackerGoogleAds = form.trackerGoogleAds.value;
		const trackerFacebook = form.trackerFacebook.value;
		const team = form.team.value;
		try {
			const { data } = await axios.post(
				"/api/projects",
				{
					name,
					description,
					trackerGoogleAnalytics,
					trackerGoogleAds,
					trackerFacebook,
					links: [],
					team,
				},
				{ headers: { Authorization: token } }
			);
			if (data.id) {
				setMessage(
					`Projeto ${name} (${description}) criado com sucesso.\nID do projeto: ${data.id}\nSlug do projeto: ${data.slug}`
				);
				setRefreshProjectsContext(!refreshProjectsContext);
			}
		} catch (error) {
			if (error.response)
				if (error.response.data.code == 11000) {
					setMessage(
						`Projeto com o nome ${name} já está cadastrado, utilize outro nome de projeto`
					);
					form.name.value = "";
				} else {
					setMessage(
						"Não foi possível criar o usuário no momento, tente novamente em alguns instantes."
					);
				}
		}
	}

	function handleSelectProject(event) {
		const projectIdToFind = event.target.value;
		const projectToSelect = projects.find(
			(project) => project.id == projectIdToFind
		);
		if (projectToSelect) setSelectedProject(projectToSelect);
	}

	async function handleUpdateProject(event) {
		event.preventDefault();
		setMessage("Salvando...");
		try {
			const { data } = await axios.patch("/api/projects", selectedProject, {
				headers: { Authorization: token },
			});
			setMessage(data.message);
			if (data.message !== "Nenhuma alteração a ser salva neste projeto.")
				setRefreshProjectsContext(!refreshProjectsContext);
		} catch (error) {
			if (error.reponse.data) setMessage(error.response.data.message);
		}
	}

	useEffect(() => {
		refreshProjects();

		async function refreshProjects() {
			try {
				const { data } = await axios.get("/api/projects", {
					headers: { Authorization: token },
				});

				if (data) {
					setProjects(data);
				}
			} catch (error) {
				console.log(error);
			}
		}
	}, [refreshProjectsContext]);

	useEffect(() => {
		const projectToSelect = projects.find(
			(project) => project.id == selectedProject?.id
		);
		if (projectToSelect) {
			setSelectedProject(projectToSelect);
		} else {
			setSelectedProject(projects[0]);
		}
	}, [projects]);

	useEffect(() => {
		setMessagesArray(message.split("\n"));
	}, [message]);

	return (
		<>
			<Accordion>
				<AccordionItem>
					<AccordionHeader>
						<Box flex="1" textAlign="left">
							Novo Projeto
						</Box>
						<AccordionIcon />
					</AccordionHeader>
					<AccordionPanel pb={0}>
						<Grid
							as="form"
							margin="64px auto"
							gap="16px"
							maxWidth="480px"
							onSubmit={handleSubmitNewProject}>
							<ProjectFields />
							<Input
								type="submit"
								backgroundColor="blue.500"
								_hover={{ backgroundColor: "blue.600" }}
								value="CADASTRAR"
								maxWidth="50%"
								margin="0 auto"
							/>
						</Grid>
					</AccordionPanel>
				</AccordionItem>
				{selectedProject && (
					<AccordionItem>
						<AccordionHeader>
							<Box flex="1" textAlign="left">
								Editar Projeto
							</Box>
							<AccordionIcon />
						</AccordionHeader>
						<AccordionPanel pb={0}>
							<Grid
								as="form"
								margin="16px auto"
								gap="16px"
								onSubmit={handleUpdateProject}>
								<InputGroup>
									<InputLeftAddon children="Projeto" />
									<Select
										variant="filled"
										color="gray.600"
										name="projectID"
										onChange={handleSelectProject}
										isRequired>
										{projects.map((project, index) => {
											return (
												<option
													value={project.id}
													key={index}
													selected={selectedProject.id == project.id}>
													{project.name}
												</option>
											);
										})}
									</Select>
								</InputGroup>
								<ProjectFields
									description={selectedProject?.description}
									name={selectedProject?.name}
									trackerFacebook={selectedProject?.trackerFacebook}
									trackerGoogleAnalytics={
										selectedProject?.trackerGoogleAnalytics
									}
									trackerGoogleAds={selectedProject?.trackerGoogleAds}
									team={selectedProject.team}
									update={({
										name,
										description,
										trackerFacebook,
										trackerGoogleAnalytics,
										trackerGoogleAds,
										team,
									}) => {
										setSelectedProject({
											...selectedProject,
											name,
											description,
											trackerFacebook,
											trackerGoogleAds,
											trackerGoogleAnalytics,
											team,
										});
									}}
								/>
								<Text>Links</Text>
								<Grid gridTemplateColumns="3fr 5fr 150px 150px" gap="8px">
									{selectedProject?.links?.map((link, index) => {
										return (
											<Fragment key={index}>
												<InputGroup>
													<InputLeftAddon children="Link" />
													<Input value={link.name} isReadOnly />
												</InputGroup>
												<InputGroup>
													<InputLeftAddon children="URL" />
													<Input type="url" value={link.link} isReadOnly />
												</InputGroup>
												<InputGroup>
													<InputLeftAddon children="Leads" />
													<Input value={link.numLeads} isReadOnly />
												</InputGroup>
												<Checkbox
													isChecked={selectedProject?.links[index].active}
													name="active"
													justifySelf="right"
													children="ativo?"
													id={selectedProject?.links[index]._id}
													onChange={(event) => {
														const id = event.target.id;
														const links = selectedProject?.links.map((link) => {
															if (link._id == id) {
																const newLink = {
																	...link,
																	active: !link.active,
																};
																return newLink;
															} else {
																return link;
															}
														});
														setSelectedProject({ ...selectedProject, links });
													}}
												/>
											</Fragment>
										);
									})}
								</Grid>
								<Input
									type="submit"
									backgroundColor="blue.500"
									_hover={{ backgroundColor: "blue.600" }}
									value="SALVAR"
									maxWidth="50%"
									margin="0 auto"
								/>
							</Grid>
						</AccordionPanel>
					</AccordionItem>
				)}
			</Accordion>
			{messagesArray.map((message, i) => (
				<Text textAlign="center" key={i} color="red.300">
					{message}
				</Text>
			))}
			{projects.length > 0 && (
				<Grid
					marginTop="24px"
					gridTemplateColumns="2fr 6fr 2fr 2fr 1fr"
					gridTemplateAreas="
				'title title title title title'
				'. . . . .'
				"
					backgroundColor="gray.900"
					padding="8px"
					borderRadius="4px">
					<Heading gridArea="title" margin="8px auto">
						Projetos cadastrados
					</Heading>
					<Text fontWeight="bold">Projeto</Text>
					<Text>Descrição</Text>
					<Text>Time</Text>
					<Text>Slug</Text>
					<Text>Nº Links</Text>
					{projects.map((project, i) => (
						<Fragment key={i}>
							<Text padding="8px" borderTop="solid 1px white">
								{project.name}
							</Text>
							<Text padding="8px" borderTop="solid 1px white">
								{project.description}
							</Text>
							<Text padding="8px" borderTop="solid 1px white">
								{project.team}
							</Text>
							<Text padding="8px" borderTop="solid 1px white">
								{project.slug}
							</Text>
							<Text padding="8px" borderTop="solid 1px white">
								{project.links?.length}
							</Text>
						</Fragment>
					))}
				</Grid>
			)}
		</>
	);
}
