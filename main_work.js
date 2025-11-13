const canvas = document.getElementById('canvas-bg');
const ctx = canvas.getContext('2d');
const workLink = document.getElementById('work-link');
const returnDisplaysContainer = document.getElementById('return-displays-container');
const returnDisplays = [];

let animationFrame;
let isAnimating = false;
let points = [];
let currentColor = '#e74c3c';
let sweepProgress = 0;
let sweepInterval;
let returnUpdateInterval;

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generatePath();
}

function generatePath() {
    points = [];
    const centerY = canvas.height / 2;
    const segments = 20;

    // Start at 20% and end at 80% of canvas width
    const startX = canvas.width * 0.2;
    const endX = canvas.width * 0.8;
    const lineWidth = endX - startX;

    // Always start at random mid range (40-60% of screen height)
    const startY = canvas.height * (0.4 + Math.random() * 0.2);

    // Determine trend based on color
    // Red (positive) = line goes UP on screen = Y decreases = trend is negative
    // Green (negative) = line goes DOWN on screen = Y increases = trend is positive
    const trend = currentColor === '#e74c3c' ? -1 : 1;
    const trendStrength = 150;

    let currentY = startY;

    for (let i = 0; i <= segments; i++) {
        const x = startX + (lineWidth / segments) * i;
        const variation = (Math.random() - 0.5) * 220;
        const trendOffset = (i / segments) * trend * trendStrength;

        currentY += variation;
        const targetY = startY + trendOffset;

        // Keep within bounds and drift toward trend line
        currentY = Math.max(50, Math.min(canvas.height - 50, currentY));
        currentY += (targetY - currentY) * 0.08;

        points.push({x, y: currentY});
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function drawLine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const visibleIndex = Math.floor((points.length - 1) * sweepProgress);

    // Convert hex to rgb
    const r = parseInt(currentColor.slice(1, 3), 16);
    const g = parseInt(currentColor.slice(3, 5), 16);
    const b = parseInt(currentColor.slice(5, 7), 16);

    // Draw the line with fading based on distance from head
    for (let i = 0; i < visibleIndex; i++) {
        // Distance from the head (how many segments away)
        const distanceFromHead = visibleIndex - i;
        const fadeLength = 15; // Only last 15 segments are visible

        let opacity;
        if (distanceFromHead <= fadeLength) {
            // Fade: closer to head = brighter, further = dimmer
            opacity = (1 - distanceFromHead / fadeLength) * 0.9;
        } else {
            // Too far from head, invisible
            opacity = 0;
        }

        if (opacity > 0) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            if (i + 1 < points.length) {
                ctx.lineTo(points[i + 1].x, points[i + 1].y);
            }
            ctx.stroke();
        }
    }

    // Draw a bright leading dot at the head
    if (visibleIndex > 0 && visibleIndex < points.length) {
        const headPoint = points[visibleIndex];

        // Outer glow
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
        ctx.fill();

        // Middle glow
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
        ctx.fill();

        // Bright center dot
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = currentColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = currentColor;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function animate() {
    drawLine();
    animationFrame = requestAnimationFrame(animate);
}

function createReturnDisplays() {
    // Clear any existing displays first
    returnDisplaysContainer.innerHTML = '';
    returnDisplays.length = 0;

    // Create 14-18 return displays at random positions
    const count = Math.floor(Math.random() * 5) + 14;
    const positions = [];
    const minDistance = 10; // Minimum distance in percentage

    for (let i = 0; i < count; i++) {
        let x, y, attempts = 0;
        let validPosition = false;

        // Try to find a valid position that doesn't overlap
        while (!validPosition && attempts < 50) {
            x = Math.random() * 100;
            y = Math.random() * 100;

            // Avoid center area (30-70% of screen)
            if ((x < 30 || x > 70) || (y < 30 || y > 70)) {
                // Position is in valid area
            } else {
                // Push to edges
                x = x < 50 ? x * 0.3 : 70 + (x - 70) * 0.3;
                y = y < 50 ? y * 0.3 : 70 + (y - 70) * 0.3;
            }

            // Check distance from existing positions
            validPosition = true;
            for (const pos of positions) {
                const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                if (distance < minDistance) {
                    validPosition = false;
                    break;
                }
            }

            attempts++;
        }

        if (validPosition) {
            const div = document.createElement('div');
            div.className = 'return-display';
            div.style.left = x + '%';
            div.style.top = y + '%';

            returnDisplaysContainer.appendChild(div);
            returnDisplays.push(div);
            positions.push({x, y});
        }
    }
}

function updateReturnRate() {
    // Update all return displays
    returnDisplays.forEach(display => {
        const baseRate = Math.random() * 5 + 2;
        const progressRate = sweepProgress * (Math.random() * 5 + 3);
        const totalRate = (baseRate + progressRate).toFixed(2);

        if (currentColor === '#e74c3c') {
            display.textContent = `+${totalRate}%`;
            display.style.color = '#e74c3c';
        } else {
            display.textContent = `-${totalRate}%`;
            display.style.color = '#2ecc71';
        }
    });
}

function sweep() {
    sweepProgress = 0;
    generatePath();

    // Clear previous return update interval
    if (returnUpdateInterval) {
        clearInterval(returnUpdateInterval);
    }

    // Immediately update return rate to ensure numbers show
    if (returnDisplays.length > 0) {
        updateReturnRate();
    }

    // Continue updating return rate every 0.4 seconds
    returnUpdateInterval = setInterval(() => {
        if (isAnimating && returnDisplays.length > 0) {
            updateReturnRate();
        }
    }, 400);

    const duration = 1500;
    const startTime = Date.now();

    function updateSweep() {
        const elapsed = Date.now() - startTime;
        sweepProgress = Math.min(elapsed / duration, 1);

        if (sweepProgress < 1 && isAnimating) {
            requestAnimationFrame(updateSweep);
        } else if (sweepProgress >= 1) {
            clearInterval(returnUpdateInterval);
        }
    }

    updateSweep();
}

function pump() {
    // Randomize color for each loop
    currentColor = Math.random() > 0.5 ? '#e74c3c' : '#2ecc71';

    sweep();
}

function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;

    // Randomize initial color
    currentColor = Math.random() > 0.5 ? '#e74c3c' : '#2ecc71';

    canvas.classList.add('active');

    // Create return displays
    createReturnDisplays();

    // Show all displays immediately
    returnDisplays.forEach(display => {
        display.classList.add('active');
    });

    // Start animation and set initial content
    animate();
    pump();

    // Pump every 1.5 seconds
    sweepInterval = setInterval(pump, 1500);
}

function stopAnimation() {
    isAnimating = false;
    canvas.classList.remove('active');

    // Hide and remove all displays
    returnDisplays.forEach(display => {
        display.classList.remove('active');
    });

    setTimeout(() => {
        returnDisplaysContainer.innerHTML = '';
        returnDisplays.length = 0;
    }, 300);

    cancelAnimationFrame(animationFrame);
    clearInterval(sweepInterval);
    clearInterval(returnUpdateInterval);
    currentColor = '#e74c3c';
    sweepProgress = 0;
}

workLink.addEventListener('mouseenter', startAnimation);
workLink.addEventListener('mouseleave', stopAnimation);
