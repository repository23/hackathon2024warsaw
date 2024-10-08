import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import theme from "../config/theme";
import GameProvider from "../context/GameContext";
import { AccountProvider } from "../context/AccountContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
      <ChakraProvider theme={theme}>
        <AccountProvider>
            <GameProvider>
              <Component {...pageProps} />
            </GameProvider>
        </AccountProvider>
      </ChakraProvider>
  );
}
