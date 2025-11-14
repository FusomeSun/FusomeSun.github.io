(function() {
    const canvas = document.getElementById('canvas-bg');
    const ctx = canvas.getContext('2d');
    const mindLink = document.querySelector('a[href="mind.html"]');

    let animationFrame;
    let isAnimating = false;
    let stars = [];
    let nebulaLayers = [];
    let dustParticles = [];
    let starConnections = [];
    let backgroundNoise = [];
    let darkNebula = [];
    let foregroundClouds = [];
    let meteors = [];

    // Vanishing point for perspective
    let vanishingPoint = { x: 0, y: 0 };

    // Meteor timing
    let lastMeteorTime = 0;
    let nextMeteorDelay = 0;

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        vanishingPoint = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        if (isAnimating) {
            generateCosmos();
        }
    }

    // Draw a star with triangular spikes radiating from center
    function drawStar(cx, cy, spikes, outerRadius, innerRadius, rotation, opacity, blur = 0) {
        if (blur > 0) {
            ctx.filter = `blur(${blur}px)`;
        }

        const step = (Math.PI * 2) / spikes;
        let rot = Math.PI / 2 * 3 + rotation;

        // Glow effect
        ctx.shadowBlur = 15 * (1 - blur / 3);
        ctx.shadowColor = `rgba(255, 255, 255, ${opacity})`;

        // Draw each spike as a triangle - wide at base, narrow at tip
        for (let i = 0; i < spikes; i++) {
            const angle = rot + step * i;
            const tipX = cx + Math.cos(angle) * outerRadius;
            const tipY = cy + Math.sin(angle) * outerRadius;

            // Base width at center
            const baseWidth = innerRadius;
            const perpAngle = angle + Math.PI / 2;

            ctx.beginPath();
            // Left edge at base (wide)
            ctx.moveTo(
                cx + Math.cos(perpAngle) * baseWidth,
                cy + Math.sin(perpAngle) * baseWidth
            );
            // Tip of spike (narrow point)
            ctx.lineTo(tipX, tipY);
            // Right edge at base (wide)
            ctx.lineTo(
                cx - Math.cos(perpAngle) * baseWidth,
                cy - Math.sin(perpAngle) * baseWidth
            );
            ctx.closePath();

            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fill();
        }

        // Draw bright center point to fill the gap
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();

        ctx.shadowBlur = 0;

        if (blur > 0) {
            ctx.filter = 'none';
        }
    }

    function generateCosmos() {
        stars = [];
        nebulaLayers = [];
        dustParticles = [];
        starConnections = [];
        backgroundNoise = [];
        darkNebula = [];
        foregroundClouds = [];

        // Create sparse background noise for texture with depth
        const noiseCount = 800;
        for (let i = 0; i < noiseCount; i++) {
            const depth = Math.random(); // 0 = far, 1 = close
            backgroundNoise.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: (Math.random() * 0.6 + 0.2) * (0.5 + depth * 0.5),
                opacity: (Math.random() * 0.12 + 0.04) * (0.4 + depth * 0.6),
                depth,
                color: {
                    r: Math.random() * 40 + 140,
                    g: Math.random() * 40 + 110,
                    b: Math.random() * 60 + 160
                }
            });
        }

        // Create dark nebula clouds with depth
        const darkNebulaCount = 15;
        for (let i = 0; i < darkNebulaCount; i++) {
            const depth = Math.random() * 0.7 + 0.3; // Middle to far
            darkNebula.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                // Increased size variation - far objects much smaller
                radius: (Math.random() * 300 + 200) * (0.4 + depth * 1.0),
                opacity: (Math.random() * 0.25 + 0.15) * depth,
                depth,
                drift: {
                    // Parallax - far objects slower
                    x: (Math.random() - 0.5) * 0.1 * (0.5 + depth),
                    y: (Math.random() - 0.5) * 0.1 * (0.5 + depth)
                },
                pulseSpeed: Math.random() * 0.008 + 0.003,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }

        // Create nebula layers with depth - sparse colored pockets in mostly dark space
        const layerConfigs = [
            { count: 4, color: { r: 65, g: 55, b: 120 }, name: 'deep space purple' },
            { count: 3, color: { r: 45, g: 45, b: 90 }, name: 'dark indigo' },
            { count: 3, color: { r: 50, g: 60, b: 100 }, name: 'cosmic blue' },
            { count: 2, color: { r: 70, g: 50, b: 110 }, name: 'nebula violet' },
        ];

        layerConfigs.forEach(config => {
            for (let i = 0; i < config.count; i++) {
                const depth = Math.random(); // 0 = far, 1 = close
                nebulaLayers.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    // Increased size variation for more depth - far objects much smaller
                    radius: (Math.random() * 250 + 150) * (0.3 + depth * 1.2),
                    // Reduced opacity for more dark space
                    opacity: (Math.random() * 0.18 + 0.08) * (0.5 + depth * 0.5),
                    color: config.color,
                    depth,
                    drift: {
                        // Far objects move slower (parallax)
                        x: (Math.random() - 0.5) * 0.15 * (0.5 + depth * 1.5),
                        y: (Math.random() - 0.5) * 0.15 * (0.5 + depth * 1.5)
                    },
                    pulseSpeed: Math.random() * 0.01 + 0.005,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }
        });

        // Create dust particles with depth
        const dustCount = 600;
        for (let i = 0; i < dustCount; i++) {
            const depth = Math.random();
            dustParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: (Math.random() * 1.2 + 0.3) * (0.5 + depth * 0.5),
                opacity: (Math.random() * 0.35 + 0.1) * (0.5 + depth * 0.5),
                depth,
                drift: {
                    x: (Math.random() - 0.5) * 0.1 * (1 + depth),
                    y: (Math.random() - 0.5) * 0.1 * (1 + depth)
                }
            });
        }

        // Create stars with depth - 1.5x more stars
        const starCount = Math.floor(Math.random() * 75) + 150;
        for (let i = 0; i < starCount; i++) {
            const depth = Math.random(); // 0 = far, 1 = close
            const size = Math.random();
            let outerRadius, innerRadius, spikes, isRound = false;

            const depthScale = 0.2 + depth * 0.8;

            // Size variations with classic proportions
            if (size > 0.85) {
                outerRadius = (Math.random() * 5 + 7) * depthScale;
                innerRadius = outerRadius * 0.25;
                spikes = 5;
            } else if (size > 0.6) {
                outerRadius = (Math.random() * 3 + 4) * depthScale;
                innerRadius = outerRadius * 0.28;
                spikes = 5;
            } else {
                // Small stars are round
                outerRadius = (Math.random() * 2 + 1.5) * depthScale;
                innerRadius = 0;
                spikes = 0;
                isRound = true;
            }

            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                outerRadius,
                innerRadius,
                spikes,
                isRound,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.003,
                opacity: Math.random(),
                twinkleSpeed: Math.random() * 0.04 + 0.02,
                twinklePhase: Math.random() * Math.PI * 2,
                baseOpacity: (Math.random() * 0.2 + 0.7) * (0.4 + depth * 0.6),
                depth,
                // Add depth movement for 3D effect
                depthVelocity: (Math.random() - 0.5) * 0.001,
                originalDepth: depth,
                // Add slow drift
                drift: {
                    x: (Math.random() - 0.5) * 0.05,
                    y: (Math.random() - 0.5) * 0.05
                }
            });
        }

        // Sort stars by depth for proper rendering
        stars.sort((a, b) => a.depth - b.depth);

        // Create connections only between stars at similar depths
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const depthDiff = Math.abs(stars[i].depth - stars[j].depth);
                if (depthDiff > 0.3) continue; // Don't connect stars at very different depths

                const dx = stars[i].x - stars[j].x;
                const dy = stars[i].y - stars[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const maxDistance = Math.min(canvas.width, canvas.height) * 0.2;
                if (distance < maxDistance && Math.random() > 0.85) {
                    starConnections.push({
                        from: i,
                        to: j,
                        opacity: Math.random() * 0.12 + 0.04, // Back to original subtle opacity
                        pulseSpeed: Math.random() * 0.02 + 0.01,
                        pulsePhase: Math.random() * Math.PI * 2,
                        depth: (stars[i].depth + stars[j].depth) / 2
                    });
                }
            }
        }

        // Create large foreground clouds for depth - realistic colors
        const foregroundCount = 5;
        const foregroundColors = [
            { r: 45, g: 45, b: 90 },
            { r: 55, g: 50, b: 100 },
            { r: 50, g: 45, b: 85 }
        ];
        for (let i = 0; i < foregroundCount; i++) {
            const selectedColor = foregroundColors[Math.floor(Math.random() * foregroundColors.length)];
            foregroundClouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 600 + 500,
                opacity: Math.random() * 0.12 + 0.06,
                color: selectedColor,
                drift: {
                    x: (Math.random() - 0.5) * 0.35,
                    y: (Math.random() - 0.5) * 0.35
                },
                pulseSpeed: Math.random() * 0.01 + 0.005,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        vanishingPoint = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        window.addEventListener('resize', resizeCanvas);

        // Initialize mind animating state
        document.body.setAttribute('data-mind-animating', 'false');
    }

    // Create a new meteor
    function createMeteor() {
        const startSide = Math.random();
        let x, y, angle;

        // Random starting position from edges
        if (startSide < 0.25) {
            // Top edge
            x = Math.random() * canvas.width;
            y = -50;
            angle = Math.random() * Math.PI / 3 + Math.PI / 6; // 30-90 degrees downward
        } else if (startSide < 0.5) {
            // Right edge
            x = canvas.width + 50;
            y = Math.random() * canvas.height;
            angle = Math.random() * Math.PI / 3 + Math.PI * 2 / 3; // Toward left-down
        } else if (startSide < 0.75) {
            // Top-right corner (most common for meteors)
            x = canvas.width + Math.random() * 100;
            y = -Math.random() * 100;
            angle = Math.random() * Math.PI / 4 + Math.PI * 3 / 8; // Diagonal down-left
        } else {
            // Left edge
            x = -50;
            y = Math.random() * canvas.height;
            angle = Math.random() * Math.PI / 3 - Math.PI / 6; // Toward right-down
        }

        const speed = Math.random() * 3 + 5; // 5-8 pixels per frame
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        meteors.push({
            x,
            y,
            vx,
            vy,
            length: Math.random() * 60 + 40, // Trail length
            opacity: 1,
            brightness: Math.random() * 0.3 + 0.7,
            color: Math.random() > 0.7 ?
                { r: 200, g: 220, b: 255 } : // Bluish-white
                { r: 255, g: 240, b: 200 }   // Yellowish-white
        });
    }

    function drawCosmos() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Sort and draw background noise by depth
        backgroundNoise.sort((a, b) => a.depth - b.depth);
        backgroundNoise.forEach(noise => {
            const blur = (1 - noise.depth) * 1.5;
            if (blur > 0.4) {
                ctx.filter = `blur(${blur}px)`;
            }
            ctx.fillStyle = `rgba(${noise.color.r}, ${noise.color.g}, ${noise.color.b}, ${noise.opacity})`;
            ctx.beginPath();
            ctx.arc(noise.x, noise.y, noise.radius, 0, Math.PI * 2);
            ctx.fill();
            if (blur > 0.4) {
                ctx.filter = 'none';
            }
        });

        // Draw dark nebula with depth blur
        darkNebula.forEach(dark => {
            dark.pulsePhase += dark.pulseSpeed;
            const pulseFactor = Math.sin(dark.pulsePhase) * 0.1 + 1;
            const currentRadius = dark.radius * pulseFactor;
            const currentOpacity = dark.opacity * (0.85 + Math.sin(dark.pulsePhase) * 0.15);

            const blur = (1 - dark.depth) * 3;
            if (blur > 0.4) {
                ctx.filter = `blur(${blur}px)`;
            }

            const gradient = ctx.createRadialGradient(
                dark.x, dark.y, 0,
                dark.x, dark.y, currentRadius
            );

            gradient.addColorStop(0, `rgba(0, 0, 0, ${currentOpacity})`);
            gradient.addColorStop(0.3, `rgba(10, 5, 20, ${currentOpacity * 0.8})`);
            gradient.addColorStop(0.6, `rgba(20, 10, 35, ${currentOpacity * 0.5})`);
            gradient.addColorStop(0.85, `rgba(30, 15, 50, ${currentOpacity * 0.2})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(dark.x, dark.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();

            if (blur > 0.4) {
                ctx.filter = 'none';
            }

            dark.x += dark.drift.x;
            dark.y += dark.drift.y;

            if (dark.x < -currentRadius) dark.x = canvas.width + currentRadius;
            if (dark.x > canvas.width + currentRadius) dark.x = -currentRadius;
            if (dark.y < -currentRadius) dark.y = canvas.height + currentRadius;
            if (dark.y > canvas.height + currentRadius) dark.y = -currentRadius;
        });

        // Draw nebula layers with depth blur
        nebulaLayers.forEach(layer => {
            layer.pulsePhase += layer.pulseSpeed;
            const pulseFactor = Math.sin(layer.pulsePhase) * 0.15 + 1;
            const currentRadius = layer.radius * pulseFactor;
            const currentOpacity = layer.opacity * (0.8 + Math.sin(layer.pulsePhase) * 0.2);

            const blur = (1 - layer.depth) * 4;
            if (blur > 0.4) {
                ctx.filter = `blur(${blur}px)`;
            }

            const gradient = ctx.createRadialGradient(
                layer.x, layer.y, 0,
                layer.x, layer.y, currentRadius
            );

            gradient.addColorStop(0, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, ${currentOpacity})`);
            gradient.addColorStop(0.2, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, ${currentOpacity * 0.9})`);
            gradient.addColorStop(0.4, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, ${currentOpacity * 0.6})`);
            gradient.addColorStop(0.7, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, ${currentOpacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(layer.x, layer.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();

            if (blur > 0.4) {
                ctx.filter = 'none';
            }

            layer.x += layer.drift.x;
            layer.y += layer.drift.y;

            if (layer.x < -currentRadius) layer.x = canvas.width + currentRadius;
            if (layer.x > canvas.width + currentRadius) layer.x = -currentRadius;
            if (layer.y < -currentRadius) layer.y = canvas.height + currentRadius;
            if (layer.y > canvas.height + currentRadius) layer.y = -currentRadius;
        });

        // Draw dust particles with depth blur
        dustParticles.forEach(dust => {
            const blur = (1 - dust.depth) * 1.2;
            if (blur > 0.4) {
                ctx.filter = `blur(${blur}px)`;
            }
            ctx.fillStyle = `rgba(200, 200, 220, ${dust.opacity})`;
            ctx.beginPath();
            ctx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
            ctx.fill();
            if (blur > 0.4) {
                ctx.filter = 'none';
            }

            dust.x += dust.drift.x;
            dust.y += dust.drift.y;

            if (dust.x < 0) dust.x = canvas.width;
            if (dust.x > canvas.width) dust.x = 0;
            if (dust.y < 0) dust.y = canvas.height;
            if (dust.y > canvas.height) dust.y = 0;
        });

        // Draw star connections with depth consideration
        starConnections.forEach(connection => {
            const fromStar = stars[connection.from];
            const toStar = stars[connection.to];

            connection.pulsePhase += connection.pulseSpeed;
            const pulseOpacity = connection.opacity * (0.7 + Math.sin(connection.pulsePhase) * 0.3);

            const blur = (1 - connection.depth) * 1.5;
            if (blur > 0.4) {
                ctx.filter = `blur(${blur}px)`;
            }

            const gradient = ctx.createLinearGradient(
                fromStar.x, fromStar.y,
                toStar.x, toStar.y
            );

            gradient.addColorStop(0, `rgba(150, 150, 255, ${pulseOpacity * fromStar.opacity})`);
            gradient.addColorStop(0.5, `rgba(180, 180, 255, ${pulseOpacity * 0.5})`);
            gradient.addColorStop(1, `rgba(150, 150, 255, ${pulseOpacity * toStar.opacity})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5 * (0.5 + connection.depth * 0.5); // Increased from 1 to 1.5
            ctx.beginPath();
            ctx.moveTo(fromStar.x, fromStar.y);
            ctx.lineTo(toStar.x, toStar.y);
            ctx.stroke();

            if (blur > 0.4) {
                ctx.filter = 'none';
            }
        });

        // Draw stars with depth blur and movement
        stars.forEach(star => {
            // Twinkle effect - more dramatic
            star.twinklePhase += star.twinkleSpeed;
            star.rotation += star.rotationSpeed;

            // More dramatic twinkling with larger amplitude
            star.opacity = star.baseOpacity + Math.sin(star.twinklePhase) * 0.5;
            star.opacity = Math.max(0.1, Math.min(1, star.opacity));

            // Slow drift movement
            star.x += star.drift.x;
            star.y += star.drift.y;

            // Wrap around screen
            if (star.x < -50) star.x = canvas.width + 50;
            if (star.x > canvas.width + 50) star.x = -50;
            if (star.y < -50) star.y = canvas.height + 50;
            if (star.y > canvas.height + 50) star.y = -50;

            // Depth movement for 3D effect
            star.depth += star.depthVelocity;

            // Bounce depth back and forth
            if (star.depth > 1 || star.depth < 0) {
                star.depthVelocity *= -1;
                star.depth = Math.max(0, Math.min(1, star.depth));
            }

            // Scale based on depth (perspective)
            const depthScale = 0.2 + star.depth * 0.8;
            const currentOuterRadius = star.outerRadius * (star.originalDepth > 0 ? depthScale / (0.2 + star.originalDepth * 0.8) : 1);
            const currentInnerRadius = star.innerRadius * (star.originalDepth > 0 ? depthScale / (0.2 + star.originalDepth * 0.8) : 1);

            // Subtle blur for far objects
            const blur = (1 - star.depth) * 2;

            // Draw round stars as circles, pointed stars with drawStar function
            if (star.isRound) {
                if (blur > 0) {
                    ctx.filter = `blur(${blur}px)`;
                }

                ctx.beginPath();
                ctx.arc(star.x, star.y, currentOuterRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.shadowBlur = 10 * (1 - blur / 3);
                ctx.shadowColor = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
                ctx.shadowBlur = 0;

                if (blur > 0) {
                    ctx.filter = 'none';
                }
            } else {
                drawStar(
                    star.x,
                    star.y,
                    star.spikes,
                    currentOuterRadius,
                    currentInnerRadius,
                    star.rotation,
                    star.opacity,
                    blur
                );
            }
        });

        // Draw meteors with trails
        meteors = meteors.filter(meteor => {
            meteor.x += meteor.vx;
            meteor.y += meteor.vy;
            meteor.opacity -= 0.015; // Fade out

            // Draw meteor trail
            const gradient = ctx.createLinearGradient(
                meteor.x, meteor.y,
                meteor.x - meteor.vx * meteor.length / 5,
                meteor.y - meteor.vy * meteor.length / 5
            );
            gradient.addColorStop(0, `rgba(${meteor.color.r}, ${meteor.color.g}, ${meteor.color.b}, ${meteor.opacity * meteor.brightness})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(meteor.x - meteor.vx * meteor.length / 5, meteor.y - meteor.vy * meteor.length / 5);
            ctx.stroke();

            // Keep meteor if still visible and on screen
            return meteor.opacity > 0 &&
                   meteor.x > -100 && meteor.x < canvas.width + 100 &&
                   meteor.y > -100 && meteor.y < canvas.height + 100;
        });

        // Draw large foreground clouds with heavy blur
        foregroundClouds.forEach(cloud => {
            cloud.pulsePhase += cloud.pulseSpeed;
            const pulseFactor = Math.sin(cloud.pulsePhase) * 0.1 + 1;
            const currentRadius = cloud.radius * pulseFactor;
            const currentOpacity = cloud.opacity * (0.9 + Math.sin(cloud.pulsePhase) * 0.1);

            ctx.filter = 'blur(8px)';

            const gradient = ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, currentRadius
            );

            gradient.addColorStop(0, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${currentOpacity})`);
            gradient.addColorStop(0.4, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${currentOpacity * 0.6})`);
            gradient.addColorStop(0.7, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${currentOpacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.filter = 'none';

            cloud.x += cloud.drift.x;
            cloud.y += cloud.drift.y;

            if (cloud.x < -currentRadius) cloud.x = canvas.width + currentRadius;
            if (cloud.x > canvas.width + currentRadius) cloud.x = -currentRadius;
            if (cloud.y < -currentRadius) cloud.y = canvas.height + currentRadius;
            if (cloud.y > canvas.height + currentRadius) cloud.y = -currentRadius;
        });
    }

    function animate() {
        drawCosmos();

        // Meteor timing - create meteors randomly
        const currentTime = Date.now();
        if (currentTime - lastMeteorTime > nextMeteorDelay) {
            createMeteor();
            lastMeteorTime = currentTime;
            nextMeteorDelay = Math.random() * 5000 + 3000; // 3-8 seconds between meteors
        }

        animationFrame = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (isAnimating) {
            console.log('Animation already running');
            return;
        }
        isAnimating = true;

        console.log('Starting 3D nebula animation');
        console.log('Current theme:', document.body.getAttribute('data-theme'));

        // Only set mind-animating, not data-animating (to avoid conflicts with work animation CSS)
        document.body.setAttribute('data-mind-animating', 'true');

        console.log('Set data-mind-animating to: true');
        console.log('Body background color:', window.getComputedStyle(document.body).backgroundColor);

        canvas.classList.add('active');

        generateCosmos();

        // Initialize meteor timing
        lastMeteorTime = Date.now();
        nextMeteorDelay = Math.random() * 3000 + 2000; // First meteor in 2-5 seconds

        console.log('Generated stars:', stars.length);
        console.log('Generated dark nebula clouds:', darkNebula.length);
        console.log('Generated nebula layers:', nebulaLayers.length);
        console.log('Generated dust particles:', dustParticles.length);
        console.log('Generated star connections:', starConnections.length);
        console.log('Generated foreground clouds:', foregroundClouds.length);

        animate();
    }

    function stopAnimation() {
        isAnimating = false;

        console.log('Stopping nebula animation');
        // Only set mind-animating to false
        document.body.setAttribute('data-mind-animating', 'false');
        console.log('Set data-mind-animating to: false');

        canvas.classList.remove('active');

        cancelAnimationFrame(animationFrame);
        stars = [];
        nebulaLayers = [];
        dustParticles = [];
        starConnections = [];
        backgroundNoise = [];
        darkNebula = [];
        foregroundClouds = [];
        meteors = [];
    }

    console.log('main_mind.js loaded');
    console.log('mindLink found:', mindLink);

    if (mindLink) {
        mindLink.addEventListener('mouseenter', () => {
            console.log('Mind link hovered - starting animation');
            startAnimation();
        });
        mindLink.addEventListener('mouseleave', () => {
            console.log('Mind link unhovered - stopping animation');
            stopAnimation();
        });
    } else {
        console.error('Mind link not found!');
    }
})();
