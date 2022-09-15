const express = require("express");

const app = express();
app.use(express.json());

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const dbpath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const intializedbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`error occurred ${e}`);
    process.exit(1);
  }
};

intializedbandserver();

const convertcamelcase = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const query = `select * from player_details;`;
  const data = await db.all(query);
  response.send(data.map((eachitem) => convertcamelcase(eachitem)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `select * from player_details where player_id=${playerId};`;
  const data = await db.get(query);
  response.send(convertcamelcase(data));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerdetails = request.body;
  const { playerName } = playerdetails;
  const query = `update player_details set
                  player_name='${playerName}'
                  where player_id=${playerId};`;
  await db.run(query);
  response.send("Player Details Updated");
});

const matchdetailscamelcase = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from match_details 
    where match_id=${matchId};`;
  const data = await db.get(query);
  response.send(matchdetailscamelcase(data));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `select match_details.match_id as matchId,
     match_details.match as match,
     match_details.year as year
      from match_details natural join player_match_score 
      where player_id=${playerId};`;

  const data = await db.all(query);
  response.send(data);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `select 
    player_details.player_id as playerId,
    player_details.player_name as playerName 
    from player_details 
    natural join player_match_score 
    where match_id=${matchId};`;
  const data = await db.all(query);
  response.send(data);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `select player_details.player_id as playerId,player_details.player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    from player_match_score 
    natural join 
    player_details 
    where player_id=${playerId};`;
  const data = await db.get(query);
  response.send(data);
});

module.exports = app;
