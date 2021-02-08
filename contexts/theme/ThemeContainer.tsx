import React from "react";

import {
	ThemeProvider as ChakraThemeProvider,
	ColorModeProvider,
	CSSReset,
} from "@chakra-ui/core";

import theme from "../../styles/theme";

const ThemeContainer: React.FC = ({ children }) => {
	return (
		<ChakraThemeProvider theme={theme}>
			<ColorModeProvider value="dark">
				<CSSReset />
				{children}
			</ColorModeProvider>
		</ChakraThemeProvider>
	);
};

export default ThemeContainer;
