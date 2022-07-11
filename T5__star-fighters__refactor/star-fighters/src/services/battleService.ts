import axios from "axios";
import * as fighterRepository from "../repositories/fighterRepository.js";

export async function find() {
  return fighterRepository.find();
}

export async function battle(firstUser: string, secondUser: string) {
  const firstUserRepos = await getFighterRepos(firstUser);
  const secondUserRepos = await getFighterRepos(secondUser);

  const firstFighter = await getFighter(firstUser);
  const secondFighter = await getFighter(secondUser);

  const firstUserStarCount = getFighterStarCount(firstUserRepos);
  const secondUserStarCount = getFighterStarCount(secondUserRepos);

  return getBattleResult(
    firstFighter,
    secondFighter,
    firstUserStarCount,
    secondUserStarCount
  );
}

async function getFighterRepos(username: string) {
  const { data } = await axios.get(
    `https://api.github.com/users/${username}/repos`
  );

  return data;
}

async function getFighter(username: string) {
  const fighter = await fighterRepository.findByUsername(username);

  if (!fighter) {
    const createdFighter = await fighterRepository.insert(username);
    return { id: createdFighter.id, username, wins: 0, losses: 0, draws: 0 };
  }

  return fighter;
}

function getFighterStarCount(fighterRepos: any[]) {
  const repoStars = fighterRepos.map((repo) => repo.stargazers_count);
  if (repoStars.length === 0) return 0;

  return repoStars.reduce((current: number, sum: number) => sum + current);
}

async function getBattleResult(
  firstFighter: any,
  secondFighter: any,
  firstUserStarCount: number,
  secondUserStarCount: number
) {
  if (firstUserStarCount > secondUserStarCount) {
    await updateWinnerAndLoserStats(firstFighter.id, secondFighter.id);

    return {
      winner: firstFighter.username,
      loser: secondFighter.username,
      draw: false,
    };
  }

  if (secondUserStarCount < firstUserStarCount) {
    await updateWinnerAndLoserStats(secondFighter.id, firstFighter.id);
    return {
      winner: secondFighter.username,
      loser: firstFighter.username,
      draw: false,
    };
  }

  await updateDrawStats(firstFighter.id, secondFighter.id);
  return { winner: null, loser: null, draw: true };
}

async function updateWinnerAndLoserStats(winnerId: number, loserId: number) {
  await fighterRepository.updateStats(winnerId, "wins");
  await fighterRepository.updateStats(loserId, "losses");
}

async function updateDrawStats(
  firstFighterId: number,
  secondFighterId: number
) {
  await fighterRepository.updateStats(firstFighterId, "draws");
  await fighterRepository.updateStats(secondFighterId, "draws");
}
