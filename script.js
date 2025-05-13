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
  ctx.drawImage(video, 0, 0);
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

  const size = 500;
  const collageCanvas = document.createElement('canvas');
  collageCanvas.width = size + 100;
  collageCanvas.height = size * wrappers.length + 50; 
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
    const x = 50; 
    const y = i * size + 25; 

    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const targetHeight = size * aspectRatio;

    ctx.drawImage(img, x, y, size, targetHeight);

    ctx.strokeText(label, x + size / 2, y + targetHeight + 35);
    ctx.fillText(label, x + size / 2, y + targetHeight + 35);
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
  }, 250);
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
