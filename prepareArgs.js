import fs from "fs";
import * as readline from "node:readline/promises";
import resultArrays from "./queries/resultArrays.js";

const tables = {
	authorView: "api-project-901373404215.Content.author",
	contentView: "api-project-901373404215.Content.content",
	cordialSupplementViewRealTime: "api-project-901373404215.cordial.supplements_realtime",
	cordialSupplementView: "api-project-901373404215.cordial.supplements",
	dataTableRealTime: "api-project-901373404215.DataMart.DataMart6_RT",
	dataTable: "api-project-901373404215.DataMart.DataMart7_Base",
	dataViewRealTime: "forbes-tamagotchi.Tamagotchi.v_DataMart6_RealTime",
	dataView: "forbes-tamagotchi.Tamagotchi.v_DataMart7",
	mainViewRealTime: "forbes-tamagotchi.Tamagotchi.v_Main6_RealTime",
	mainView: "forbes-tamagotchi.Tamagotchi.v_Main7",
	eventsTable: "api-project-901373404215.DataMart.Events_DataMart2",
	eventsView: "forbes-tamagotchi.Tamagotchi.v_Events_DataMart2",
	gaSessionsTable: "api-project-901373404215.206396628.ga_realtime_sessions_view",
	gscWebQueryTable: "api-project-901373404215.gsc.gsc_web_query",
	visitorInsightsTable: "api-project-901373404215.DataMart.FUSE7",
};

export async function prepareArgs() {
	const args = {};
	const now = new Date();
	process.argv.slice(2).forEach((arg) => {
		const [k, v] = arg.split("=");
		args[k] = v;
	});

	args.fromDate = args.fromDate || now.toISOString();
	args.toDate = args.toDate || getToDate(now);

	if (!args.projectId) {
		const lineReader = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		const projectId = await lineReader.question("Please enter your project id:\t");
		lineReader.close();
		args.projectId = projectId;
	}

	return args;
}

function getToDate(fromDate) {
	const toDate = new Date(fromDate).setDate(fromDate.getDate() - 3);
	return new Date(toDate).toISOString();
}

export function prepareQuery(title, args) {
	const fileName = `./queries/${title}.txt`;
	let query = fs.readFileSync(fileName, "utf8");

	if (query) {
		const { fromDate, toDate, sort, limit, useResults } = args;
		query = replaceKeywords(query, fromDate, toDate);

		if (useResults === "true") {
			const a = resultArrays[title];
			query = insertResultQueries(a, query);
		}

		if (sort) {
			query = `${query} ORDER BY ${sort}`;
		}

		if (limit) {
			query = `${query} LIMIT ${limit}`;
		}
	}

	return query;
}

function replaceKeywords(query, fromDate, toDate) {
	query = query.replaceAll("@fromDate", `DATE('${fromDate}')`);
	query = query.replaceAll("@toDate", `DATE('${toDate}')`);
	query = query.replaceAll(
		/[\$\\\`{}]|configService\.|authorView|contentView|cordialSupplementViewRealTime|cordialSupplementView|dataTableRealTime|dataTable|dataViewRealTime|dataView|mainViewRealTime|mainView|eventsTable|eventsView|gaSessionsTable|visitorInsightsTable|gscWebQueryTable/g,
		(m) => tables[m] || ""
	);

	return query;
}

function insertResultQueries(resultQueries, initQuery) {
	let finalQuery = initQuery;
	resultQueries.forEach((query) => {
		finalQuery = query.replaceAll("@table", `(${finalQuery})`);
	});

	return finalQuery;
}
