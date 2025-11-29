
// DOM Helper
export function $(s) {
    return document.querySelector(s);
}

// Performance Helpers
export function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

export function throttle(func, limit = 300) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            func(...args);
        }
    };
}

// UI Helpers
export function showToast(text, duration = 2500) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => { t.classList.remove('show'); }, duration);
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Image Processing Helpers
export function compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
        const {
            maxWidth = 2560,
            maxHeight = 1440,
            quality = 0.92,
            mimeType = 'image/jpeg',
            targetSize = null
        } = options;

        const img = new Image();

        img.onerror = () => reject(new Error('图片加载失败'));

        img.onload = function () {
            try {
                let { width, height } = img;
                let scale = 1;

                if (width > maxWidth || height > maxHeight) {
                    const widthScale = maxWidth / width;
                    const heightScale = maxHeight / height;
                    scale = Math.min(widthScale, heightScale);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                console.log(`图片尺寸: ${img.width}x${img.height} → ${width}x${height} (缩放: ${(scale * 100).toFixed(1)}%)`);

                let finalCanvas;
                if (scale < 1) {
                    finalCanvas = downscaleImage(img, width, height);
                } else {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', {
                        alpha: false,
                        desynchronized: true
                    });
                    canvas.width = width;
                    canvas.height = height;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    finalCanvas = canvas;
                }

                sharpenImage(finalCanvas);

                if (targetSize) {
                    findOptimalQuality(finalCanvas, mimeType, targetSize, 0.75, 0.98)
                        .then(resolve)
                        .catch(() => {
                            finalCanvas.toBlob(resolve, mimeType, quality);
                        });
                } else {
                    finalCanvas.toBlob(resolve, mimeType, quality);
                }

                URL.revokeObjectURL(img.src);

            } catch (error) {
                reject(error);
            }
        };

        if (file instanceof Blob) {
            img.src = URL.createObjectURL(file);
        } else {
            reject(new Error('不支持的文件类型'));
        }
    });
}

export function downscaleImage(img, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });

    let currentWidth = img.width;
    let currentHeight = img.height;

    const scaleRatio = Math.min(targetWidth / currentWidth, targetHeight / currentHeight);

    if (scaleRatio < 0.5) {
        console.log('使用分步缩放算法提升清晰度');

        let tempCanvas = document.createElement('canvas');
        let tempCtx = tempCanvas.getContext('2d', { alpha: false });

        const steps = [];
        let ratio = scaleRatio;
        while (ratio < 0.5) {
            steps.push(0.5);
            ratio = ratio / 0.5;
        }
        steps.push(ratio);

        let sourceCanvas = createCanvasFromImage(img);

        for (let i = 0; i < steps.length; i++) {
            const stepRatio = steps[i];
            const newWidth = Math.round(currentWidth * stepRatio);
            const newHeight = Math.round(currentHeight * stepRatio);

            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';

            if (i === 0) {
                tempCtx.drawImage(img, 0, 0, newWidth, newHeight);
            } else {
                tempCtx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);
            }

            currentWidth = newWidth;
            currentHeight = newHeight;

            if (i < steps.length - 1) {
                sourceCanvas = tempCanvas;
                tempCanvas = document.createElement('canvas');
                tempCtx = tempCanvas.getContext('2d', { alpha: false });
            }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);

    } else {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    }

    return canvas;
}

export function createCanvasFromImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return canvas;
}

export function sharpenImage(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const outputData = new Uint8ClampedArray(data);

    const kernel = [
        0, -0.15, 0,
        -0.15, 1.6, -0.15,
        0, -0.15, 0
    ];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;

            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIdx = ((y + ky) * width + (x + kx)) * 4 + c;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        sum += data[pixelIdx] * kernel[kernelIdx];
                    }
                }
                outputData[idx + c] = Math.max(0, Math.min(255, sum));
            }
            outputData[idx + 3] = data[idx + 3];
        }
    }

    const outputImageData = new ImageData(outputData, width, height);
    ctx.putImageData(outputImageData, 0, 0);
}

export function findOptimalQuality(canvas, mimeType, targetSize, minQuality = 0.75, maxQuality = 0.98) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 12;

        function tryQuality(quality) {
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve({ blob, size: blob.size, quality });
                }, mimeType, quality);
            });
        }

        async function binarySearch() {
            let low = minQuality;
            let high = maxQuality;
            let bestBlob = null;
            let bestQuality = minQuality;

            const highResult = await tryQuality(maxQuality);

            if (highResult.size <= targetSize) {
                resolve(highResult.blob);
                return;
            }

            while (attempts < maxAttempts && high - low > 0.015) {
                attempts++;
                const mid = (low + high) / 2;
                const result = await tryQuality(mid);

                if (result.size <= targetSize) {
                    bestBlob = result.blob;
                    bestQuality = mid;
                    low = mid;
                } else {
                    high = mid;
                }
            }

            if (bestBlob) {
                resolve(bestBlob);
            } else {
                const result = await tryQuality(minQuality);
                resolve(result.blob);
            }
        }

        binarySearch().catch(reject);
    });
}

export function smartCompress(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const fileSizeMB = file.size / 1024 / 1024;
            const targetSizeMB = 2;
            const targetSizeBytes = targetSizeMB * 1024 * 1024;

            let compressOptions;

            if (file.size < targetSizeBytes) {
                compressOptions = {
                    maxWidth: 2560,
                    maxHeight: 1440,
                    quality: 0.97,
                    mimeType: 'image/jpeg'
                };
            } else if (fileSizeMB < 4) {
                compressOptions = {
                    maxWidth: 2560,
                    maxHeight: 1440,
                    quality: 0.95,
                    targetSize: targetSizeBytes,
                    mimeType: 'image/jpeg'
                };
            } else if (fileSizeMB < 8) {
                compressOptions = {
                    maxWidth: 2560,
                    maxHeight: 1440,
                    targetSize: targetSizeBytes,
                    mimeType: 'image/jpeg'
                };
            } else {
                compressOptions = {
                    maxWidth: 2560,
                    maxHeight: 1440,
                    targetSize: targetSizeBytes,
                    mimeType: 'image/jpeg'
                };
            }

            const compressedBlob = await compressImage(file, compressOptions);

            if (compressedBlob) {
                resolve(compressedBlob);
            } else {
                reject(new Error('压缩失败'));
            }

        } catch (error) {
            console.error('智能压缩出错:', error);
            reject(error);
        }
    });
}
