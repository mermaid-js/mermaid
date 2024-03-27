import { IconLibrary } from "../svgRegister.js";
import database from "./database.js";
import server from "./server.js";
import disk from "./disk.js";
import internet from "./internet.js";

const defaultIconLibrary: IconLibrary = {
    database: database,
    server: server,
    disk: disk,
    internet: internet,
}

export default defaultIconLibrary