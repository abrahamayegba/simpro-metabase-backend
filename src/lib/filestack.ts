import * as filestack from "filestack-js";

const client = filestack.init(process.env.FILESTACK_API_KEY!);

export default client;
