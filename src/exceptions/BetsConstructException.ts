export class BetsConstructException extends Error {
    constructor(message: string, public readonly code?: number) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
