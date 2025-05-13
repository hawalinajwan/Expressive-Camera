const video = document.getElementById('video');

// Fungsi: aktifkan kamera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (error) {
    alert("Gagal mengakses kamera: " + error.message);
  }
}

startCamera();
