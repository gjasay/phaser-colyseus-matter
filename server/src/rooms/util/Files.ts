import * as fs from "fs";

export function ReadFileAsync(path: string): Promise<string> {
    return new Promise<string>((res, rej) => {
        fs.readFile(path, "utf8", (err, data) => {
            if (err) {
                rej(err);
            }
            res(data);
        });
    });
}
