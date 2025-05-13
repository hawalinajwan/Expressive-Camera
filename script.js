const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photos = document.getElementById('photos');
const downloadBtn = document.getElementById('download');

const detectedEmotions = new Set();
const targetEmotions = ['happy', 'angry', 'surprised', 'neutral'];

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

function getDominantEmotion(expressions) {
  const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
  const [topEmotion, confidence] = sorted[0];

  if (confidence > 0.8) return topEmotion;
  return null;
}

function capturePhoto() {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/png');
}

function mapEmotionToEmoji(emotion) {
  switch (emotion) {
    case 'happy':
      return '😁';
    case 'angry':
      return '😠';
    case 'surprised':
      return '😂';
    case 'neutral':
      return '😴';
    default:
      return '❓';
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

  const size = 150;
  const collageCanvas = document.createElement('canvas');
  collageCanvas.width = size * 2;
  collageCanvas.height = size * 2;
  const ctx = collageCanvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;

  wrappers.forEach((wrapper, i) => {
    const img = wrapper.querySelector('img');
    const label = wrapper.querySelector('span').textContent;
    const x = (i % 2) * size;
    const y = Math.floor(i / 2) * size;

    ctx.drawImage(img, x, y, size, size);
    ctx.strokeText(label, x + size / 2, y + size - 10);
    ctx.fillText(label, x + size / 2, y + size - 10);
  });

  return collageCanvas.toDataURL('image/png');
}

video.addEventListener('play', () => {
  const interval = setInterval(async () => {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (detection && detection.expressions) {
      const emotion = getDominantEmotion(detection.expressions);
      if (emotion && !detectedEmotions.has(emotion)) {
        if (targetEmotions.includes(emotion)) {
          console.log(`📸 Emosi terdeteksi: ${emotion}`);
          const image = capturePhoto();
          addPhotoToGrid(image, emotion);
          detectedEmotions.add(emotion);
          checkDownloadReady();
        }
      }
    }
  }, 1000);
});

downloadBtn.addEventListener('click', () => {
  const collage = generateCollage();
  if (collage) {
    const a = document.createElement('a');
    a.href = collage;
    a.download = 'kolase_emosi.png';
    a.click();
  }
});

(async () => {
  await loadModels();
  await startCamera();
})();
