import { Grid, Input, Text } from "@chakra-ui/core";
import axios from "axios";
import { useState, useContext } from "react";
import { UserContext } from "../pages/admin";
const Teams: React.FC = () => {
	const [message, setMessage] = useState("");

	const { token } = useContext(UserContext);

	async function handleSubmitUserForm(event) {
		event.preventDefault();
		const form = event.target;
		const team = form.team.value;

		try {
			const { data } = await axios.post(
				"/api/teams",
				{ team },
				{
					headers: {
						Authorization: token,
					},
				}
			);
			if (data.name) setMessage(`Time ${data.name} criado com sucesso.`);
		} catch (error) {
			if (error.response?.data) {
				setMessage(error.response.data.message);
			} else {
				setMessage(
					"Não foi possível criar o time no momento, tente novamente em alguns instantes."
				);
			}
		} finally {
			form.reset();
		}
	}
	return (
		<Grid
			as="form"
			margin="64px auto"
			gap="16px"
			maxWidth="480px"
			onSubmit={handleSubmitUserForm}>
			<Input placeholder="Nome do time" name="team" isRequired />
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

export default Teams;
