const API_URL =
  "https://script.google.com/a/macros/flipkart.com/s/AKfycbzyFO4Z_lYfZ2pH0kpCe-taBJmhTxS3tWC2Yo3ON3q8Qy1PHHYYawAuNNnLZ-x_ese7Mg/exec";

async function callAPI(action, data = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...data }),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
}

export const loginDriver = (email, password) =>
  callAPI("login", { email, password });

export const getAssignments = (driver_id, date) =>
  callAPI("getAssignments", { driver_id, date });

export const submitPOD = (data) => callAPI("submitPOD", data);

export const getDeliveries = (date) => callAPI("getDeliveries", { date });

export function compressImage(dataURL, maxWidth = 1024, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataURL;
  });
}

export function stripBase64Prefix(dataURL) {
  return dataURL.split(",")[1];
}

export function todayDate() {
  return new Date().toISOString().split("T")[0];
}
