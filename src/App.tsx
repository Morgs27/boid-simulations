import { useEffect, useRef, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'
import './App.css'
import { FaAngleLeft , FaAngleRight} from 'react-icons/fa'
import { Slider } from './Slider'

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
  color: string
}

function App() {

  var boids: Array<boid>  

  const [numBoids, setNumBoids] = useState(150) // Total Number of boids
  const [speedLimit, setSpeedLimit] = useState(15) // Max Speed of boid
  const [visualRange, setVisualRange] = useState(75) // Visual range of boid

  const [centeringFactor, setCenteringFactor] = useState(0.005) // Rate at which velocity is changed to center boid
  const [matchingFactor, setMatchingFactor] = useState(0.05) // Rate at which velocity is changed to match the velocity of surounding biods

  const [seperationDistance, setSeperationDistance] = useState(20) // The distance to stay away from other boids
  const [seperationFactor, setSeperationFactor] = useState(0.05) // Rate at which velocity is changed to keep boids apart

  const screen = useRef<HTMLDivElement>(null) // Reference to canvas container
  const canvas = useRef<HTMLCanvasElement>(null) // Refrence to canvas
  const [screenDimensions, setScreenDimensions] = useState({width: 150, height: 150}) // Screen dimensions

  // Visible Options
  const [tail, setTail] = useState(false)
  const [arrowVisible, setArrowVisible] = useState(true)
  const [tailWidth, setTailWidth] = useState(0)
  const [headSize, setHeadSize] = useState(1)
  const [tailLifetime, setTailLifetime] = useState(50)

  // Colour Options + Themes
  const defaultTheme = ['#558cf4']
  const purple = ['#440099','#ffffff','#ece6f5','#c7b3e0','	#8f66c2']
  const christmas =['#d4af37', '#aaa9ad', '#f3f6f4', '#cc0000', '	#274e13']
  const fire = ['#ffff00','	#ffcc00', '#ff9900', '#ff6600', '#ff3300']
  const bright = ['#8582f2', '#eff282', '#f282d9','#acf282','#f2b182']
  const neon = ['#ff1e76','	#4280ff','#31dab7','#0af9fe','#3202c5']
  const themes = [defaultTheme,neon, purple, fire, bright,christmas]

  const [colorScheme, setColorTheme] = useState(0)

  // Menu Active toggle for mobile devices
  const [menuActive, setMenuActive] = useState(false)

  // Mouse Interaction effect toggle
  const [mouseEffect, setMouseEffect] = useState(true)

  // Rules Options
  const [towardsCenter, setTowardsCenter] = useState(true)
  const [avoidOtherBoids, setAvoidOthersBoids] = useState(true)

  // Create array of boid type with unique Id and random-ish position + velocity
  function initBoids() { 

    boids = Array(numBoids).fill('').map(() => {
      return {
        id: uuidV4(),
        x: Math.random() * screenDimensions.width,
        y: Math.random() * screenDimensions.height,
        dx: Math.random() * 10 - 5,
        dy: Math.random() * 10 - 5,
        history: [],
        color: themes[colorScheme][Math.floor(Math.random()*themes[colorScheme].length)]
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

  // Fly boids towards center of nearby boids
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

  function avoidMouseFollow(boid: boid){
    var mouseSeperationDistance = 200;

    var mouseFollow = document.querySelector('.mouseFollow');

    let circleX = parseInt(mouseFollow.style.left.replace("px",""))
    let circleY = parseInt(mouseFollow.style.top.replace("px",""))

    let moveX = 0;
    let moveY = 0;
    
    if (distance(boid,{x: circleX, y:circleY}) < mouseSeperationDistance){
        moveX += boid.x - circleX;
        moveY += boid.y - circleY;
    }

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
      ctx.fillStyle = boid.color;
      ctx.beginPath();
      ctx.moveTo(boid.x, boid.y);
      let scaledX = headSize * 15
      let scaledY = headSize * 5
      ctx.lineTo(boid.x - scaledX, boid.y + scaledY);
      ctx.lineTo(boid.x - scaledX, boid.y - scaledY);
      ctx.lineTo(boid.x, boid.y);
      ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // If tail is active render previous points
    if (tail) {
      ctx.lineWidth = tailWidth;
      ctx.strokeStyle = boid.color + '66';
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
      if (mouseEffect){avoidMouseFollow(boid)}
      matchVelocity(boid);
      limitSpeed(boid);
      keepWithinBounds(boid);

      // Update the position of boid based on the current velocity
      boid.x += boid.dx;
      boid.y += boid.dy;
      boid.history.push({x : boid.x, y: boid.y})
      boid.history = boid.history.slice(-1 * tailLifetime);

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
 
  }, [screenDimensions, tailLifetime, colorScheme, mouseEffect, tailWidth, headSize, arrowVisible, numBoids, speedLimit, visualRange, centeringFactor, matchingFactor, seperationDistance, seperationFactor, tail, towardsCenter, avoidOtherBoids]);

  // Set Screen Dimensions On First Load
  useEffect(() => {
    setScreenDimensions({width: screen.current.offsetWidth, height: screen.current.offsetHeight})
  }, [])

  // Setup up mouse follow circle
  document.addEventListener('mousemove', (e) => {
      let mouseFollow = document.querySelector('.mouseFollow');
      mouseFollow.style.top = (e.clientY - 85)+ 'px';
      mouseFollow.style.left = e.clientX + 'px';

  })

  function genterateLinearGradient(){
    return '#558cf4'
    let gradient = 'linear-gradient('
    themes[colorScheme].forEach((colour,index) => {
      if (index != 0){
        gradient += ','
      }
      gradient += ( colour + '90')
    })
    return gradient + ')'
  }


  return (
    <>
    <div className='page' style = {{background: genterateLinearGradient()}}>

      <div id = 'screen' className="canvasContainer" ref = {screen}>

        <div className="mouseFollow"></div>

        <div className='options'>

          <button onClick={() => setArrowVisible(!arrowVisible)} className="title">{arrowVisible ? 'Hide Arrows'  : 'Show Arrows' }</button>

          <button onClick={() => setTail(!tail)} className="title">{tail ?  "Hide Tails" : 'Show Tails' }</button>

          <button onClick={() => setMouseEffect(!mouseEffect)}>{mouseEffect ?  'Disable Mouse Interaction': 'Enable Mouse Interaction' }</button>

        </div>

        <canvas ref = {canvas} id="boids" width="150" height="150"></canvas>

        <div className="sliders" data-show = {menuActive}>

          <Slider  value={numBoids} min={1} max={500} setState={setNumBoids} title={'Number of Boids'}></Slider>

          <Slider  value={seperationDistance} min={1} max={100} setState={setSeperationDistance} title={'Seperation Distance'}></Slider>

          {/* Colour Selector */}
          <div className="colourTheme">
            <div className="title">Colour Theme</div>
            
            <div className="colours">
              {colorScheme > 0 ? 
                <div className="arrow" onClick = {() => {
                  setColorTheme(colorScheme - 1)
                }}><FaAngleLeft/></div>
                : 
                <div className="arrow" style = {{opacity: 0.3}}><FaAngleLeft/></div>
                }
              {
                themes[colorScheme].map((theme) => {
                  return(
                    <div className='colour' style = {{backgroundColor: theme}}></div>
                  )
                })
              }
              {colorScheme < (themes.length - 1) ? 
              <div className="arrow" onClick = {() => {
                setColorTheme(colorScheme + 1)
              }}><FaAngleRight/></div>
              : 
              <div className="arrow" style = {{opacity: 0.3}}><FaAngleRight/></div>
              }
            </div>

          </div>
          <Slider  value={visualRange} min={10} max={300} setState={setVisualRange} title={'Group Bais'}></Slider>

          <Slider  value={tailLifetime} min={2} max={800} setState={setTailLifetime} title={'Tail Lifetime'}></Slider>

        </div>

      </div>

      {/* Menu Icon For Mobile Support */}
      <div className="menuIcon" onClick={() => {setMenuActive(!menuActive)}}>
        <div className="hamburger" data-active = {menuActive} id="hamburger-6">
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>
      </div>

    </div>
    </>
  )

}

export default App

// Distance between 2 points formula 
function distance(boid1: boid, boid2: boid | any) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}
