const canvasWidth = 1800;
const canvasHeight = 800;
const CANVAS = document.getElementById("canvas");
CANVAS.width = canvasWidth;
CANVAS.height = canvasHeight + 50; // Add extra height for the noise line
const ctx = CANVAS.getContext('2d');

// Create an instance of the Noise class
const noiseGenerator = new Noise(
    10, // Scale
    5, // noiseScaleFactor
    3, // Zoom
    -60, // Min
    135 // Max
);

// Helper function to interpolate between two values
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Function to interpolate colors between two RGB values
function interpolateColor(color1, color2, factor) {
    return {
        r: lerp(color1.r, color2.r, factor),
        g: lerp(color1.g, color2.g, factor),
        b: lerp(color1.b, color2.b, factor),
    };
}

// Define colors for different temperature ranges
const coldColor = { r: 0, g: 0, b: 255 };     // Blue
const temperateColor = { r: 0, g: 255, b: 0 }; // Green
const hotColor = { r: 255, g: 0, b: 0 };      // Red

// Create image data for 2D noise visualization
const imageData = ctx.createImageData(800, canvasHeight);
let data = imageData.data;

for (let i = 0; i < 800; i++) {
    for (let j = 0; j < canvasHeight; j++) {
        const index = (i + j * 800) * 4;
        
        // Use the noise generator to get the mapped noise value
        const x = 15 * (i / 800);
        const y = 5 * (j / canvasHeight);
        const n = noiseGenerator.getNoise(x, y); // Get the noise value from the Noise class

        // Ensure `n` is in the range [0, 1] for color interpolation
        const normalizedN = Math.min(1, Math.max(0, (n - noiseGenerator.min) / (noiseGenerator.max - noiseGenerator.min)));

        // Interpolate colors smoothly based on temperature
        let color;
        if (normalizedN < 0.3) {
            // Interpolate between coldColor and temperateColor
            color = interpolateColor(coldColor, temperateColor, normalizedN / 0.3);
        } else if (normalizedN < 0.6) {
            // Interpolate between temperateColor and hotColor
            color = interpolateColor(temperateColor, hotColor, (normalizedN - 0.3) / 0.3);
        } else {
            // If normalizedN is greater than 0.6, use the hotColor
            color = hotColor;
        }

        // Set pixel data
        data[index + 0] = Math.floor(color.r);  // R
        data[index + 1] = Math.floor(color.g);  // G
        data[index + 2] = Math.floor(color.b);  // B
        data[index + 3] = 255; // A (fully opaque)
    }
}

ctx.putImageData(imageData, 0, 0);

// Create 1D noise line below the 2D image
ctx.beginPath();
ctx.lineWidth = 3;

for (let i = 0; i < 20 * 16; i++) {
    const x = noiseGenerator.noiseScaleFactor * (i / canvasWidth);  // Scale for the horizontal axis
    
    // Use the noise generator for the 1D noise line
    const n = noiseGenerator.getMappedNoise(x, 0); // Get the noise value from the Noise class

    // Ensure `n` is in the range [0, 1]
    const normalizedN = Math.min(1, Math.max(0, (n - noiseGenerator.min) / (noiseGenerator.max - noiseGenerator.min)));

    // Calculate the y position for the noise line
    const yLine = canvasHeight + Math.floor(normalizedN * 50);  // Extra 50px height
    const xLine = i + 850;

    if (i === 0) {
        ctx.moveTo(xLine, yLine - 50);
    } else {
        ctx.lineTo(xLine, yLine - 50);
    }

    // Every 100 iterations (or any interval you prefer), display the noise level as text
    if (i % 48 === 0) {
        ctx.fillStyle = "black";  // Set the text color
        ctx.font = "12px Arial";  // Set the font size and style
        ctx.fillText(`n: ${Math.floor(normalizedN * 100)} - ${i}`, xLine, yLine - 60);  // Display the value slightly above the line
    }
}

ctx.stroke();  // Draw the line
