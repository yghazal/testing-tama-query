import fs from "fs";
import { BigQuery } from "@google-cloud/bigquery";
import { isEqual } from "json-assert";

import { prepareArgs, prepareQuery } from "./prepareArgs.js";
let bigquery;

async function compareQueries() {
	const args = await prepareArgs();
	const queryBefore = prepareQuery("queryBefore", args);
	const queryAfter = prepareQuery("queryAfter", args);

	if (queryBefore && queryAfter) {
		const queryOptions = {
			keyFilename: "credentials.json",
			projectId: args.projectId,
		};

		bigquery = new BigQuery(queryOptions);

		const [resBefore, resAfter] = await Promise.all([
		queryBatch(queryBefore),
		queryBatch(queryAfter),
		]);

		if (isEqual(resBefore, resAfter, true)) {
			console.log("Results are identical 🔥");
			if(args.saveResults === 'true') {
				await Promise.all([
					saveResults(resBefore, "before"),
					saveResults(resAfter, "after"),
				]);
			}
		} else {
			console.log("Results are not identical 👹");
			if (args.saveResults !== 'false') {
				await Promise.all([
					saveResults(resBefore, "before"),
					saveResults(resAfter, "after"),
				]);
			}
		}
	} else {
		console.log("queryAfter.txt or queryBefore.txt cannot be empty");
	}
}

async function queryBatch(query) {
	const queryJobConfig = {
		query,
		useLegacySql: false,
		priority: "BATCH",
		allowLargeResults: true,
	};

	const [job] = await bigquery.createJob({ configuration: { query: queryJobConfig } });

	const jobId = job.metadata.id;
	const state = job.metadata.status.state;
	console.log(`Job ${jobId} is currently in state ${state}`);

	const [rows] = await job.getQueryResults({ autoPaginate: false });
	return rows;
}

async function saveResults(rows, destination) {
	console.log(`Saving results to results/${destination}.json`);
	await fs.writeFileSync(`./results/${destination}.json`, JSON.stringify(rows, null, 3));
	console.log(`Done Saving ${rows.length} rows to ${destination}.json`);
}

compareQueries();
