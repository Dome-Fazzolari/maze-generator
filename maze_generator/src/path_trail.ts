import { Container, MeshRope, Point, Texture, Ticker } from "pixi.js";
import type { coords } from "./main";

export class PathTrail{
    private mesh: MeshRope;
    private historyX: number[];
    private historyY: number[];
    private points: Point[];
    private parentContainer: Container;

    // Number of points that will be saved
    private trailSize: number;

    private pathCoords: coords[] = [];

    constructor(parent: Container, trailSize:number, trailTexture: Texture){
        this.parentContainer = parent;
        this.trailSize = trailSize;

        this.historyX = [];
        this.historyY = [];
        this.points = [];
        for(let i=0; i < this.trailSize; i++){
            this.points.push(
                new Point(0,0)
            );

            this.historyX.push(0);
            this.historyY.push(0);
        }

        
        this.mesh = new MeshRope({
            texture: trailTexture,
            points: this.points
        });
    }

    beginAnimation(coords: coords[]){
        this.pathCoords = coords;
        if(coords.length < 2){
            throw "coordinates array not long enough";
        }
        let firtCoord = coords.splice(0,1)[0];
        this.resetPointArray(firtCoord);

        this.parentContainer.addChild(this.mesh);

        const ticker = new Ticker();
        ticker.add(this.tickerTrailFunction, {...this, nextCoord: null, lastCoord: firtCoord});
        ticker.start();
    }


    private resetPointArray(basePoint: coords){
        
        this.historyX = [];
        this.historyY = [];
        for(let i=0; i < this.trailSize; i++){
            this.points[i].x = basePoint.x;
            this.points[i].y = basePoint.y;

            this.historyX.push(basePoint.x);
            this.historyY.push(basePoint.y);
        }
    }

    // tutti i riferimenti a this sono fatti dal contesto generato in beginAnimation
    // quindi nextCoord e lastCoord sono parametri esistenti
    private tickerTrailFunction(ticker: Ticker){
        this.historyX.pop();
        this.historyY.pop();

        let new_x = this.historyX[0];
        let new_y = this.historyY[0];

        if(this.nextCoord == null){
            this.nextCoord = this.pathCoords.splice(0, 1)[0];
        }

        if(this.nextCoord == null){
            this.parentContainer.removeChild(this.mesh);
            ticker.stop();
            return;
        }

        // linear interpolation to get the next point
        new_x += PathTrail.snapValue((this.nextCoord.x - this.lastCoord.x) * 1);
        new_y += PathTrail.snapValue((this.nextCoord.y - this.lastCoord.y) * 1);

        if(this.nextCoord.x == new_x && this.nextCoord.y == new_y){
            this.lastCoord = this.nextCoord;
            this.nextCoord = this.pathCoords.splice(0, 1)[0];
        }
        
        this.historyX.unshift(new_x);
        this.historyY.unshift(new_y);

        for (let i = 0; i < this.trailSize; i++) {
            this.points[i].x = this.historyX[i];
            this.points[i].y = this.historyY[i];
        }

        
    }

    public static snapValue(value: number): number{
        const decimalRemain = value %1;
        if(decimalRemain < 0.1){
            return Math.floor(value);
        }else if(decimalRemain > 0.9){
            return Math.ceil(value);
        }

        return value;
    }

}