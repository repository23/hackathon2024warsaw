"use client";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // For local leaderboard, all the submitted gameplays with scores are stored in a local file "db/scores.json"
  const whereIsScoreDb = path.join(process.cwd(), "db/scores.json");
  let scoreEntries = JSON.parse(fs.readFileSync(whereIsScoreDb)).slice(0);

  if (req.method === "GET") {
    const size = req.query.size;
    if (size > 0)
      return res.status(200).json(scoreEntries.slice(0, size));
    else
      return res.status(200).json([]);
  } else if (req.method === "POST") {
    const { account, score, verified, gameplayHash } = req.body;

    const idx = scoreEntries.findIndex(_ => _.gameplayHash == gameplayHash);
    // Delete the previous entry with the same gameplay hash
    if (idx >= 0) 
      scoreEntries = scoreEntries.slice(0, idx).concat(scoreEntries.slice(idx + 1));

    // Insert the new entry
    const rankIdx = scoreEntries.findIndex(_ => _.score < score);
    if (rankIdx >= 0)
      scoreEntries = (scoreEntries.slice(0, rankIdx).concat([{
        account,
        score,
        verified,
        gameplayHash,
      }])).concat(scoreEntries.slice(rankIdx));
    else
      scoreEntries = scoreEntries.concat([{
        account,
        score,
        verified,
        gameplayHash,
      }]);

    fs.writeFileSync(whereIsScoreDb, JSON.stringify(scoreEntries));
    return res.status(200).end();
  } else
    return res.status(405).end();
};

export default handler;
