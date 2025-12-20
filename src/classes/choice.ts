export class Choice<T> {
    tag : string;
	callback : () => T;
    constructor (tag: string, callback: () => T) {
		this.tag = tag;
		this.callback = callback;
	}
}
