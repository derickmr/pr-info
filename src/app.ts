import express, { Request, Response } from 'express';

const app = express();

app.get('/:owner/:repo/pulls', (req: Request, res: Response) => {
    const owner = req.params.owner;
    const repo = req.params.repo;

    res.send(`Repository URL: github.com/${owner}/${repo}`);
});

app.listen(3000, () => {
    console.log('App is listening on port 3000!');
});