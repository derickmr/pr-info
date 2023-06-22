import dotenv from 'dotenv';
import express from 'express';
import { PullRequestController } from './controllers/pullRequestController';

dotenv.config();

if (!process.env.GITHUB_TOKEN) {
    console.error('This app requires GitHub token to be set as GITHUB_TOKEN env var. More details in https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting. Exiting...');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

const router = express.Router();
new PullRequestController().register(router);
app.use(router);


export const server = app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}!`);
});