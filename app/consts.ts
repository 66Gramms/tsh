export const PATH_SEPARATOR = process.platform === "win32" ? ";" : ":";
export const HOME_DIRECTORY = require("os").homedir();
export const HISTORY_FILE = `${HOME_DIRECTORY}/.tsh_history`;
