const { createCanvas, registerFont } = require('canvas');
const path = require('path');

const WIDTH = 1200;
const HEIGHT = 630;

// Register font if available (server must have Inter/system font)
try {
  registerFont(path.join(__dirname, '..', '..', 'public', 'fonts', 'HostGrotesk-Medium.woff2'), {
    family: 'HostGrotesk',
    weight: '500',
  });
} catch {
  // Font not found, will use system sans-serif
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function generateOGImage(title, description) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background: deep navy gradient
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, '#04070C');
  bg.addColorStop(1, '#0A0F18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Mint accent line (top)
  ctx.fillStyle = '#5EF2A1';
  ctx.fillRect(0, 0, WIDTH, 4);

  // Logo text
  ctx.font = "500 28px 'HostGrotesk', sans-serif";
  ctx.fillStyle = '#5EF2A1';
  ctx.fillText('QUILLON', 64, 72);

  // Title
  ctx.font = "500 64px 'HostGrotesk', sans-serif";
  ctx.fillStyle = '#E8EDF5';
  const titleLines = wrapText(ctx, title, WIDTH - 128);
  const titleY = description ? 200 : 260;
  titleLines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, 64, titleY + i * 76);
  });

  // Description
  if (description) {
    ctx.font = "400 28px 'HostGrotesk', sans-serif";
    ctx.fillStyle = '#6B7687';
    const descLines = wrapText(ctx, description, WIDTH - 128);
    const descY = titleY + titleLines.slice(0, 3).length * 76 + 36;
    descLines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, 64, descY + i * 40);
    });
  }

  // Bottom domain
  ctx.font = "400 22px 'HostGrotesk', sans-serif";
  ctx.fillStyle = '#434C5E';
  ctx.fillText('quillon.ru/blog', 64, HEIGHT - 48);

  return canvas.toBuffer('image/png');
}

module.exports = { generateOGImage };
