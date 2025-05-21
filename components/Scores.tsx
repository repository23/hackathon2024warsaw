import {
  Stack,
  Flex,
  Text,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { useLeaderboard } from "../context/useLeaderboard";
import { FaTimes } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";

// const LEADERBOARD_SIZE = 10;

const leaderboard = [{"account":null,"score":7,"verified":false,"gameplayHash":"17447037975902166816005985828385950288798596008608477425442506761942465800652"},{"account":"5DaEPRTPEyR6cYYR4vjgFJos8RXtkpeY7N1JX81xWy1FxzPM","score":6,"verified":false,"gameplayHash":"1130378648083860765189742930278439650314505885475125624552272032938711275797"},{"account":null,"score":5,"verified":false,"gameplayHash":"7771647114705545435422161775296980666380813929753535300345696064664288588708"},{"account":null,"score":5,"verified":false,"gameplayHash":"3635878333960669611696613114225406722324038949119540218702955537305401319123"},{"account":"5DaEPRTPEyR6cYYR4vjgFJos8RXtkpeY7N1JX81xWy1FxzPM","score":4,"verified":false,"gameplayHash":"9438038842567076040629123410100115290046155952536145316657435956496108012966"},{"account":"5DaEPRTPEyR6cYYR4vjgFJos8RXtkpeY7N1JX81xWy1FxzPM","score":4,"verified":false,"gameplayHash":"10551293565806169948458713893303559640742096655576094194259663191298021636702"},{"account":null,"score":4,"verified":false,"gameplayHash":"9902544385841512037826956262800846836263402808859652981642975336281157478756"},{"account":null,"score":4,"verified":false,"gameplayHash":"6573846328504763647964585610760838272170132811598719515817305243249346684534"},{"account":"5DaEPRTPEyR6cYYR4vjgFJos8RXtkpeY7N1JX81xWy1FxzPM","score":3,"verified":false,"gameplayHash":"17175392634277618240549323466344056053316935779162668060102307709813944299003"}];

const Scores: React.FC = () => {
  //const { leaderboard, onSyncLeaderboard } = useLeaderboard(LEADERBOARD_SIZE);

  // TODO: how to sync the leaderboard data at the initial render?
  // This does not work
  // onSyncLeaderboard();
  return (
    <Stack align="center" position="relative">
      <Flex direction="column">
        <Flex justify="center">
          <Text fontSize="24px">
            HALL   OF   FAME
          </Text>
        </Flex>
        <Flex justify="center">
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th isNumeric>Rank</Th>
                  <Th>Account</Th>
                  <Th isNumeric>Score</Th>
                  <Th>ZKVerified</Th>
                  <Th>Gameplay Hash</Th>
                </Tr>
              </Thead>
              <Tbody>
                {leaderboard.map((rec, idx) => (
                  <Tr key={idx}>
                    <Td isNumeric>{idx + 1}</Td>
                    <Td>{rec.account ? rec.account : "Anonym"}</Td>
                    <Td isNumeric>{rec.score}</Td>
                    {rec.verified ? 
                      <Td><Icon as={BsShieldCheck} color="#666" boxSize={6} /></Td>
                    :
                      <Td><Icon as={FaTimes} color="red.400" boxSize={5} /></Td>
                    }
                    <Td>{rec.gameplayHash}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Flex>
      </Flex>
    </Stack>
  );
};

export default Scores;
