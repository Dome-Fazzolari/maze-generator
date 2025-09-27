import { Graphics, type StrokeInput } from "pixi.js";
import { Node } from "./node";

export type tags = "start"|"end"|null;

export class SquareNode{

    

    node: Node;
    square: Graphics;
    square_size: number;
    coords: {x: number, y: number};
    tag: tags;

    constructor(node: Node, square_size: number, coords: {x: number, y: number}, tag: tags){
        this.node = node;
        this.square_size = square_size;
        this.coords = coords;
        this.tag = tag;
        this.square = new Graphics();
    }
    
    public render_node():Graphics{

        const squareColor = this.getSquareColor(this.tag);
        const strokeInfo: StrokeInput = {
            color: 0x000000,
            width: 2,
            pixelLine: true
        };
        
        
        this.square.clear();
        this.square.rect(this.coords.x, this.coords.y, this.square_size, this.square_size)
            .fill({color:squareColor});

        
        // Top
        if(this.node.top_node == null){
            this.square
            .moveTo(this.coords.x, this.coords.y)
            .lineTo(this.coords.x+this.square_size, this.coords.y)
            .stroke(strokeInfo);
        }

        // Right
        if(this.node.right_node == null){
            this.square
            .moveTo(this.coords.x+this.square_size, this.coords.y)
            .lineTo(this.coords.x+this.square_size, this.coords.y+this.square_size)
            .stroke(strokeInfo)
        }

        // bottom
        if(this.node.bottom_node == null){
            this.square
            .moveTo(this.coords.x, this.coords.y+this.square_size)
            .lineTo(this.coords.x+this.square_size, this.coords.y+this.square_size)
            .stroke(strokeInfo)
        }

        if(this.node.left_node == null){
            this.square

            .moveTo(this.coords.x, this.coords.y+this.square_size)
            .lineTo(this.coords.x, this.coords.y)
            .stroke(strokeInfo)
        }

        return this.square;
    }

    private getSquareColor(tag: tags){
        switch(tag){
            case "start":
                return "green";
            case "end":
                return "blue";
            default:
                return "white";
        }
    }
    

}