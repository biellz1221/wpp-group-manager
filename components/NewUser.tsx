import { Grid, Input, Text, Checkbox, CheckboxGroup } from "@chakra-ui/core";
import axios from "axios";
import { useState, useContext } from "react";
import { UserContext } from "../pages/admin";
const Users: React.FC = () => {
	const [message, setMessage] = useState("");
	const [formTeams, setFormTeams] = useState([] as (string | undefined)[]);
	const { token, teams } = useContext(UserContext);

	async function handleSubmitUserForm(event) {
		event.preventDefault();
		const form = event.target;
		const name = form.name.value;
		const email = form.email.value;
		const password = form.password.value;
		if (formTeams.length == 0)
			return alert("Selecione ao menos um time para o novo usuário.");
		try {
			const { data } = await axios.post(
				"/api/users",
				{ name, email, password, teams: formTeams },
				{
					headers: {
						Authorization: token,
					},
				}
			);
			if (data.token)
				setMessage(`Usuário ${name} (${email}) criado com sucesso.`);
		} catch (error) {
			if (error.response?.data) {
				setMessage(error.response.data.message);
				form.email.value = "";
			} else {
				setMessage(
					"Não foi possível criar o usuário no momento, tente novamente em alguns instantes."
				);
			}
		}
	}
	return (
		<Grid
			as="form"
			margin="64px auto"
			gap="16px"
			maxWidth="480px"
			onSubmit={handleSubmitUserForm}>
			<Input placeholder="Nome" name="name" isRequired />
			<Input placeholder="E-mail" type="email" name="email" isRequired />
			<Input placeholder="Senha" type="password" name="password" isRequired />
			<Text>Time</Text>
			<CheckboxGroup
				isInline
				textAlign="center"
				spacing={8}
				placeholder="time"
				name="teams"
				color="gray.600"
				height="auto"
				onChange={(values) => {
					const teams = values.map((team) => {
						if (typeof team == "string") return team;
					});
					setFormTeams(teams);
				}}>
				{teams.map((team, index) => (
					<Checkbox
						alignItems="center"
						justifyContent="center"
						textAlign="center"
						key={index}
						value={team}>
						{team}
					</Checkbox>
				))}
			</CheckboxGroup>
			<Input
				type="submit"
				backgroundColor="blue.500"
				_hover={{ backgroundColor: "blue.600" }}
				value="CADASTRAR"
				maxWidth="50%"
				margin="0 auto"
			/>
			<Text textAlign="center" marginTop="16px">
				{message}
			</Text>
		</Grid>
	);
};

export default Users;
