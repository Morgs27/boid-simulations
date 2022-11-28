import { useEffect, useRef, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'
import './App.css'
import { FaChevronDown, FaCheck, FaBars } from 'react-icons/fa'

type record = {
  x: number
  y: number
}

type boid = {
  id: string
  x: number
  y: number
  dx: number
  dy: number
  history: record[]
}

function App() {

  var boids: Array<boid>  

  const [numBoids, setNumBoids] = useState(200) // Total Number of boids
  const [speedLimit, setSpeedLimit] = useState(15) // Max Speed of boid
  const [visualRange, setVisualRange] = useState(75) // Visual range of boid

  const [centeringFactor, setCenteringFactor] = useState(0.005) // Rate at which velocity is changed to center boid
  const [matchingFactor, setMatchingFactor] = useState(0.05) // Rate at which velocity is changed to match the velocity of surounding biods

  const [seperationDistance, setSeperationDistance] = useState(20) // The distance to stay away from other boids
  const [seperationFactor, setSeperationFactor] = useState(0.05) // Rate at which velocity is changed to keep boids apart

  const screen = useRef<HTMLDivElement>(null) // Reference to canvas container
  const canvas = useRef<HTMLCanvasElement>(null) // Refrence to canvas
  const [screenDimensions, setScreenDimensions] = useState({width: 150, height: 150}) // Screen dimensions

  const [tail, setTail] = useState(true)
  const [arrowVisible, setArrowVisible] = useState(true)

  const [menuActive, setMenuActive] = useState(false)

  // Toggle Rules
  const [towardsCenter, setTowardsCenter] = useState(true)
  const [avoidOtherBoids, setAvoidOthersBoids] = useState(true)

  // Create Boids 
  function initBoids() { 

    boids = Array(numBoids).fill('').map(() => {
      return {
        id: uuidV4(),
        x: Math.random() * screenDimensions.width,
        y: Math.random() * screenDimensions.height,
        dx: Math.random() * 10 - 5,
        dy: Math.random() * 10 - 5,
        history: []
      } 
    })

  }

  // Keep boids within the screen. On reaching an edge velocity is reversed
  function keepWithinBounds(boid: boid) {
    const margin = 200;
    const turnFactor = 1;

    if (boid.x < margin) {
      boid.dx += turnFactor;
    }
    if (boid.x > screenDimensions.width - margin) {
      boid.dx -= turnFactor
    }
    if (boid.y < margin) {
      boid.dy += turnFactor;
    }
    if (boid.y > screenDimensions.height - margin) {
      boid.dy -= turnFactor;
    }
  }

  // 
  function flyTowardsCenter(boid: boid) {

    let centerX = 0;
    let centerY = 0;
    let numNeighbors = 0;

    for (let otherBoid of boids) {
      if (distance(boid, otherBoid) < visualRange) {
        centerX += otherBoid.x;
        centerY += otherBoid.y;
        numNeighbors += 1;
      }
    }

    if (numNeighbors) {
      centerX = centerX / numNeighbors;
      centerY = centerY / numNeighbors;

      boid.dx += (centerX - boid.x) * centeringFactor;
      boid.dy += (centerY - boid.y) * centeringFactor;
    }
  }

  // Move away from other boids that are too close to avoid colliding
  function avoidOthers(boid: boid) {
  
    let moveX = 0;
    let moveY = 0;

    // Loop through boids other than the current boid
    boids.forEach((otherBoid) => {
      if (otherBoid !== boid) {
        
        // If the boids are closer then the seperation distance move them apart
        if (distance(boid, otherBoid) < seperationDistance) {
          moveX += boid.x - otherBoid.x;
          moveY += boid.y - otherBoid.y;
        }

      }
    })

    boid.dx += moveX * seperationFactor;
    boid.dy += moveY * seperationFactor;
  }

  // Find the average velocity of the other boids nearby and adjust velocity slightly
  function matchVelocity(boid: boid) {

    // Setup counters
    let avgDX = 0;
    let avgDY = 0;
    let numNeighbors = 0;

    // Loop through boids
    boids.forEach((otherBoid) => {

      // If boid is within the visual range
      if (distance(boid, otherBoid) < visualRange) {

        // Incriment counters
        avgDX += otherBoid.dx;
        avgDY += otherBoid.dy;
        numNeighbors += 1;
      }

    })

    // If numNeighbours is not 0
    if (numNeighbors) {

      // Calculate average velocity of neighbours
      avgDX = avgDX / numNeighbors;
      avgDY = avgDY / numNeighbors;

      // Update boids velocity
      boid.dx += (avgDX - boid.dx) * matchingFactor;
      boid.dy += (avgDY - boid.dy) * matchingFactor;
    }
  }

  // Speed limiting function to ensure nothing crazy happens
  function limitSpeed(boid: boid) {

    // Calculate speed
    const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);

    // If the speed is above limit then reduce velocity to the limit
    if (speed > speedLimit) {
      boid.dx = (boid.dx / speed) * speedLimit;
      boid.dy = (boid.dy / speed) * speedLimit;
    }

  }

  function drawBoid(ctx: any, boid: boid) {

    // Draw Boid onto canvas
    if (arrowVisible){
      const angle = Math.atan2(boid.dy, boid.dx);
      ctx.translate(boid.x, boid.y);
      ctx.rotate(angle);
      ctx.translate(-boid.x, -boid.y);
      ctx.fillStyle = "#558cf4";
      ctx.beginPath();
      ctx.moveTo(boid.x, boid.y);
      ctx.lineTo(boid.x - 15, boid.y + 5);
      ctx.lineTo(boid.x - 15, boid.y - 5);
      ctx.lineTo(boid.x, boid.y);
      ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // If tail is active render previous points
    if (tail) {
      ctx.strokeStyle = "#558cf466";
      ctx.beginPath();
      ctx.moveTo(boid.history[0].x, boid.history[0].y);
      for (const point of boid.history) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }

  // Main animation loop
  function animationLoop() {

    // Update each boid
    boids.forEach((boid) => {

      // Update the velocities according to each rule
      if (towardsCenter){flyTowardsCenter(boid)}
      if (avoidOtherBoids){avoidOthers(boid)}
      matchVelocity(boid);
      limitSpeed(boid);
      keepWithinBounds(boid);

      // Update the position of boid based on the current velocity
      boid.x += boid.dx;
      boid.y += boid.dy;
      boid.history.push({x : boid.x, y: boid.y})
      boid.history = boid.history.slice(-50);

    }) 
      
    // Clear the canvas and redraw all the boids in their current positions
    const ctx = document.getElementById('boids').getContext("2d");
    // Clear the canvas
    ctx.clearRect(0, 0,screenDimensions.width, screenDimensions.height);
    // Redraw boids
    boids.forEach(boid => drawBoid(ctx, boid))
 
    // Schedule the next frame
    window.requestAnimationFrame(animationLoop);
  }

  // Initiates canvas + updates on change of any options
  useEffect(() => {

    // Set canvas dimensions
    canvas.current.width = screenDimensions.width;
    canvas.current.height = screenDimensions.height; 

    // Randomly distribute the boids to start
    initBoids();

    // Schedule the main animation loop
    window.requestAnimationFrame(animationLoop);
 
  }, [screenDimensions, arrowVisible, numBoids, speedLimit, visualRange, centeringFactor, matchingFactor, seperationDistance, seperationFactor, tail, towardsCenter, avoidOtherBoids]);

  // Set Screen Dimensions On First Load
  useEffect(() => {
    setScreenDimensions({width: screen.current.offsetWidth, height: screen.current.offsetHeight})
  }, [])

  return (
    <>
    <div className='page'>
      <div className='options'>
        <button data-active = {arrowVisible} onClick={() => setArrowVisible(!arrowVisible)} className="title">Show Arrow {arrowVisible ? <FaCheck className='icon'/> : null }</button>
        <button data-active = {tail} onClick={() => setTail(!tail)} className="title">Show Tail {tail ? <FaCheck className='icon'/> : null }</button>
        <button data-active = {towardsCenter} onClick={() => setTowardsCenter(!towardsCenter)}>Move Towards Center {towardsCenter ? <FaCheck className='icon'/> : null }</button>
        <button data-active = {avoidOtherBoids} onClick={() => setAvoidOthersBoids(!avoidOtherBoids)}>Avoid Other Boids {avoidOtherBoids ? <FaCheck className='icon'/> : null }</button>

      </div>
      <div id = 'screen' className="canvasContainer" ref = {screen}>
        <canvas ref = {canvas} id="boids" width="150" height="150"></canvas>
        <div className="sliders" data-show = {menuActive}>
          <div className="slider">
            <input value = {numBoids} className = 'slider' onChange = {(e) => {setNumBoids(parseInt(e.target.value))}} type = 'range' name = "totalBoids" min = "1" max = "500"></input>
            <label className = 'sliderLabel' htmlFor="totalBoids">Total Boids <div className="number">{numBoids}</div></label>
          </div>

          <div className="slider">
            <input value = {speedLimit} className = 'slider' onChange = {(e) => {setSpeedLimit(parseInt(e.target.value))}} type = 'range' name = "totalBoids" min = "1" max = "100"></input>
            <label className = 'sliderLabel' htmlFor="totalBoids">Speed Limit <div className="number">{speedLimit}</div></label>
          </div>

          <div className="slider">
            <input value = {visualRange} className = 'slider' onChange = {(e) => {setVisualRange(parseInt(e.target.value))}} type = 'range' name = "totalBoids" min = "10" max = "1000"></input>
            <label className = 'sliderLabel' htmlFor="totalBoids">Visual Range <div className="number">{visualRange}</div></label>
          </div>

          <div className="slider">
            <input value = {centeringFactor * 1000} className = 'slider' onChange = {(e) => {setCenteringFactor(parseInt(e.target.value)/1000)}} type = 'range' name = "totalBoids" min = "1" max = "10"></input>
            <label className = 'sliderLabel' htmlFor="totalBoids">Centering Factor <div className="number">{centeringFactor * 1000}</div></label>
          </div>

          <div className="slider">
            <input value = {matchingFactor * 100} className = 'slider' onChange = {(e) => {setMatchingFactor(parseInt(e.target.value)/100)}} type = 'range' name = "totalBoids" min = "1" max = "10"></input>
            <label className = 'sliderLabel' htmlFor="totalBoids">Matching Factor <div className="number">{matchingFactor * 100}</div></label>
          </div>
          <div></div>
        </div>

      </div>
      <div className="menuIcon" onClick={() => {setMenuActive(!menuActive)}}><FaBars></FaBars></div>

    </div>
    </>
  )

}

export default App

// Distance between 2 points formula 
function distance(boid1: boid, boid2: boid) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}
