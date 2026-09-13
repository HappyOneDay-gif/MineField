const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const titleImage = new Image();
const flagSheet = new Image();
const jacobSheet = new Image();
const whoAmIImage = new Image();
const jacobNameImage = new Image();
const tilesSheet = new Image();

titleImage.src = 'img/Title.png';
flagSheet.src = 'img/Flag.png';
jacobSheet.src = 'img/Jacob.png';
whoAmIImage.src = 'img/WhoAmI..png';
jacobNameImage.src = 'img/JacobNamePlate.png';
tilesSheet.src = 'img/Tiles.png';

const menuItems = ['Start', 'Options', 'Discoveries'];
const screen = {
	view: 'intro',
	selected: 0,
	flagFrame: 0,
	flagTimer: 0,
	jacobFrame: 0,
	jacobTimer: 0,
	level: 1,
	lives: 3,
	maxLives: 3,
	board: [],
	boardRows: 5,
	boardColumns: 6,
	boardLeft: 0,
	boardTop: 0,
	boardTileSize: 64,
	mines: 6,
	gameStatus: 'playing',
	fadeAlpha: 0,
	fadeDirection: 0,
	fadeTarget: 'game',
	lastTime: 0,
	musicMode: 'none'
};

const titleMusic = {
	intro: new Audio('music/TitleIntro.ogg'),
	loop: new Audio('music/TitleLoop.ogg')
};

const gameMusic = {
	intro: new Audio('music/EarlyGame2Intro.ogg'),
	loop: new Audio('music/EarlyGame2Loop.ogg')
};

titleMusic.intro.preload = 'auto';
titleMusic.loop.preload = 'auto';
titleMusic.loop.loop = true;
gameMusic.intro.preload = 'auto';
gameMusic.loop.preload = 'auto';
gameMusic.loop.loop = true;
titleMusic.intro.volume = 1;
titleMusic.loop.volume = 1;
gameMusic.intro.volume = 1;
gameMusic.loop.volume = 1;
titleMusic.intro.addEventListener('ended', () => {
	playLoop(titleMusic.loop);
});

gameMusic.intro.addEventListener('ended', () => {
	playLoop(gameMusic.loop);
});

function startTitleMusic() {
	switchMusic('title', titleMusic);
}

function startGameMusic() {
	switchMusic('game', gameMusic);
}

function switchMusic(mode, pair) {
	if (screen.musicMode === mode) return;
	stopMusic(titleMusic);
	stopMusic(gameMusic);
	screen.musicMode = mode;
	pair.intro.load();
	pair.intro.currentTime = 0;
	const playback = pair.intro.play();
	if (playback) playback.catch(() => {
		screen.musicMode = 'none';
	});
}

function stopMusic(pair) {
	pair.intro.pause();
	pair.loop.pause();
	pair.intro.currentTime = 0;
	pair.loop.currentTime = 0;
}

function playLoop(loop) {
	loop.currentTime = 0;
	const playback = loop.play();
	if (playback) playback.catch(() => {
		screen.musicMode = 'none';
	});
}

function ensureMusicForView() {
	if (screen.view === 'game' || screen.view === 'fade') startGameMusic();
	else startTitleMusic();
}

function resize() {
	const ratio = window.devicePixelRatio || 1;
	canvas.width = Math.floor(window.innerWidth * ratio);
	canvas.height = Math.floor(window.innerHeight * ratio);
	context.setTransform(ratio, 0, 0, ratio, 0, 0);
	if (screen.view === 'game' && screen.board.length) layoutBoard();
	draw();
}

function draw() {
	const width = window.innerWidth;
	const height = window.innerHeight;
	context.fillStyle = '#fff48e';
	context.fillRect(0, 0, width, height);

	if (screen.view === 'intro') drawIntro(width, height);
	else if (screen.view === 'menu') drawMenu(width, height);
	else if (screen.view === 'character') drawCharacter(width, height);
	else if (screen.view === 'game') drawGame(width, height);
	else if (screen.view === 'fade') drawFade(width, height);
	else drawPlaceholder(width, height);
}

function drawIntro(width, height) {
	const titleWidth = Math.min(width * 0.3, 290);
	const titleHeight = titleImage.naturalWidth ? titleWidth * titleImage.naturalHeight / titleImage.naturalWidth : 150;
	const titleX = (width - titleWidth) / 2;
	const titleY = Math.max(16, height * 0.035);
	if (titleImage.complete && titleImage.naturalWidth) context.drawImage(titleImage, titleX, titleY, titleWidth, titleHeight);
	else drawText('yo so like the title didnt load', width / 2, titleY + 70, 42, '#e8b85d', 'center');

	drawFlag(width / 2, height * 0.62, 240);
	drawText('PRESS ENTER', width / 2, height - 58, 14, '#e8b85d', 'center');
}

function drawMenu(width, height) {
	const menuTop = getMenuTop(height);
	menuItems.forEach((item, index) => {
		const active = index === screen.selected;
		drawText(active ? `> ${item} <` : item, width / 2, menuTop + index * 46, active ? 24 : 20, active ? '#e8b85d' : '#b8b5ab', 'center');
	});
	drawText('ARROW KEYS TO MOVE  ·  ENTER TO SELECT', width / 2, menuTop + menuItems.length * 46 + 24, 11, '#666b78', 'center');
}

function getMenuTop(height) {
	return height / 2 - ((menuItems.length - 1) * 46) / 2;
}

function drawCharacter(width, height) {
	drawCharacterImage(whoAmIImage, width / 2, height * 0.2, 300, 64);
	if (jacobSheet.complete && jacobSheet.naturalWidth) {
		const frameWidth = 128;
		const frameHeight = 128;
		const displaySize = 192;
		context.drawImage(jacobSheet, screen.jacobFrame * frameWidth, 0, frameWidth, frameHeight, width / 2 - displaySize / 2, height / 2 - displaySize / 2, displaySize, displaySize);
	}
	drawCharacterImage(jacobNameImage, width / 2, height / 2 + 132, 220, 64);
	drawText('PRESS ENTER TO CONTINUE', width / 2, height * 0.78, 12, '#666b78', 'center');
}

function drawCharacterImage(image, centerX, centerY, maxWidth, maxHeight) {
	if (!image.complete || !image.naturalWidth) return;
	const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
	const width = image.naturalWidth * scale;
	const height = image.naturalHeight * scale;
	context.drawImage(image, centerX - width / 2, centerY - height / 2, width, height);
}

function startGame() {
	screen.level = 1;
	screen.lives = screen.maxLives;
	startGameMusic();
	createBoard();
	screen.view = 'fade';
	screen.fadeAlpha = 0;
	screen.fadeDirection = 1;
	screen.fadeTarget = 'game';
	draw();
}

function boardTarget(level) {
	if (level === 1) return [5, 6];
	if (level === 2) return [5, 7];
	if (level === 3) return [6, 7];
	if (level === 4) return [5, 10];
	const target = 50 + (level - 4) * 14;
	const columns = Math.ceil(Math.sqrt(target * 1.25));
	return [Math.ceil(target / columns), columns];
}

function createBoard() {
	[screen.boardRows, screen.boardColumns] = boardTarget(screen.level);
	const totalTiles = screen.boardRows * screen.boardColumns;
	screen.mines = Math.max(4, Math.floor(totalTiles * Math.min(0.28, 0.16 + screen.level * 0.015)));
	screen.board = Array.from({ length: screen.boardRows }, () => Array.from({ length: screen.boardColumns }, () => ({
		mine: false,
		revealed: false,
		flagged: false,
		number: 0
	})));
	const positions = Array.from({ length: totalTiles }, (_, index) => index);
	for (let mine = 0; mine < screen.mines; mine += 1) {
		const positionIndex = Math.floor(Math.random() * positions.length);
		const position = positions.splice(positionIndex, 1)[0];
		screen.board[Math.floor(position / screen.boardColumns)][position % screen.boardColumns].mine = true;
	}
	for (let row = 0; row < screen.boardRows; row += 1) {
		for (let column = 0; column < screen.boardColumns; column += 1) {
			screen.board[row][column].number = getNeighbors(row, column).filter((tile) => tile.mine).length;
		}
	}
	screen.gameStatus = 'playing';
	layoutBoard();
}

function layoutBoard() {
	const availableWidth = Math.max(256, window.innerWidth - 32);
	const availableHeight = Math.max(256, window.innerHeight - 110);
	screen.boardTileSize = Math.min(64, Math.floor(Math.min(availableWidth / screen.boardColumns, availableHeight / screen.boardRows)));
	screen.boardLeft = (window.innerWidth - screen.boardColumns * screen.boardTileSize) / 2;
	screen.boardTop = (window.innerHeight - screen.boardRows * screen.boardTileSize) / 2 + 20;
}

function getNeighbors(row, column) {
	const neighbors = [];
	for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
		for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
			if (!rowOffset && !columnOffset) continue;
			const neighborRow = row + rowOffset;
			const neighborColumn = column + columnOffset;
			if (screen.board[neighborRow]?.[neighborColumn]) neighbors.push(screen.board[neighborRow][neighborColumn]);
		}
	}
	return neighbors;
}

function revealTile(row, column) {
	if (screen.gameStatus !== 'playing') return;
	const tile = screen.board[row]?.[column];
	if (!tile || tile.revealed || tile.flagged) return;
	tile.revealed = true;
	if (tile.mine) {
		screen.lives -= 1;
		screen.gameStatus = screen.lives > 0 ? 'lifeLost' : 'lost';
		if (screen.gameStatus === 'lost') screen.board.flat().forEach((candidate) => { if (candidate.mine) candidate.revealed = true; });
		return;
	}
	if (tile.number === 0) {
		for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
			for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
				if (rowOffset || columnOffset) revealTile(row + rowOffset, column + columnOffset);
			}
		}
	}
	if (screen.board.flat().every((candidate) => candidate.mine || candidate.revealed)) screen.gameStatus = 'won';
}

function toggleFlag(row, column) {
	if (screen.gameStatus !== 'playing') return;
	const tile = screen.board[row]?.[column];
	if (tile && !tile.revealed) tile.flagged = !tile.flagged;
}

function drawGame(width, height) {
	if (!screen.board.length) createBoard();
	drawText(`LEVEL ${screen.level}`, 20, 30, 16, '#4d5261', 'left');
	drawText(`LIVES ${screen.lives}/${screen.maxLives}`, width / 2, 30, 16, '#4d5261', 'center');
	drawText(`${screen.mines} MINES`, width - 20, 30, 16, '#4d5261', 'right');
	for (let row = 0; row < screen.boardRows; row += 1) {
		for (let column = 0; column < screen.boardColumns; column += 1) {
			drawTile(screen.board[row][column], row, column);
		}
	}
	if (screen.gameStatus === 'won') drawGameMessage('FLOOR CLEARED', 'PRESS ENTER FOR THE NEXT FLOOR');
	if (screen.gameStatus === 'lifeLost') drawGameMessage('LIFE LOST', `PRESS ENTER TO RETRY  ·  ${screen.lives} REMAINING`);
	if (screen.gameStatus === 'lost') drawGameMessage('RUN ENDED', 'PRESS ENTER TO START AGAIN');
}

function drawTile(tile, row, column) {
	if (!tilesSheet.complete || !tilesSheet.naturalWidth) return;
	const sprite = tile.revealed ? (tile.mine ? [5, 0] : numberSprite(tile.number)) : (tile.flagged ? [4, 1] : [5, 1]);
	const sourceColumn = sprite[0];
	const sourceRow = sprite[1];
	const size = screen.boardTileSize;
	context.drawImage(tilesSheet, sourceColumn * 64, sourceRow * 64, 64, 64, screen.boardLeft + column * size, screen.boardTop + row * size, size, size);
}

function numberSprite(number) {
	const sprites = [
		[4, 0],
		[0, 0], [0, 1],
		[1, 0], [1, 1],
		[2, 0], [2, 1],
		[3, 0], [3, 1]
	];
	return sprites[number] || sprites[0];
}

function drawGameMessage(title, subtitle) {
	context.fillStyle = 'rgba(255, 244, 142, 0.9)';
	context.fillRect(0, 0, window.innerWidth, window.innerHeight);
	drawText(title, window.innerWidth / 2, window.innerHeight * 0.42, 30, '#e04b43', 'center');
	drawText(subtitle, window.innerWidth / 2, window.innerHeight * 0.55, 14, '#4d5261', 'center');
}

function drawFade(width, height) {
	drawGame(width, height);
	context.fillStyle = `rgba(0, 0, 0, ${screen.fadeAlpha})`;
	context.fillRect(0, 0, width, height);
}

function getBoardPosition(event) {
	const column = Math.floor((event.clientX - screen.boardLeft) / screen.boardTileSize);
	const row = Math.floor((event.clientY - screen.boardTop) / screen.boardTileSize);
	return row >= 0 && row < screen.boardRows && column >= 0 && column < screen.boardColumns ? { row, column } : null;
}

function drawFlag(centerX, centerY, maxHeight) {
	if (!flagSheet.complete || !flagSheet.naturalWidth) return;
	const frameWidth = flagSheet.naturalWidth / 3;
	const frameHeight = flagSheet.naturalHeight;
	const scale = Math.min(2, maxHeight / frameHeight);
	const width = frameWidth * scale;
	const height = frameHeight * scale;
	context.drawImage(flagSheet, screen.flagFrame * frameWidth, 0, frameWidth, frameHeight, centerX - width / 2, centerY - height / 2, width, height);
}

function drawPlaceholder(width, height) {
	drawText(screen.view.toUpperCase(), width / 2, height * 0.32, 28, '#e8b85d', 'center');
	const messages = {
		game: 'The first minefield is waiting to be built.',
		options: 'Options will be added here.',
		discoveries: 'Discoveries will be added here.'
	};
	const message = messages[screen.view];
	drawText(message, width / 2, height * 0.43, 16, '#b8b5ab', 'center');
	drawText('PRESS ESC OR CLICK TO RETURN', width / 2, height * 0.7, 12, '#666b78', 'center');
}

function drawText(text, x, y, size, color, align) {
	context.font = `${size}px Georgia, 'Times New Roman', serif`;
	context.fillStyle = color;
	context.textAlign = align;
	context.fillText(text, x, y);
}

function activateSelection() {
	startTitleMusic();
	const item = menuItems[screen.selected];
	if (item === 'Start') {
		screen.view = 'character';
		draw();
		return;
	}
	screen.view = item.toLowerCase();
	draw();
}

function moveSelection(direction) {
	screen.selected = (screen.selected + direction + menuItems.length) % menuItems.length;
	draw();
}

canvas.addEventListener('click', (event) => {
	if (screen.view === 'intro') {
		startTitleMusic();
		return;
	}
	if (screen.view === 'fade') return;
	if (screen.view === 'character') return;
	if (screen.view === 'game') {
		startGameMusic();
		if (screen.gameStatus !== 'playing') return;
		const position = getBoardPosition(event);
		if (position) revealTile(position.row, position.column);
		draw();
		return;
	}
	if (screen.view !== 'menu') {
		screen.view = 'menu';
		draw();
		return;
	}
	startTitleMusic();
	const menuTop = getMenuTop(window.innerHeight);
	const clicked = Math.round((event.clientY - menuTop) / 46);
	if (clicked >= 0 && clicked < menuItems.length) {
		screen.selected = clicked;
		activateSelection();
	}
});

canvas.addEventListener('contextmenu', (event) => {
	if (screen.view !== 'game') return;
	event.preventDefault();
	const position = getBoardPosition(event);
	if (position) toggleFlag(position.row, position.column);
	draw();
});

window.addEventListener('keydown', (event) => {
	ensureMusicForView();
	if (event.key === 'Escape') {
		screen.view = 'intro';
		draw();
		return;
	}
	if (screen.view === 'intro') {
		if (event.key === 'Enter') {
			screen.view = 'menu';
			draw();
		}
		return;
	}
	if (screen.view === 'character') {
		if (event.key === 'Enter' || event.key === ' ') {
			startGame();
		}
		return;
	}
	if (screen.view === 'fade') return;
	if (screen.view === 'game') {
		if (event.key === 'Enter' && screen.gameStatus === 'won') {
			if (screen.level % 2 === 0 && screen.lives < screen.maxLives) screen.lives += 1;
			screen.level += 1;
			createBoard();
			draw();
		} else if (event.key === 'Enter' && screen.gameStatus === 'lifeLost') {
			screen.gameStatus = 'playing';
			draw();
		} else if (event.key === 'Enter' && screen.gameStatus === 'lost') {
			startGame();
		}
		return;
	}
	if (screen.view !== 'menu') return;
	if (event.key === 'ArrowUp') moveSelection(-1);
	if (event.key === 'ArrowDown') moveSelection(1);
	if (event.key === 'Enter' || event.key === ' ') activateSelection();
});

function animate(time) {
	const elapsed = time - screen.lastTime;
	screen.lastTime = time;
	screen.flagTimer += elapsed;
	screen.jacobTimer += elapsed;
	if (screen.flagTimer > 260) {
		screen.flagFrame = (screen.flagFrame + 1) % 3;
		screen.flagTimer = 0;
		draw();
	}
	if (screen.jacobTimer >= 250) {
		screen.jacobFrame = (screen.jacobFrame + 1) % 2;
		screen.jacobTimer = 0;
		if (screen.view === 'character') draw();
	}
	if (screen.view === 'fade') {
		screen.fadeAlpha += screen.fadeDirection * elapsed / 350;
		if (screen.fadeDirection > 0 && screen.fadeAlpha >= 1) {
			screen.fadeAlpha = 1;
			screen.view = screen.fadeTarget;
			screen.fadeDirection = -1;
		} else if (screen.fadeDirection < 0 && screen.fadeAlpha <= 0) {
			screen.fadeAlpha = 0;
			screen.fadeDirection = 0;
		}
		draw();
	}
	requestAnimationFrame(animate);
}

titleImage.addEventListener('load', draw);
flagSheet.addEventListener('load', draw);
jacobSheet.addEventListener('load', draw);
whoAmIImage.addEventListener('load', draw);
jacobNameImage.addEventListener('load', draw);
tilesSheet.addEventListener('load', draw);
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);
