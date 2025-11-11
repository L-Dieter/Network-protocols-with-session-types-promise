// generates the requestId for the message
export function generateId(pendingRequests: Map<number, (response: string) => void>): number {
    
    let requestId: number = 0;
    
    requestId = Math.floor(Math.random() * 100);
    for (var i=0; i<100; i++) {
        if (pendingRequests.has(requestId)) {
            requestId = Math.floor(Math.random() * 100);
        }
        else {
            break;
        }
    }

    return requestId;
}