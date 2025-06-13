import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end();
  }

  const whereIsScoreDb = path.join(process.cwd(), "db/scores.json");
  let scoreEntries = JSON.parse(fs.readFileSync(whereIsScoreDb)).slice(0);

  if (req.method === "GET") {
    const size = req.query.size;
    if (size > 0)
      return res.status(200).json(scoreEntries.slice(0, size));
    else
      return res.status(200).json([]);
  }

  // req.method === "POST", when a new score entry is submitted to be added into the leaderboard database
  const { account, score, verified, gameplayHash } = req.body;

  const idx = scoreEntries.findIndex(_ => _.gameplayHash == gameplayHash);
  // Delete the previous entry with the same gameplay hash
  if (idx >= 0) 
    scoreEntries = scoreEntries.slice(0, idx).concat(scoreEntries.slice(idx + 1));

  // Insert the new entry
  const idxOfRank = scoreEntries.findIndex(_ => _.score < score);
  if (idxOfRank >= 0)
    scoreEntries = (scoreEntries.slice(0, idxOfRank).concat([{
      account,
      score,
      verified,
      gameplayHash,
    }])).concat(scoreEntries.slice(idxOfRank));
  else
    scoreEntries = scoreEntries.concat([{
      account,
      score,
      verified,
      gameplayHash,
    }]);

  fs.writeFileSync(whereIsScoreDb, JSON.stringify(scoreEntries));
  return res.status(200).end();
};

export default handler;
