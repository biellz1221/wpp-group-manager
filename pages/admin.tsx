import Head from "next/head";
import {
	Tabs,
	TabList,
	TabPanels,
	TabPanel,
	Tab,
	Flex,
	Link,
} from "@chakra-ui/core";
import {
	useContext,
	useEffect,
	createContext,
	useState,
	Dispatch,
	SetStateAction,
} from "react";
import axios from "axios";
import Router from "next/router";
import NewUser from "../components/NewUser";
import NewTeam from "../components/NewTeam";
import Projects from "../components/Projects";
import Links from "../components/Links";
import Loading from "../components/Loading";

interface IUser {
	token: string;
	name: string;
	teams: string[];
}

export const RefreshProjects = createContext({
	refreshProjectsContext: true,
	setRefreshProjectsContext: (S: boolean) => {},
});

export const UserContext = createContext({} as IUser);

const Admin = () => {
	const [refreshProjectsContext, setRefreshProjectsContext] = useState(true);
	const [loading, setLoading] = useState(true);
	const [userInfo, setUserInfo] = useState({} as IUser);
	useEffect(() => {
		verifyToken();
		async function verifyToken() {
			try {
				const token = localStorage.getItem("token");
				if (token) {
					const { data } = await axios.post("/api/validate_token", null, {
						headers: { Authorization: token },
					});
					if (data.pass) {
						setUserInfo({
							token,
							name: data.user.name,
							teams: data.user.teams || [],
						});
					}
				} else {
					await Router.push("/");
				}
			} catch (err) {
				localStorage.removeItem("token");
				await Router.push("/");
			} finally {
				setLoading(false);
			}
		}
	}, []);

	if (loading) return <Loading />;
	return (
		<UserContext.Provider value={userInfo}>
			<Head>
				<title>Gerenciador de Grupos do Whatsapp</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Tabs
				variant="enclosed"
				maxWidth="1280px"
				margin="10px auto"
				position="relative">
				<Flex position="absolute" right="0" top="10px">
					{userInfo.name} (
					<Link
						href="#"
						onClick={() => {
							localStorage.removeItem("token");
							Router.push("/");
						}}>
						sair
					</Link>
					)
				</Flex>
				<TabList>
					<Tab>Projetos</Tab>
					<Tab>Links</Tab>
					<Tab>Novo usuário</Tab>
					{userInfo.teams.includes("adm") && <Tab>Novo Time</Tab>}
				</TabList>
				<RefreshProjects.Provider
					value={{ refreshProjectsContext, setRefreshProjectsContext }}>
					<TabPanels>
						<TabPanel>
							<Projects />
						</TabPanel>
						<TabPanel>
							<Links />
						</TabPanel>
						<TabPanel>
							<NewUser />
						</TabPanel>
						{userInfo.teams.includes("adm") && (
							<TabPanel>
								<NewTeam />
							</TabPanel>
						)}
					</TabPanels>
				</RefreshProjects.Provider>
			</Tabs>
		</UserContext.Provider>
	);
};
export default Admin;
