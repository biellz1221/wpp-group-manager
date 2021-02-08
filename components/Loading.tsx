import { Flex, Text, Spinner } from "@chakra-ui/core";

export default function Loading() {
	return (
		<Flex
			height="100vh"
			width="100vw"
			justifyContent="center"
			alignItems="center"
			flexDirection="column">
			<Spinner
				thickness="4px"
				speed="0.65s"
				emptyColor="gray.200"
				color="blue.500"
				size="xl"
			/>
			<Text fontSize="lg">Carregando...</Text>
		</Flex>
	);
}
