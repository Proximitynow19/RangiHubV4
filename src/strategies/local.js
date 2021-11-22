"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_local_1 = require("passport-local");
const webhead_1 = __importDefault(require("webhead"));
const moment_1 = __importDefault(require("moment"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const localStrategy = new passport_local_1.Strategy((username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!username || !password)
        return done({ code: 422, data: "Missing Fields.", success: false }, false);
    try {
        // @ts-ignore
        const webhead = new webhead_1.default();
        yield webhead.get("http://spider.rangitoto.school.nz/");
        const authState = webhead.$('input[type="hidden"]')[0].attribs.value;
        if ((_a = (yield webhead.submit(`form`, {
            AuthState: authState,
            username: username,
            password: password,
        })).data) === null || _a === void 0 ? void 0 : _a.includes("incorrect"))
            return done({ code: 401, data: "Incorrect Credentials.", success: false }, false);
        yield webhead.submit("form", {});
        const studentInfo = JSON.parse((yield webhead.post("https://spider.rangitoto.school.nz/Spider/Handlers/Student.asmx/GetStudents_IncludeHub", {
            json: {
                StudentKey: "",
                Surname: "",
                KnownAs: "",
                GivenName: "",
                Family: "",
                CurrentYear: "",
                Gender: "",
                Email: "",
                HomeTeacher: "",
                MemberHash: username,
                ShowDeparted: false,
                Barcode: "",
                CallHub: true,
            },
        })).data).d[0];
        const timetable = JSON.parse((yield webhead.post("https://spider.rangitoto.school.nz/Spider/Handlers/Timetable.asmx/GetTimeTable_ByStudentMode", {
            json: {
                StudentKey: studentInfo.StudentKey,
                Date: (0, moment_1.default)().format("DD/MM/YYYY"),
                Mode: "STT",
            },
        })).data).d;
        const photoResponse = yield (0, node_fetch_1.default)(`https://spider.rangitoto.school.nz/Spider/Handlers/ImageHandler.ashx?imageHeight=200&arg=${encodeURIComponent(studentInfo.ImageNameEncrypted)}`, { headers: { cookie: webhead.cookie } });
        const photoData = `data:/${photoResponse.headers.get("content-type")};base64,${Buffer.from(yield photoResponse.buffer()).toString("base64")}`;
        return done(null, { studentInfo, timetable, photoData });
    }
    catch (e) {
        console.error(e);
        return done({
            code: 500,
            data: "Unexpected Error Occurred. Please Try Again Later.",
            success: false,
        }, false);
    }
}));
exports.default = localStrategy;
