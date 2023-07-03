// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { CharacterList } from '@/character';

const prisma = new PrismaClient();

type MatchBody = {
  url: string;
  timestamp: number;
  p1: string;
  p2: string;
  c1: number;
  c2: number;
}

type MatchResult = {
  url: string;
  timestamp: number;
  p1: number;
  p2: number;
  c1: number;
  c2: number;
}

type Data = {
  msg: string;
  result?: MatchResult;
  get?: any;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  if (req.method === 'POST') {
    const { url, timestamp, p1, p2, c1, c2 }: MatchBody = req.body;

    if (!url || !timestamp || !p1 || !p2 || !c1 || !c2) {
      return res.status(404).json({
        msg: 'Missing field required from body',
      })
    }

    const player1 = await prisma.player.upsert({
      where: {
        name: p1
      },
      update: {},
      create: { name: p1 },
    });

    const player2 = await prisma.player.upsert({
      where: {
        name: p2
      },
      update: {},
      create: { name: p2 },
    });

    const matchData: MatchResult = {
      url,
      timestamp: Number(timestamp),
      p1: Number(player1.id),
      p2: Number(player2.id),
      c1: Number(c1),
      c2: Number(c2),
    };

    await prisma.match.create({
      data: matchData
    })

    res.status(200).json({
      msg: '',
      result: matchData
    });
  } else if (req.method === 'GET') {
    const { p1, p2, c1, c2 } = req.query;

    if (!p1 && !p2 && !c1 && !c2)
      res.status(404).json({
        msg: 'Missing field required from body',
      })

    let player1, player2;

    if (p1)
      player1 = await prisma.player.findUnique({
        where: {
          name: String(p1)
        }
      })

    if (p2)
      player2 = await prisma.player.findUnique({
        where: {
          name: String(p1)
        }
      })

    const data = await prisma.match.findMany({
      where: {
        p1: player1?.id,
        p2: player2?.id,
        c1: c1 ? Number(c1) : undefined,
        c2: c2 ? Number(c2) : undefined
      },
      include: {
        player_match_p1Toplayer: true,
        player_match_p2Toplayer: true
      }
    })

    console.log(data);

    res.status(200).json({
      msg: 'Success',
      get: data,
    })
  } else {
    res.status(500).json({
      msg: 'Not Supported',
    })
  }
}

export default handler;