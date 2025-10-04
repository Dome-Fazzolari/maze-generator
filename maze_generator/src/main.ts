import './style.css'
import { Assets, Application, Container, Point } from 'pixi.js'
import { Node } from './node';
import { SquareNode, type tags } from './square_node';
import { PathTrail } from './path_trail';

export type coords = {
  x: number,
  y: number
};

const mainContainerPadding: {left: number, top:number} = {
  left: Math.ceil(window.screen.width * 0.25),
  top: Math.ceil(window.screen.height * 0.05)
};

(async()=>{
  const app = new Application();

  await app.init({background:'#1099bb', resizeTo: window});

  document.getElementById("pixiCanvas")!.appendChild(app.canvas);

  // Trail texture retrieve
  const trailTexture = await Assets.load('https://pixijs.com/assets/trail.png');

  const container = new Container({
    isRenderGroup: true
  });

  const squareSize = 40;
  const mosaicWidth = 40;
  const mosaicHeight = 40;
  let startSelectionInProgress = false;
  let endSelectionInProgress = false;
  const selectEndButton = document.getElementById("select-end") as HTMLButtonElement;
  const selectStartButton = document.getElementById("select-start") as HTMLButtonElement;

  let lastTemporarySelected: SquareNode | null = null;

  const start: coords = {
    x: 0,
    y: 0
  };

  const goal: coords = {
    x: mosaicWidth-1,
    y: mosaicHeight-1
  }

  let nodeList: Node[][] = [];
  let destinationNode: SquareNode|null;
  let startNode: SquareNode|null;

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
      }
      if(isStart){
        tag = "start";
      }
      
      
      let square: SquareNode = new SquareNode(
          node,
          squareSize,
          {
            x: i*squareSize + mainContainerPadding.left,
            y: j*squareSize + mainContainerPadding.top
          },
          tag
      );


      if(isGoal){
        destinationNode = square;
      }
      if(isStart){
        startNode = square;
      }

      const obj = square.render_node();
      obj.eventMode = "static";

      obj.addEventListener("mouseover", ()=>{
        if(startSelectionInProgress){
          if(square == startNode) return;
          lastTemporarySelected = square;
          if(square.tag == null){
            square.tag = "start";
            square.render_node();
          }
        }else if(endSelectionInProgress){
          if(square == destinationNode) return;
          lastTemporarySelected = square;
          if(square.tag == null){
            square.tag = "end";
            square.render_node();
          }
        }
        
      });

      obj.addEventListener("mousedown", ()=>{
        if(startSelectionInProgress){
          startNode!.tag = null;
          startNode!.render_node();      
          startNode = square;    
          square.tag = "start";
          square.render_node();
          startSelectionInProgress = false;
          lastTemporarySelected = null;
          checkStartSelectButtonStatus();
        }else if(endSelectionInProgress){
          destinationNode!.tag = null;
          destinationNode!.render_node();
          destinationNode = square;
          square.tag = "end";
          square.render_node();
          endSelectionInProgress = false;
          lastTemporarySelected = null;
          checkEndSelectButtonStatus();
        }
      })

      obj.on("mouseleave", ()=>{
        if(startSelectionInProgress){
          if(square.node == startNode!.node) return;

          if(square.tag == "start"){
            square.tag = null;
            square.render_node();
          }
        }else if(endSelectionInProgress){
          if(square.node == destinationNode!.node) return;

          if(square.tag == "end"){
            square.tag = null;
            square.render_node();
          }
        }
      })

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


  selectStartButton.addEventListener("click", (_)=>{
    startSelectionInProgress = !startSelectionInProgress;
    checkStartSelectButtonStatus();
  });

  function checkStartSelectButtonStatus(){
    if(startSelectionInProgress){
      selectStartButton.innerHTML = "Cancella selezione";
    }else{
      if (lastTemporarySelected != null){
        lastTemporarySelected.tag = null;
        lastTemporarySelected.render_node();
        lastTemporarySelected = null;
      }
      selectStartButton.innerHTML = "Seleziona inizio";
    }
  }


  selectEndButton.addEventListener("click", (_)=>{
    endSelectionInProgress = !endSelectionInProgress;
    checkEndSelectButtonStatus();
  });

  function checkEndSelectButtonStatus(){
    if(endSelectionInProgress){
      selectEndButton.innerHTML = "Cancella selezione";
    }else{
      if (lastTemporarySelected != null){
        lastTemporarySelected.tag = null;
        lastTemporarySelected.render_node();
        lastTemporarySelected = null;
      }
      selectEndButton.innerHTML = "Seleziona fine";
    }
  }

  document.getElementById("zoom-in-btn")?.addEventListener("click", (_)=>{
      zoomIn(container);
  });
  document.getElementById("zoom-out-btn")?.addEventListener("click", (_)=>{
      zoomOut(container);
  });


  document.getElementById("start-a-star")?.addEventListener("click", (_)=>{

      console.log(nodeList);
        
      const aStarPath: coords[]|null = aStar(destinationNode!.node, startNode!.node);
      if(aStarPath == null){
        alert("Percorso non trovato");
        return;
      }

      let trail:coords[] = [];
      aStarPath.forEach((element)=>{
        trail.push(
          {x:element.x*squareSize+(squareSize/2)+mainContainerPadding.left, y:element.y*squareSize+(squareSize/2)+mainContainerPadding.top}
        )
      })

      const testTrail = new PathTrail(
        container,
        50,
        trailTexture
      );

      testTrail.beginAnimation(trail);
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

  function reverseTraverse(node: Node, startLocation:Node){
    let coordList: coords[] = [];
    while(node != startLocation){
      coordList.push({
        x: node.x,
        y: node.y
      });
      if(node == null) break;
        node = node.parent!;
    }

    coordList.push(node);
    
    return coordList.reverse();
  }
  
  
  while(openList.length > 0){
    current = openList.sort((a, b)=>(a.f_cost ?? 9999999999) > (b.f_cost ?? 9999999999)? 1: 0)[0];

    openList.splice(openList.indexOf(current), 1);
    closedList.push(current);

    if(current == destinationNode){
      return reverseTraverse(current, startNode);
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
        below_node?.addNeighbour(node);
        indexes = {
          i: i,
          j: j+1
        }
        break;
      case "left":
        node.left_node = left_node;
        left_node!.right_node = node;
        node.addNeighbour(left_node!);
        left_node?.addNeighbour(node);
        indexes = {
          i: i-1,
          j: j
        }
        break;
      case "right":
        node.right_node = right_node;
        right_node!.left_node = node;
        node.addNeighbour(right_node!);
        right_node?.addNeighbour(node);
        indexes = {
          i: i+1,
          j: j
        }
        break;
      case "top":
        node.top_node = above_node;
        above_node!.bottom_node = node;
        node.addNeighbour(above_node!);
        above_node?.addNeighbour(node);
        indexes = {
          i: i,
          j: j-1
        }
        break
    }

    buildMaze(nodeList, indexes.i, indexes.j, usedNodes);
    
  }while(avail_nodes.length > 0);
}