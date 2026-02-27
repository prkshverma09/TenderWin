import * as restify from 'restify';

export const createServer = (): restify.Server => {
    const server = restify.createServer({
        name: 'TenderWin Teams Bot Server',
    });

    server.use(restify.plugins.bodyParser());

    server.post('/api/handoff', (req, res, next) => {
        // Simulate receiving a handoff from Airia and triggering a proactive message
        // to the expert.
        res.send(200, {
            success: true,
            message: 'Handoff received and proactive message triggered'
        });
        return next();
    });

    return server;
};

// Start the server if this file is run directly
if (require.main === module) {
    const server = createServer();
    const port = process.env.PORT || 3978;
    server.listen(port, () => {
        console.log(`\n${server.name} listening to ${server.url}`);
    });
}
