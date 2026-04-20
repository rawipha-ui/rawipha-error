const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 700;

// --- CONFIG & STATE ---
let player = {
  x: 250, y: 600, size: 25, speed: 7, 
  hp: 100, maxHp: 100,
  energy: 100, shake: 0,
  isBerserk: false
};

let bullets = [];
let enemies = [];
let particles = [];
let splats = []; // คราบเลือดเอเลี่ยน
let frame = 0;
let keys = {};

// --- INPUTS ---
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function shoot() {
  const count = player.isBerserk ? 3 : 1; // ยิง 3 นัดถ้าคลั่ง
  for(let i=0; i<count; i++) {
    bullets.push({ 
      x: player.x + 10 + (i*10 - 10), 
      y: player.y, 
      dy: -12, 
      w: 4, h: 20,
      color: player.isBerserk ? "#ff0000" : "#0ff" 
    });
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") shoot();
});

// --- ART FUNCTIONS ---
function drawPlayer(x, y) {
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = player.isBerserk ? "red" : "cyan";
  
  // ปีกพลังงาน (Wings)
  ctx.fillStyle = player.isBerserk ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 255, 255, 0.5)";
  const wingSwing = Math.sin(frame * 0.2) * 10;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 10);
  ctx.lineTo(x - 30, y - 10 + wingSwing);
  ctx.lineTo(x - 10, y + 25);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(x + 35, y + 10);
  ctx.lineTo(x + 55, y - 10 + wingSwing);
  ctx.lineTo(x + 35, y + 25);
  ctx.fill();

  // ตัวละครหลัก (Core)
  ctx.fillStyle = "#111"; // บอดี้สีดำสนิท
  ctx.fillRect(x, y, 25, 25);
  ctx.strokeStyle = player.isBerserk ? "red" : "cyan";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 25, 25);
  
  // ดวงตา (Eyes)
  ctx.fillStyle = player.isBerserk ? "red" : "white";
  ctx.fillRect(x + 5, y + 5, 5, 5);
  ctx.fillRect(x + 15, y + 5, 5, 5);
  
  ctx.restore();
}

function createSplat(x, y) {
  splats.push({ x, y, size: 10 + Math.random()*20, life: 200 });
}

function createExplosion(x, y, color, amount=15) {
  for (let i = 0; i < amount; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      life: 1.0,
      color
    });
  }
}

// --- CORE ENGINE ---
function update() {
  frame++;
  player.isBerserk = player.hp < 30; // คลั่งเมื่อเลือดน้อย
  
  if (player.shake > 0) player.shake *= 0.9;

  // Movement
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x < canvas.width - 25) player.x += player.speed;

  // Bullets & Collision
  bullets.forEach((b, bi) => {
    b.y += b.dy;
    enemies.forEach((e, ei) => {
      if (b.x < e.x + e.size && b.x + b.w > e.x && b.y < e.y + e.size && b.y + b.h > e.y) {
        createExplosion(e.x, e.y, "#ff0055");
        createSplat(e.x, e.y);
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        player.shake = 5;
      }
    });
  });

  // Spawn Enemies
  if (frame % 20 === 0) {
    enemies.push({ x: Math.random()*480, y: -30, size: 25, speed: 4 });
  }

  enemies.forEach((e, i) => {
    e.y += e.speed;
    if (e.y > canvas.height) enemies.splice(i, 1);
    // Hit Player
    if (player.x < e.x + e.size && player.x + 25 > e.x && player.y < e.y + e.size && player.y + 25 > e.y) {
      player.hp -= 10;
      player.shake = 20;
      enemies.splice(i, 1);
    }
  });

  particles.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.03;
    if (p.life <= 0) particles.splice(i, 1);
  });

  splats.forEach((s, i) => {
    s.life--;
    if (s.life <= 0) splats.splice(i, 1);
  });

  if (player.hp <= 0) location.reload();
}

function draw() {
  // BG
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Splats (คราบเลือด)
  ctx.save();
  splats.forEach(s => {
    ctx.globalAlpha = s.life / 200;
    ctx.fillStyle = "#440022";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();

  // Draw Objects
  ctx.save();
  let sx = (Math.random()-0.5) * player.shake;
  let sy = (Math.random()-0.5) * player.shake;
  ctx.translate(sx, sy);

  drawPlayer(player.x, player.y);

  bullets.forEach(b => {
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  enemies.forEach(e => {
    ctx.fillStyle = "#333";
    ctx.fillRect(e.x, e.y, e.size, e.size);
    ctx.strokeStyle = "red";
    ctx.strokeRect(e.x, e.y, e.size, e.size);
  });

  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  });
  ctx.restore();

  // UI
  ctx.fillStyle = "white";
  ctx.font = "20px Georgia";
  ctx.fillText("SOULS COLLECTED: " + frame, 20, 40);
  
  // Health Bar
  ctx.fillStyle = "#222";
  ctx.fillRect(20, 60, 200, 15);
  ctx.fillStyle = player.isBerserk ? "red" : "#0ff";
  ctx.fillRect(20, 60, player.hp * 2, 15);
  if(player.isBerserk) {
    ctx.fillStyle = "red";
    ctx.fillText("BERSERK MODE", 20, 95);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
