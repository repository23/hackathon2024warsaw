import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end();
  }

  const whereIsScoreDb = path.join(process.cwd(), "db/scores.json");
  let leaderboard = JSON.parse(fs.readFileSync(whereIsScoreDb)).slice(0);

  if (req.method === "GET") {
    const size = req.query.size;
    if (size > 0)
      return res.status(200).json(leaderboard.slice(0, size));
    else
      return res.status(200).json([]);
  }

  // req.method === "POST", when a new score data is submitted to the leaderboard
  const { account, score, verified, gameplayHash } = req.body;

  console.log(leaderboard);

  const idx = leaderboard.findIndex(_ => _.gameplayHash == gameplayHash);
  // Delete the previous record with the same gameplay hash
  if (idx >= 0) 
    leaderboard = leaderboard.slice(0, idx).concat(leaderboard.slice(idx + 1));

  // Insert the new record
  const idxOfRank = leaderboard.findIndex(_ => _.score < score);
  if (idxOfRank >= 0)
    leaderboard = (leaderboard.slice(0, idxOfRank).concat([{
      account,
      score,
      verified,
      gameplayHash,
    }])).concat(leaderboard.slice(idxOfRank));
  else
    leaderboard = leaderboard.concat([{
      account,
      score,
      verified,
      gameplayHash,
    }]);

  fs.writeFileSync(whereIsScoreDb, JSON.stringify(leaderboard));
  return res.status(200).end();
};

export default handler;
