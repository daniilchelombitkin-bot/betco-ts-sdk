import { BetsConstructException } from './BetsConstructException';

export class BetsConstructRequestException extends BetsConstructException {
    constructor(
        message: string,
        code: number,
        public readonly body: unknown,
    ) {
        super(message, code);
    }
}
