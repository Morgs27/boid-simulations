import { useEffect, useMemo, useRef, useState } from 'react'
import './BiodsScreen.css'
import { motion } from "framer-motion"
import { v4 as uuidV4 } from 'uuid'

type boid = {
  id: string
  posX: number
  posY: number
  display: boolean
  rotation: number
  color: string
}

type screenDimensions = {
  height: number
  width: number 
}

export function BiodsScreen<T extends HTMLElement = HTMLDivElement>(){

  // Array of all biods
  const [boids, setBoids] = useState<boid[]>([])

  // Options
  const [speed, setSpeed] = useState(15)
  const [boidTotal, setBoidTotal] = useState(0)
  const [steerAway, setSteerAway] = useState(false)
  const [steerRandom, setSteerRandom] = useState(false)
  const [steerTogether, setSteerTogether] = useState(false)

  // Screen ref + dimensions
  const screen = useRef(null)
  const [screenDimensions, setScreenDimensions] = useState<screenDimensions>({width: 0, height: 0})

  // Set Screen Dimensions On Browser Resize
  window.addEventListener('resize',() => {
    setScreenDimensions({ width: screen?.current?.offsetWidth , height:  screen?.current?.offsetHeight})
  })

  // Set Browser Dimensions Initially 
  useEffect(() => {
    setScreenDimensions({ width: screen.current.offsetWidth , height:  screen.current.offsetHeight})
  }, [])


  function lotsofBoids(){
    Array(10).fill("").forEach((e) => increaseBoids())
  }

  // Function to add new boid at random position with random rotation
  function increaseBoids(){
    setBoidTotal((total) => total + 1)
    setBoids((boids) => [...boids, 
    {
      id: uuidV4(),
      posX: Math.floor(Math.random() * screenDimensions.width ) , 
      posY: Math.floor(Math.random() * screenDimensions.height), 
      display: false,
      rotation: Math.floor(Math.random() * 360),
      color: 'red'
    }])
  }

  // Function to remove boid
  function decreaseBoids(){
    setBoidTotal((total) => total - 1)
    setBoids(boids.slice(0,-1))
  }
  
  useEffect(() => {

    // Function that runs ever 300ms to update position of biods
    const interval = setInterval(() => {

      // Map new boids with updated positions
      const newBoids = boids.map((boid,index) => {

        let display = true

        // If steer is toggled on
        if (steerAway){
          steerBoidsAway({boids,boid,index})
        }

        if (steerRandom){

          steerBoidsRandom({boids,boid,index})

        }

        if (steerTogether){
          steerBoidsTogether({boids,boid,index})
        }

        // Convert rotation angle to radians for sin and cos functions
        let radians = boid.rotation * (Math.PI / 180)

        // Calculate new X and Y positions based of off rotation angle
        let newX = boid.posX + ( speed * Math.sin(radians))
        let newY = boid.posY + ( speed * Math.cos(radians)) * -1

        // If out of screen display should be false
        if (newX > screenDimensions.width + 20 || newX < -20 || newY > screenDimensions.height + 20 || newY < - 20){
          display = false
        }
        else {
          display = true
        }

        // If out right of screen reset
        if (newX > screenDimensions.width + 100 && boid.rotation < 180){
          newX = -100
        }
        // If out left of screen reset
        if (newX < -100 && boid.rotation > 180){
          newX = screenDimensions.width + 100
        }

        // If out bottom of screen reset
        if (newY > screenDimensions.height + 100 && (boid.rotation < 90 || boid.rotation < 270)){
          newY = -100
        }
        // If out top of screen reset
        if (newY < -100 && (boid.rotation > 270 || boid.rotation < 90)){
          newY = screenDimensions.height + 100
        }

        return { ...boid, posY: newY, posX: newX,  display: display }
      })

      setBoids(newBoids)

    }, 100);

    return () => clearInterval(interval);

  }, [boids]);


  return (
    <div className='container'>
      <div className='options'>

        <button onClick={() => increaseBoids()}>Add</button>
        <button onClick={() => lotsofBoids()}>Add 10</button>
        <button onClick={() => decreaseBoids()}>Delete</button>
        <button onClick={() => setSteerAway(!steerAway)}>Steer Away: {steerAway ? 'Stop' : 'Start'}</button>
        <button onClick={() => setSteerRandom(!steerRandom)}>Steer Random: {steerRandom ? 'Stop' : 'Start'}</button>
        <button onClick={() => setSteerTogether(!steerTogether)}>Steer Together: {steerTogether ? 'Stop' : 'Start'}</button>
        <h1>{boidTotal}</h1>
      </div>

      <div ref = {screen} className='screen'>

        {/* Render a boid for each boid in biods */}
        {boids.map((boid) => {
          return (
            <motion.div 
              key = {boid.id}
              className = {boid.display ? 'boid' : 'boid hidden'}
              animate = {{ x: boid.posX || 0, y: boid.posY || 0, rotate: boid.rotation}}
              transition = {{ease: 'linear'}}
              style = {{background: boid.color}}
              />
          )
        })}

      </div>

    </div>
  )
}

type boidsFunctionProps = {
  boids: boid[]
  boid: boid
  index: number
}

function steerBoidsAway({boids,boid,index} : boidsFunctionProps){

  // Options
  // Distance other boids have to be to have any effect (px)
  let steerReach = 40
  // Weight of distance in the redirection
  let distanceWeight = 0.2

  // Loop through all boids
  boids.forEach((b) => {

    if (boid.id == b.id){
      return
    }
    // Don't loop for self

    let yDifference = boid.posY - b.posY
    let xDifference = boid.posX - b.posX

    let xDistance = Math.abs(xDifference)
    let yDistance = Math.abs(yDifference)

    // Check wether boid is withing steerReach distance
    if (xDistance < steerReach && yDistance < steerReach){

      // Change rotation based off of distance + angle
      let distance = Math.sqrt((xDistance ^ 2) + (yDistance ^ 2))

      // a | b
      // c | d

      // Calculate angle of line connecting two points relative to current boid
      var boidAngle = 0

      if (xDifference == 0){
        // boidAngle is one of 0 or 180
        if (yDifference > 0){
          boidAngle = 0
        }
        else {
          boidAngle = 180
        }
      }
      
      if (yDifference == 0 ){
        // boidAngle is one of 90 or 270
          if (xDifference > 0){
            boidAngle = 270
          }
          else {
            boidAngle = 90
          }
      }
      
      if (xDifference > 0 && yDifference > 0){
        // Other boid is in quadrant a
        boidAngle = 270 + (Math.atan(yDistance / xDistance) * (180 / Math.PI))
      }
      
      if (xDifference < 0 && yDifference > 0){
        // Other boid is in quadrant b
        boidAngle = 90 - (Math.atan(yDistance / xDistance) * (180 / Math.PI))
      }
      
      if (xDifference > 0 && yDifference < 0){
        // Other boid is in quadrant c
        boidAngle = 270 - (Math.atan(yDistance / xDistance) * (180 / Math.PI))
      }
      
      if (xDifference < 0 && yDifference < 0){
        // Other boid is in quadrant d
        boidAngle = 90 + (Math.atan(yDistance / xDistance) * (180 / Math.PI))
      }

      let oppositeBoidAngle = boidAngle - 180
      let rotationDiff = boid.rotation - oppositeBoidAngle

      // Colision login Initial attempt
      // let newRotation = boid.rotation + distanceWeight * ( ( -1 * rotationDiff ) * ( 1 - (distance / steerReach)))

      // Colision logic with exponential distance multiplier
      let newRotation = boid.rotation +  ( 0.002 * ( -1 * rotationDiff ) * Math.exp( (steerReach - distance) / 10))

      boid.rotation = newRotation
    }

  })
}

function steerBoidsRandom({boids,boid,index}: boidsFunctionProps){
  var chance = 0.1
  var groupSize = 20
  var changeAngle = 30

  if (Math.random() > (1 - chance)){
    // Identify Nearest boid and swerver towards It

    var distances = boids.map((boid_map,indexC) => {

      if (boid.id == boid_map.id){
        return [indexC, 10000]
      }

      let yDifference = boid.posY - boid_map.posY
      let xDifference = boid.posX - boid_map.posX

      let xDistance = Math.abs(xDifference)
      let yDistance = Math.abs(yDifference)

      return [indexC, Math.sqrt((xDistance ^ 2) + (yDistance ^ 2))] 

    })

    var distancesSorted = distances.sort((a,b) => b[1] - a[1])
    var closestGroup = distancesSorted.splice(boids.length - groupSize)

    var randomAngle = Math.floor(Math.random() * (changeAngle * 2)) - changeAngle
    var randomOpacity = Math.random()

    closestGroup.forEach((close_boid) => {
      index = close_boid[0]
      boids[index].rotation += randomAngle;
      // boids[index].color = 'rgba(255,0,0,' + randomOpacity + ')'

    })

  }
}

function steerBoidsTogether({boids,boid,index}: boidsFunctionProps){
  
  // Options
  // Distance other boids have to be to have any effect (px)
  let steerReach = 100

  // Loop through all boids
  boids.forEach((b) => {

    // Don't loop for self
    if (boid.id == b.id){
      return
    }

    let yDifference = boid.posY - b.posY
    let xDifference = boid.posX - b.posX

    let xDistance = Math.abs(xDifference)
    let yDistance = Math.abs(yDifference)

    // Check wether boid is withing steerReach distance
    if (xDistance < steerReach && yDistance < steerReach){

      // Change rotation based off of distance + angle
      let distance = Math.sqrt((xDistance ^ 2) + (yDistance ^ 2))

      // a | b
      // c | d

      // Calculate angle of line connecting two points relative to current boid
      var boidAngle = 0

      if (xDifference == 0){
        // boidAngle is one of 0 or 180
        if (yDifference > 0){
          boidAngle = 0
        }
        else {
          boidAngle = 180
        }
      }
      
      if (yDifference == 0 ){
        // boidAngle is one of 90 or 270
          if (xDifference > 0){
            boidAngle = 270
          }
          else {
            boidAngle = 90
          }
      }
      
      if (xDifference > 0 && yDifference > 0){
        // Other boid is in quadrant a
        boidAngle = 270 + (Math.atan(yDistance / xDistance) * (180 / Math.PI))
      }
      
      if (xDifference < 0 && yDifference > 0){
        // Other boid is in quadrant b
        boidAngle = 90 - (Math.atan(yDistance / xDistance) * (180 / Math.PI))
      }
      
      if (xDifference > 0 && yDifference < 0){
        // Other boid is in quadrant c
        boidAngle = 270 - (Math.atan(yDistance / xDistance) * (180 / Math.PI))
      }
      
      if (xDifference < 0 && yDifference < 0){
        // Other boid is in quadrant d
        boidAngle = 90 + (Math.atan(yDistance / xDistance) * (180 / Math.PI))
      }

      let rotationDiff = boid.rotation - boidAngle

      // Colision login Initial attempt
      // let newRotation = boid.rotation + distanceWeight * ( ( -1 * rotationDiff ) * ( 1 - (distance / steerReach)))

      // Colision logic with exponential distance multiplier
      let newRotation = boid.rotation + (0.01 * rotationDiff)

      boid.rotation = newRotation
    }

  })
}