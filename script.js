const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photos = document.getElementById('photos');
const downloadBtn = document.getElementById('download');

const detectedEmotions = new Set(); // untuk menyimpan emosi yang sudah difoto
const targetEmotions = ['happy', 'angry', 'surprised', 'sleepy']; // emosi target

// 🟡 Load model dari folder /models
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

function addPhotoToGrid(imageData, label) {
  const img = document.createElement('img');
  img.src = imageData;
  img.alt = label;
  img.width = 150;
  photos.appendChild(img);
}

function checkDownloadReady() {
  if (detectedEmotions.size >= 4) {
    downloadBtn.style.display = 'inline-block';
  }
}

video.addEventListener('play', () => {
  const interval = setInterval(async () => {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (detections && detections.expressions) {
      const emotion = getDominantEmotion(detections.expressions);
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

// Tombol download (kolase belum digabung, ini download satu per satu dulu)
downloadBtn.addEventListener('click', () => {
  const imgs = document.querySelectorAll('#photos img');
  imgs.forEach((img, index) => {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `foto_emosi_${index + 1}.png`;
    a.click();
  });
});

(async () => {
  await loadModels();
  await startCamera();
})();
