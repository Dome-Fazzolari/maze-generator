export class Node{

    x: number;
    y: number;
    f_cost: number|null = null;
    parent: Node | null = null;
    is_blocked: boolean|null = null;

    neighbours: Node[] = [];

    top_node: Node | null = null;
    bottom_node: Node | null = null;
    left_node: Node | null = null;
    right_node: Node | null = null;

    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }

    addNeighbour(node: Node): void{
        this.neighbours?.push(node);
    }

    setParent(newParent:Node): void {
        this.parent = newParent;
    }

    calculateHeulistic(destination: Node): number {
        return Math.sqrt(Math.pow(destination.x -this.x, 2) + Math.pow(destination.y-destination.x, 2)) * 10;
    }

    getCost(origin: Node, destination: Node): number {
        let distanceCost: number;

        if(origin.x == this.x || origin.y == this.y){
            distanceCost = 10;
        }
        distanceCost = 14;

        return distanceCost + this.calculateHeulistic(destination);
    }
}