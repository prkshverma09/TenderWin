import { Server } from '@modelcontextprotocol/sdk/server/index.js';
export declare function getMockProposals(): {
    id: string;
    title: string;
    client: string;
    date: string;
    content: string;
}[];
export declare const handleCallTool: (request: any) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;
export declare const handleListResources: () => Promise<{
    resources: {
        uri: string;
        name: string;
        description: string;
        mimeType: string;
    }[];
}>;
export declare const handleReadResource: (request: any) => Promise<{
    contents: {
        uri: any;
        mimeType: string;
        text: string;
    }[];
}>;
export declare class SharePointServer {
    server: Server;
    constructor();
    private setupHandlers;
    run(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map