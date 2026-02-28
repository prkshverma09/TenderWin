import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type Proposal = { id: string; title: string; client: string; date: string; content: string };

const FALLBACK_PROPOSALS: Proposal[] = [
  { id: '1', title: 'Cloud Migration Proposal', client: 'TechCorp', date: '2025-01-15', content: 'Proposal to migrate on-premise infrastructure to AWS cloud...' },
  { id: '2', title: 'Data Center Upgrade', client: 'GlobalNet', date: '2024-11-20', content: 'Upgrading primary data center to support 400G networking...' },
];

function loadProposals(): Proposal[] {
  const dataPath = path.join(__dirname, '..', 'data', 'proposals.json');
  if (!existsSync(dataPath)) return FALLBACK_PROPOSALS;
  try {
    const raw = JSON.parse(readFileSync(dataPath, 'utf-8'));
    return Array.isArray(raw) ? raw as Proposal[] : FALLBACK_PROPOSALS;
  } catch {
    return FALLBACK_PROPOSALS;
  }
}

const proposals = loadProposals();

/** Exposed for tests. Returns the proposals currently used by the server (from JSON or fallback). */
export function getMockProposals() {
  return proposals;
}

const searchProposalsSchema = z.object({
  query: z.string().describe('Search term for proposals (title, client, or content)'),
});

export const handleCallTool = async (request: any) => {
  const { name, arguments: args } = request.params;
  
  if (name !== 'search_proposals') {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  const parsed = searchProposalsSchema.safeParse(args);
  if (!parsed.success) {
    throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsed.error.message}`);
  }

  const query = parsed.data.query.toLowerCase();
  const results = proposals.filter(p => 
    p.title.toLowerCase().includes(query) || 
    p.client.toLowerCase().includes(query) || 
    p.content.toLowerCase().includes(query)
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }
    ]
  };
};

export const handleListResources = async () => {
  return {
    resources: proposals.map(p => ({
      uri: `sharepoint://proposals/${p.id}`,
      name: `SharePoint Proposal: ${p.title}`,
      description: `Past proposal for ${p.client} on ${p.date}`,
      mimeType: 'application/json'
    }))
  };
};

export const handleReadResource = async (request: any) => {
  const { uri } = request.params;
  
  const match = uri.match(/^sharepoint:\/\/proposals\/(.+)$/);
  if (!match) {
    throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${uri}`);
  }

  const id = match[1];
  const proposal = proposals.find(p => p.id === id);

  if (!proposal) {
    throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(proposal, null, 2)
      }
    ]
  };
};

export class SharePointServer {
  public server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'sharepoint-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, handleListResources);
    
    this.server.setRequestHandler(ReadResourceRequestSchema, handleReadResource);
    
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_proposals',
            description: 'Search past proposals in SharePoint',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search term for proposals (title, client, or content)'
                }
              },
              required: ['query']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, handleCallTool);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SharePoint MCP server running on stdio');
  }
}
