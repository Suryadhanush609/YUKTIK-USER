// src/services/location.js
export function getCurrentLocation(options = { enableHighAccuracy: true, timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    }
  });
}

export function promptManualLocation() {
  // Simple prompt fallback – in real UI replace with modal
  const lat = parseFloat(prompt('Enter latitude'));
  const lng = parseFloat(prompt('Enter longitude'));
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates');
  }
  return { latitude: lat, longitude: lng };
}

