var player = {
    name: "you",
    description: "why did you inspect yourself?",
    health: 100,
    speed: 5,
    optionsperturn: 1,
    resistances: ["Blunt"],
};

var zombie = {
    name: "zombie",
    description: "a zombie, probably doesn't bleed",
    health: 75,
    speed: 2,
    optionsperturn: 1,
    resistances: ["Bleed"],
};

console.log(player.health);
console.log(zombie.health);