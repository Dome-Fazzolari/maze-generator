import './style.css'
import { Application, Container, Graphics } from 'pixi.js'
import { Node } from './node';
import { SquareNode, type tags } from './square_node';

type coords = {
  x: number,
  y: number
};

(async()=>{
  const app = new Application();

  await app.init({background:'#1099bb', resizeTo: window});

  document.getElementById("pixiCanvas")!.appendChild(app.canvas);


  const container = new Container({
    isRenderGroup: true
  });

  const squareSize = 40;
  const mosaicWidth = 20;
  const mosaicHeight = 20;

  const start: coords = {
    x: 0,
    y: 0
  };

  const goal: coords = {
    x: mosaicWidth-1,
    y: mosaicHeight-1
  }

  let nodeList: Node[][] = [];
  let destinationNode: Node|null;
  let startNode: Node|null;

  for(let i =0; i < mosaicWidth; i++){
    let row: Node[] = [];
    nodeList.push(row);
    for(let j = 0; j< mosaicHeight; j++){
      let node: Node = new Node(i, j);
      row.push(node);
    }
  }

  buildMaze(nodeList, 0, 0, []);


  for(let i =0; i < mosaicWidth; i++){
    for(let j = 0; j< mosaicHeight; j++){
      let node = nodeList[i][j];

      const isGoal = goal.x == i && goal.y == j;
      const isStart = start.x == i && start.y == j;
      let tag: tags = null;

      
      if(isGoal){
        tag = "end";
        destinationNode = node;
      }
      if(isStart){
        startNode = node;
        tag = "start";
      }
      
      
      let square: SquareNode = new SquareNode(
          node,
          squareSize,
          {
            x: i*squareSize + window.screen.width * 0.25,
            y: j*squareSize + window.screen.height * 0.05
          },
          tag
      );


      const obj = square.render_node();

      container.addChild(obj); 
    }
  }

  let held = false;
  let x: number | null = null;
  let y: number | null = null;

  let heldX: number | null = null; 
  let heldY: number | null = null;

  
  app.canvas.addEventListener("mousemove", (event)=>{

    if(!held){
      return;
    }

    heldX = event.clientX;
    heldY = event.clientY;

  });

  app.canvas.addEventListener("mousedown", (event)=>{
    x = Number(event.clientX);
    y = Number(event.clientY);
    heldX = event.clientX;
    heldY = event.clientY;
    held = true;
  });

  app.canvas.addEventListener("mouseup", (_)=>{
    x = null;
    y = null;

    heldX = null; 
    heldY = null;

    held = false;
  });

  document.getElementById("zoom-in-btn")?.addEventListener("click", (_)=>{
      zoomIn(container);
  });
  document.getElementById("zoom-out-btn")?.addEventListener("click", (_)=>{
      zoomOut(container);
  });

  let newLine = new Graphics();
  document.getElementById("start-a-star")?.addEventListener("click", (_)=>{

      const aStarPath: coords[]|null = aStar(destinationNode!, startNode!);
      if(aStarPath == null){
        alert("Percorso non trovato");
        return;
      }

      newLine.clear();

      aStarPath.forEach((element, index) => {
        if(index != 0){
          //newLine.circle(element.x*squareSize+(squareSize/2), element.y*squareSize+(squareSize/2), 5).fill({color: 0x000000})
          newLine.lineTo(element.x*squareSize+(squareSize/2), element.y*squareSize+(squareSize/2))
          .stroke({
            width: 2,
            color: "red",
            pixelLine: true
          });
        }else{
          newLine.moveTo(startNode!.x*squareSize+(squareSize/2), startNode!.y*squareSize+(squareSize/2));
        }
      });

      newLine = newLine.stroke({
            width:7,
            color: 0x000000,
            pixelLine: false
          });
      container.addChild(newLine);
  });

  app.ticker.add((t)=>{

    // Gestione per muovere un container con un effetto drag
    if(!held){
      return;
    }

    const sensitivityInput :HTMLInputElement = document.getElementById("sensitivity") as HTMLInputElement;
    const sensitivity: number = parseInt(sensitivityInput.value);

    const xSpeed = (heldX!-x!);
    const ySpeed = (heldY!-y!);
    const delta = t.deltaTime / t.FPS;

    
    container.x += xSpeed*sensitivity*delta;
    container.y += ySpeed*sensitivity*delta;

    x = heldX;
    y = heldY;
    
  });

  app.stage.addChild(container); 
})();


function zoomIn(container: Container){
  container.scale.x *= 1.1;
  container.scale.y *= 1.1;
}

function zoomOut(container: Container){
  container.scale.x *= 0.9;
  container.scale.y *= 0.9;
}


function aStar(destinationNode: Node, startNode: Node): coords[]|null{
  let openList: Node[] = [startNode];
  let closedList: Node[] = [];
  let current: Node;
  

  function addToOpen(node: Node){
      if(node.is_blocked){
        return;
      }
      if(openList.indexOf(node) != -1){
        return;
      }
      openList.push(node);
  }

  function reverseTraverse(node: Node){
    let coordList: coords[] = [];
    while(node.parent != null){
      coordList.push({
        x: node.x,
        y: node.y
      });
      node = node.parent;
    }

    coordList.push(node);
    
    return coordList.reverse();
  }
  
  while(openList.length > 0){
  
    current = openList.sort((a, b)=>(a.f_cost ?? 9999999999) > (b.f_cost ?? 9999999999)? 1: 0)[0];

    openList.splice(openList.indexOf(current), 1);
    closedList.push(current);

    if(current == destinationNode){
      return reverseTraverse(current);
    }

    current.neighbours?.forEach((node)=>{

      if(node.is_blocked || closedList.indexOf(node) != -1){
        return;
      }

      const new_f_cost = node.getCost(current, destinationNode);
      if((node.f_cost ?? 9999999999) > new_f_cost || openList.indexOf(node) == -1){
        node.f_cost = new_f_cost;
        node.parent = current;
        addToOpen(node);
        return;
      }
    });
  }

  return null;
}

type direction = "top"|"bottom"|"left"|"right";

function buildMaze(nodeList: Node[][], i:number, j: number, usedNodes: Node[]):void{

  let node: Node = nodeList[i][j];  
  
  usedNodes.push(node);

  const above = j > 0;
  const left = i > 0;
  const right = i < nodeList.length-1;
  const below = j < nodeList[0].length-1;

  let above_node: Node|null = above ? nodeList[i][j-1] : null;
  let right_node: Node|null = right ? nodeList[i+1][j]: null;
  let below_node: Node|null = below ? nodeList[i][j+1]: null;
  let left_node: Node|null = left ? nodeList[i-1][j]: null;
  

  let avail_nodes:direction[]  = [];

  do{
    avail_nodes = [];


    if(above_node != null && usedNodes.indexOf(above_node) == -1){
      avail_nodes.push("top");
    }
    if(right_node != null && usedNodes.indexOf(right_node) == -1){
      avail_nodes.push("right");
    }
    if(below_node != null && usedNodes.indexOf(below_node)  == -1){
      avail_nodes.push("bottom");
    }
    if(left_node != null && usedNodes.indexOf(left_node) == -1){
      avail_nodes.push("left");  
    }

    if(avail_nodes.length == 0){
      return;
    }

    const selected_node = avail_nodes[Math.floor(Math.random()*avail_nodes.length)];

    let indexes: {
      i: number,
      j: number
    };
    switch(selected_node){
      case "bottom":
        node.bottom_node = below_node;
        below_node!.top_node = node;
        node.addNeighbour(below_node!);
        indexes = {
          i: i,
          j: j+1
        }
        break;
      case "left":
        node.left_node = left_node;
        left_node!.right_node = node;
        node.addNeighbour(left_node!);
        indexes = {
          i: i-1,
          j: j
        }
        break;
      case "right":
        node.right_node = right_node;
        right_node!.left_node = node;
        node.addNeighbour(right_node!);
        indexes = {
          i: i+1,
          j: j
        }
        break;
      case "top":
        node.top_node = above_node;
        above_node!.bottom_node = node;
        node.addNeighbour(above_node!);
        indexes = {
          i: i,
          j: j-1
        }
        break
    }

    buildMaze(nodeList, indexes.i, indexes.j, usedNodes);
    
  }while(avail_nodes.length > 0);
}