const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photos = document.getElementById('photos');
const downloadBtn = document.getElementById('download');

const detectedEmotions = new Set();
const targetEmotions = ['happy', 'angry', 'surprised', 'sad'];
let currentEmotionIndex = 0;

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

function getDominantEmotion(expressions) {
  const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
  const [topEmotion, confidence] = sorted[0];
  return confidence > 0.6 ? topEmotion : null;
}

function capturePhoto() {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  ctx.restore();
  return canvas.toDataURL('image/png');
}

function mapEmotionToEmoji(emotion) {
  switch (emotion) {
    case 'happy': return '😁';
    case 'angry': return '😠';
    case 'sad': return '😟';
    case 'surprised': return '😧';
    default: return '';
  }
}

function addPhotoToGrid(imageData, label) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';

  const img = document.createElement('img');
  img.src = imageData;
  img.alt = label;
  img.width = 150;

  const emojiLabel = document.createElement('span');
  emojiLabel.style.fontSize = '24px';
  emojiLabel.textContent = mapEmotionToEmoji(label);

  wrapper.appendChild(img);
  wrapper.appendChild(emojiLabel);
  photos.appendChild(wrapper);
}

function checkDownloadReady() {
  if (detectedEmotions.size >= 4) {
    downloadBtn.style.display = 'inline-block';
  }
}

function generateCollage() {
  const wrappers = Array.from(document.querySelectorAll('#photos div'));
  if (wrappers.length < 4) return;

  const imgW = 500; 
  const imgH = 400; 
  const padding = 30;
  const labelHeight = 50;

  const collageWidth = imgW + 2 * padding;
  const collageHeight = wrappers.length * (imgH + labelHeight + padding) + padding;

  const collageCanvas = document.createElement('canvas');
  collageCanvas.width = collageWidth;
  collageCanvas.height = collageHeight;
  const ctx = collageCanvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, collageCanvas.width, collageCanvas.height);

  ctx.font = '36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;

  wrappers.forEach((wrapper, i) => {
    const img = wrapper.querySelector('img');
    const label = wrapper.querySelector('span').textContent;

    const x = padding;
    const y = padding + i * (imgH + labelHeight + padding);

    const srcAspect = img.naturalWidth / img.naturalHeight;
    const targetAspect = imgW / imgH;
    let sx, sy, sw, sh;

    if (srcAspect > targetAspect) {
      sh = img.naturalHeight;
      sw = sh * targetAspect;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / targetAspect;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, imgW, imgH);

    ctx.strokeText(label, x + imgW / 2, y + imgH + 40);
    ctx.fillText(label, x + imgW / 2, y + imgH + 40);
  });

  return collageCanvas.toDataURL('image/png');
}

video.addEventListener('play', () => {
  setInterval(async () => {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceExpressions();

    if (detection?.expressions) {
      const emotion = getDominantEmotion(detection.expressions);
      if (
  emotion &&
  emotion === targetEmotions[currentEmotionIndex]
) {
  console.log(`📸 Emosi terdeteksi: ${emotion}`);
  const image = capturePhoto();
  addPhotoToGrid(image, emotion);
  currentEmotionIndex++;

  if (currentEmotionIndex >= targetEmotions.length) {
    downloadBtn.style.display = 'inline-block';
  }
}
    }
  }, 350);
});

downloadBtn.addEventListener('click', () => {
  const collage = generateCollage();
  if (collage) {
    const a = document.createElement('a');
    a.href = collage;
    a.download = 'Expressive-Camera.png';
    a.click();
  }
});

(async () => {
  await loadModels();
  await startCamera();
})();
