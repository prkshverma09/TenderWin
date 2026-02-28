import { describe, it, expect } from 'vitest';
import { handleCallTool, handleReadResource, handleListResources, getMockProposals } from './index.js';
describe('SharePoint MCP Server', () => {
    describe('Tool Execution: search_proposals', () => {
        it('should return mock responses for past proposals', async () => {
            const result = await handleCallTool({
                params: {
                    name: 'search_proposals',
                    arguments: { query: 'Cloud' }
                }
            });
            expect(result.content.length).toBeGreaterThan(0);
            expect(result.content[0].type).toBe('text');
            expect(typeof result.content[0].text).toBe('string');
            // Should find Cloud Migration Proposal
            expect(result.content[0].text).toContain('Cloud Migration Proposal');
        });
        it('should validate schema for tool execution (fail on invalid args)', async () => {
            await expect(handleCallTool({
                params: {
                    name: 'search_proposals',
                    arguments: { invalid_query: 123 }
                }
            })).rejects.toThrow();
        });
        it('should throw an error for unknown tools', async () => {
            await expect(handleCallTool({
                params: {
                    name: 'unknown_tool',
                    arguments: {}
                }
            })).rejects.toThrow('Unknown tool');
        });
    });
    describe('Resources: SharePoint Proposals', () => {
        it('should list mock proposals as resources', async () => {
            const resources = await handleListResources();
            expect(resources.resources.length).toBeGreaterThan(0);
            expect(resources.resources[0].uri).toMatch(/^sharepoint:\/\/proposals\/\d+$/);
            expect(resources.resources[0].name).toBeDefined();
        });
        it('should read a specific mock proposal resource', async () => {
            const resources = await handleListResources();
            const firstUri = resources.resources[0].uri;
            const resource = await handleReadResource({
                params: { uri: firstUri }
            });
            expect(resource.contents.length).toBe(1);
            expect(resource.contents[0].uri).toBe(firstUri);
            expect(typeof resource.contents[0].text).toBe('string');
        });
        it('should throw an error for unknown resources', async () => {
            await expect(handleReadResource({
                params: { uri: 'sharepoint://proposals/99999' }
            })).rejects.toThrow('Resource not found');
        });
    });
});
//# sourceMappingURL=index.test.js.map