
var gameState = {
	seed: "",
	mode: "host",
	words: [{ word: "word", color: "white", revealed: false }],
	currentTurn: "red",
	teams: [{ color: "red", totalCards: 9, revealed: 0, members: "" }, { color: "blue", totalCards: 8, revealed: 0, members: "" }],
	totalRevealed: 0,
	winner: null,
	currentClue: "",
};

$(start); 

//starting team gets 9 words, other team gets 8 words.  1 Assassin
function start()
{
	if (getParameterByName("mode") == "cluegiver" && getParameterByName("game") != null)
	{
		let seed = getParameterByName("game");
		newGame("cluegiver", seed);
	}
	else
	{
		newGame();
	}

	render();

	$(document.body).on("click", ".cell", tapCell);
	$(document.body).on("click", ".newGame", clickNewGame);
	$(document.body).on("click", ".endTurn", endTurn);
	$(document.body).on("click", ".copyClueUrl", copyClueUrl);


	$(document.body).on("input", "#currentClue", function () { gameState.currentClue = $("#currentClue").val(); });
	$(document.body).on("input", "#redTeam", function () { gameState.teams[0].members = $("#redTeam").val(); });
	$(document.body).on("input", "#blueTeam", function () { gameState.teams[1].members = $("#blueTeam").val(); });
}

function newGame(mode, seed)
{	 
	gameState.mode = mode || "host";

	//get a truly random seed
	if (seed == null)
	{
		Math.seedrandom();
		gameState.seed = Math.round(Math.random() * 1000000000000).toString();
	}
	else
	{
		gameState.seed = seed;
	}

	//seed the RNG 
	Math.seedrandom(gameState.seed);

	//pick words randomly
	gameState.words = [];
	let i = 0;
	while (gameState.words.length < 25 && i < 5000)
	{
		let index = Math.floor(Math.random() * wordList.length);
		let word = wordList[index];
		let alreadyUsed = gameState.words.find(x => x.word == word);
		if (!alreadyUsed)
		{
			gameState.words.push({ word: word, color: "gray", revealed: false });
		}
		i++
	}

	//pick who goes first
	let firstTeam = Math.random() > 0.5 ? 0 : 1;
	let secondTeam = firstTeam == 0 ? 1 : 0;
	gameState.teams[firstTeam].totalCards = 9;
	gameState.teams[firstTeam].revealed = 0;
	gameState.teams[secondTeam].totalCards = 8;
	gameState.teams[secondTeam].revealed = 0;
	gameState.currentTurn = gameState.teams[firstTeam].color;

	//pick words for each team
	for (i = 0; i < 2; i++)
	{
		let limit = gameState.teams[i].totalCards;
		let teamColor = gameState.teams[i].color;
		let count = 0;

		while (count < limit)
		{
			//find a random word from the 25
			let index = Math.floor(Math.random() * 25);
			if (gameState.words[index].color == "gray")
			{
				gameState.words[index].color = teamColor;
				count++;
			}
		}
	}

	//pick where the black word is
	while (true)
	{
		let index = Math.floor(Math.random() * 25);
		if (gameState.words[index].color == "gray")
		{
			gameState.words[index].color = "black";
			break;
		}
	}

	gameState.totalRevealed = 0;
	gameState.winner = null;
	gameState.message = "New Game Started. " + gameState.currentTurn + " goes first.";
}

function render()
{
	if (gameState.mode == "cluegiver")
	{
		renderClueGiver();
		return;
	}

	var html = ` <span class='button newGame'>New Game</span> <span class='button copyClueUrl'>Copy Clue-giver Url</span> `;

	if (gameState.winner)
	{
		html += `<div class='header ${gameState.winner} '>${gameState.winner.toUpperCase()} TEAM WINS!</div>`;
	}
	else
	{
		html += `<div class='header ${gameState.currentTurn} '>${gameState.currentTurn.toUpperCase()} Team's Turn</div>`;
	}

	html += `<div class='currentClue'>Current Clue: <input type='text' id='currentClue' /> <span class='endTurn button'>End Turn</span> </div>`;

	html += `<div style='display:flex'><div class='team red'>Red Team (${gameState.teams[0].revealed}/${gameState.teams[0].totalCards})<br /><textarea id='redTeam' /></div>`

	html += renderGameTable();

	html += `<div class='team blue'>Blue Team (${gameState.teams[1].revealed}/${gameState.teams[1].totalCards})<br /><textarea id='blueTeam' /></div></div>`

	$(document.body).html(html);

	$("#currentClue").val(gameState.currentClue);
	$("#redTeam").val(gameState.teams[0].members);
	$("#blueTeam").val(gameState.teams[1].members);
}

function renderClueGiver()
{
	var html ="<div style='height: 65px;' />";
	html += renderGameTable();
	$(document.body).html(html);
}

function renderGameTable()
{
	let html = `<table><tr>`
	for (var i = 0; i < 25; i++)
	{
		let word = gameState.words[i];
		if (word.revealed)
		{
			let text = word.color == "black" ? "💀" : "&nbsp;";
			html += `<td class='cell ${word.color}' data-index='${i}' >${text}</td>`;
		}
		else if (gameState.mode == "cluegiver")
		{
			html += `<td class='cell clue-${word.color}' data-index='${i}' >${word.word + (word.color == "black" ? " 💀" : "")}</td>`;
		}
		else
		{
			html += `<td class='cell' data-index='${i}' >${word.word}</td>`;
		}

		if (i == 4 || i == 9 || i == 14 || i == 19)
		{
			html += `</tr><tr>`;
		}
	}
	html += `</tr></table>`;
	return html;
}

function tapCell(event)
{
	var cell = $(event.currentTarget);
	var index = parseInt(cell.attr("data-index"), 10);

	//in cluegiver mode clicking a cell just toggles it
	if (gameState.mode == "cluegiver")
	{
		gameState.words[index].revealed = !gameState.words[index].revealed;
		render();
		return;
	}
	 
	//reveal the clicked word
	if (gameState.words[index].revealed) return;
	gameState.words[index].revealed = true;
	 

	//increment the correct teams revealed count
	if (!gameState.winner)
	{
		let color = gameState.words[index].color;
		let team = gameState.teams.find(x => x.color == color);
		if (team)
		{
			team.revealed++;
			gameState.totalRevealed++;

			//team revealed all their cards = they win
			if (team.revealed >= team.totalCards)
			{
				gameState.winner = team.color;
			}
		}

		//click black = current team loses
		if (color == "black")
		{
			gameState.winner = gameState.currentTurn == "red" ? "blue" : "red";
		}

		//click wrong color = ends current team's turn
		if (color != gameState.currentTurn)
		{
			gameState.currentTurn = (gameState.currentTurn == "red" ? "blue" : "red");
			gameState.currentClue = "";
		}
	}
	 
	render();
}

function endTurn()
{
	gameState.currentTurn = (gameState.currentTurn == "red" ? "blue" : "red");
	gameState.currentClue = "";
	render();
}

function clickNewGame()
{
	
	let okToCreateNewGame = gameState.totalRevealed == 0 || gameState.winner != null || confirm("Are you sure you want to start a new game?");
	if (okToCreateNewGame)
	{
		newGame();
		render();
	}
}

function copyClueUrl()
{
	let url = window.location.href;
	let q = url.indexOf('?')
	if (q >= 0)
	{
		url = url.substr(0, q);
	}

	url += "?mode=cluegiver&game=" + gameState.seed;
 
	$(document.body).append("<input type='text' id='copy' value='" + url + "' style='position: abolute; left: -500px' />");

	var copyText = document.querySelector("#copy");
	copyText.select();
	document.execCommand("copy");

	$("#copy").remove();

	$(document.body).append("<div style='position: absolute; top: 10px; right: 122px; color: #507163; padding: 3px 8px; font-size: 12px; font-weight: bold;' id='copied' >COPIED!</div>")
	setTimeout(function () { $("#copied").remove();  }, 2000);
}






var wordList = [
	"africa",
	"agent",
	"air",
	"alien",
	"amazon",
	"angel",
	"antarctica",
	"apple",
	"arm",
	"back",
	"band",
	"bank",
	"bark",
	"beach",
	"belt",
	"berlin",
	"berry",
	"board",
	"bond",
	"boom",
	"bow",
	"box",
	"bug",
	"canada",
	"capital",
	"cell",
	"center",
	"china",
	"chocolate",
	"circle",
	"club",
	"compound",
	"copper",
	"crash",
	"cricket",
	"cross",
	"death",
	"dice",
	"dinosaur",
	"doctor",
	"dog",
	"dress",
	"dwarf",
	"eagle",
	"egypt",
	"engine",
	"england",
	"europe",
	"eye",
	"fair",
	"fall",
	"fan",
	"field",
	"file",
	"film",
	"fish",
	"flute",
	"fly",
	"forest",
	"fork",
	"france",
	"gas",
	"ghost",
	"giant",
	"glass",
	"glove",
	"gold",
	"grass",
	"greece",
	"green",
	"ham",
	"head",
	"himalaya",
	"hole",
	"hood",
	"hook",
	"human",
	"horseshoe",
	"hospital",
	"hotel",
	"ice",
	"ice cream",
	"india",
	"iron",
	"ivory",
	"jam",
	"jet",
	"jupiter",
	"kangaroo",
	"ketchup",
	"kid",
	"king",
	"kiwi",
	"knife",
	"knight",
	"lab",
	"lap",
	"laser",
	"lawyer",
	"lead",
	"lemon",
	"limousine",
	"leadlock",
	"log",
	"mammoth",
	"maple",
	"march",
	"mass",
	"mercury",
	"millionaire",
	"model",
	"mole",
	"moscow",
	"mouth",
	"mug",
	"needle",
	"net",
	"new york",
	"night",
	"note",
	"novel",
	"nurse",
	"nut",
	"oil",
	"olive",
	"olympus",
	"opera",
	"orange",
	"paper",
	"park",
	"part",
	"paste",
	"phoenix",
	"piano",
	"telescope",
	"teacher",
	"switch",
	"swing",
	"sub",
	"stick",
	"staff",
	"stadium",
	"sprint",
	"spike",
	"snowman",
	"slip",
	"shot",
	"shadow",
	"server",
	"ruler",
	"row",
	"rose",
	"root",
	"rome",
	"rock",
	"robot",
	"robin",
	"revolution",
	"rat",
	"racket",
	"queen",
	"press",
	"port",
	"pilot",
	"time",
	"tooth",
	"tower",
	"truck",
	"triangle",
	"trip",
	"turkey",
	"undertaker",
	"unicorn",
	"vacuum",
	"van",
	"wake",
	"wall",
	"war",
	"washer",
	"washington",
	"water",
	"wave",
	"well",
	"whale",
	"whip",
	"worm",
	"yard"];


function getParameterByName(name)
{
	let url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// SeedRandom:
 !function (a, b, c, d, e, f, g, h, i) { function j(a) { var b, c = a.length, e = this, f = 0, g = e.i = e.j = 0, h = e.S = []; for (c || (a = [c++]); d > f;)h[f] = f++; for (f = 0; d > f; f++)h[f] = h[g = s & g + a[f % c] + (b = h[f])], h[g] = b; (e.g = function (a) { for (var b, c = 0, f = e.i, g = e.j, h = e.S; a--;)b = h[f = s & f + 1], c = c * d + h[s & (h[f] = h[g = s & g + b]) + (h[g] = b)]; return e.i = f, e.j = g, c })(d) } function k(a, b) { var c, d = [], e = typeof a; if (b && "object" == e) for (c in a) try { d.push(k(a[c], b - 1)) } catch (f) { } return d.length ? d : "string" == e ? a : a + "\0" } function l(a, b) { for (var c, d = a + "", e = 0; e < d.length;)b[s & e] = s & (c ^= 19 * b[s & e]) + d.charCodeAt(e++); return n(b) } function m(c) { try { return o ? n(o.randomBytes(d)) : (a.crypto.getRandomValues(c = new Uint8Array(d)), n(c)) } catch (e) { return [+new Date, a, (c = a.navigator) && c.plugins, a.screen, n(b)] } } function n(a) { return String.fromCharCode.apply(0, a) } var o, p = c.pow(d, e), q = c.pow(2, f), r = 2 * q, s = d - 1, t = c["seed" + i] = function (a, f, g) { var h = []; f = 1 == f ? { entropy: !0 } : f || {}; var o = l(k(f.entropy ? [a, n(b)] : null == a ? m() : a, 3), h), s = new j(h); return l(n(s.S), b), (f.pass || g || function (a, b, d) { return d ? (c[i] = a, b) : a })(function () { for (var a = s.g(e), b = p, c = 0; q > a;)a = (a + c) * d, b *= d, c = s.g(1); for (; a >= r;)a /= 2, b /= 2, c >>>= 1; return (a + c) / b }, o, "global" in f ? f.global : this == c) }; if (l(c[i](), b), g && g.exports) { g.exports = t; try { o = require("crypto") } catch (u) { } } else h && h.amd && h(function () { return t }) }(this, [], Math, 256, 6, 52, "object" == typeof module && module, "function" == typeof define && define, "random");